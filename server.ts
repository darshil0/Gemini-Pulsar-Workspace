import express from 'express';
import path from 'path';
import http from 'http';
import cors from 'cors';
import { WebSocketServer } from 'ws';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type, Modality } from '@google/genai';
import dotenv from 'dotenv';
import crypto from 'crypto';
import { MODELS, VOICE_CONFIG, SYSTEM_INSTRUCTIONS } from './src/config/constants';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// CORS setup to secure API routes and allow authorized access
app.use(
  cors({
    origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : true,
    credentials: true,
  }),
);

// Request Tracking Middleware for system observability (Issue #27)
app.use((req, res, next) => {
  const reqId = crypto.randomUUID();
  req.headers['x-request-id'] = reqId;
  const start = Date.now();
  res.on('finish', () => {
    const elapsed = Date.now() - start;
    console.log(
      `[SYS-TRACK] id=${reqId} method=${req.method} path=${req.path} status=${res.statusCode} elapsed=${elapsed}ms`,
    );
  });
  next();
});

// Configure request limits to prevent Denials of Service (Issue #2)
app.use(express.json({ limit: '4mb' }));

// Express body limit error handler to return 413 Payload Too Large (Issue #2)
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (err && err.type === 'entity.too.large') {
    return res.status(413).json({ error: 'Payload too large. Maximum allowed size is 4MB.' });
  }
  next(err);
});

// Memory storage for rate limiting to protect API endpoints against resource exhaustion (Issue #21)
const apiRateLimits: Record<string, { count: number; resetTime: number }> = {};
function apiRateLimiter(windowMs: number, maxRequests: number) {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const rawIp =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      req.socket.remoteAddress ||
      'global_fallback_ip';
    const now = Date.now();

    // Periodic cleanup of expired rate limit entries to prevent unbounded memory growth
    if (Math.random() < 0.1) {
      for (const key in apiRateLimits) {
        if (apiRateLimits[key].resetTime < now) {
          delete apiRateLimits[key];
        }
      }
    }

    if (!apiRateLimits[rawIp] || now > apiRateLimits[rawIp].resetTime) {
      apiRateLimits[rawIp] = {
        count: 1,
        resetTime: now + windowMs,
      };
      res.setHeader('X-RateLimit-Limit', maxRequests);
      res.setHeader('X-RateLimit-Remaining', maxRequests - 1);
      res.setHeader('X-RateLimit-Reset', Math.ceil(apiRateLimits[rawIp].resetTime / 1000));
      return next();
    }

    if (apiRateLimits[rawIp].count >= maxRequests) {
      res.setHeader('X-RateLimit-Limit', maxRequests);
      res.setHeader('X-RateLimit-Remaining', 0);
      res.setHeader('X-RateLimit-Reset', Math.ceil(apiRateLimits[rawIp].resetTime / 1000));
      const retryAfterSeconds = Math.ceil((apiRateLimits[rawIp].resetTime - now) / 1000);
      res.setHeader('Retry-After', retryAfterSeconds);
      return res.status(429).json({
        error: `Too many requests. Rate limit exceeded. Try again in ${retryAfterSeconds} seconds.`,
      });
    }

    apiRateLimits[rawIp].count += 1;
    res.setHeader('X-RateLimit-Limit', maxRequests);
    res.setHeader('X-RateLimit-Remaining', maxRequests - apiRateLimits[rawIp].count);
    res.setHeader('X-RateLimit-Reset', Math.ceil(apiRateLimits[rawIp].resetTime / 1000));
    next();
  };
}

// Gemini client lazy initialization
let genAI: GoogleGenAI | null = null;
function getAI() {
  if (!genAI) {
    const key = process.env.GEMINI_API_KEY;
    if (!key)
      throw new Error('GEMINI_API_KEY environment variable is not configured on the server.');
    genAI = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return genAI;
}

// REST endpoints
app.get('/api/health', (req, res) => {
  const hasKey = !!process.env.GEMINI_API_KEY;
  res.json({ status: 'ok', hasApiKey: hasKey });
});

// REMOVED /api/config endpoint to lock down API key security (Issue #1)

app.post('/api/analyze-email', apiRateLimiter(60000, 20), async (req, res) => {
  try {
    const { emailContent } = req.body;
    if (!emailContent || typeof emailContent !== 'string') {
      return res.status(400).json({
        error: "Invalid email content provided. Field 'emailContent' must be a non-empty string.",
      });
    }

    const ai = getAI();
    const result = await ai.models.generateContent({
      model: MODELS.GEMINI_FLASH,
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: `Analyze the following email content and provide structured data including:
          1. Category (e.g., Work, Personal, Spam, Newsletter)
          2. Priority (low, medium, high, urgent)
          3. Mood of the sender
          4. List of action items
          5. A professional draft reply
          
          Email Content:
          "${emailContent}"`,
            },
          ],
        },
      ],
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            category: { type: Type.STRING },
            priority: { type: Type.STRING, enum: ['low', 'medium', 'high', 'urgent'] },
            mood: { type: Type.STRING },
            actionItems: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            draftReply: { type: Type.STRING },
          },
          required: ['category', 'priority', 'mood', 'actionItems', 'draftReply'],
        },
      },
    });

    const text = result.text;
    res.json(JSON.parse(text || '{}'));
  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : 'Internal Error';
    console.error('Email analysis error:', errMessage);
    res.status(500).json({ error: 'Failed to analyze email content. ' + errMessage });
  }
});

app.post('/api/transform-image', apiRateLimiter(60000, 20), async (req, res) => {
  try {
    const { imageBase64, mimeType, instruction } = req.body;

    if (!imageBase64 || !mimeType || !instruction) {
      return res
        .status(400)
        .json({ error: 'Missing required fields (imageBase64, mimeType, instruction).' });
    }

    // Server-side Image Size Validation (Issue #2)
    const approxSizeInBytes = (imageBase64.length * 3) / 4;
    if (approxSizeInBytes > 4 * 1024 * 1024) {
      return res.status(413).json({ error: 'Image is too large. Maximum size allowed is 4MB.' });
    }

    const ai = getAI();
    const result = await ai.models.generateContent({
      model: MODELS.GEMINI_IMAGE,
      contents: {
        parts: [
          {
            inlineData: {
              data: imageBase64,
              mimeType: mimeType,
            },
          },
          {
            text: `Instruction: ${instruction}
            
            Task: Act as a creative image editor. 
            If the instruction is a style (e.g., Cyberpunk, Sketch), re-imagine the provided image in that style. 
            If the instruction is a modification (e.g., "Add a cat"), describe the resulting image in vivid detail.
            
            Return the result in two parts:
            1. An inline image if you can generate it (multi-modal).
            2. A textual 'Creative Analysis' of the transformation.`,
          },
        ],
      },
    });

    let imageUrl = '';
    let analysis = '';

    const parts = result.candidates?.[0]?.content?.parts || [];
    for (const part of parts) {
      if (part.inlineData) {
        imageUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      } else if (part.text) {
        analysis += part.text;
      }
    }

    res.json({ imageUrl, analysis });
  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : 'Internal Error';
    console.error('Image transformation error:', errMessage);
    res.status(500).json({ error: 'Failed to transform image. ' + errMessage });
  }
});

const server = http.createServer(app);

// WebSocket server setup for secure Live Voice Proxy (Issue #1)
const wss = new WebSocketServer({ noServer: true });

wss.on('connection', async (clientWs) => {
  console.log('Secure vocal proxy connection established.');
  let liveSession: any = null;

  try {
    const ai = getAI();
    liveSession = await ai.live.connect({
      model: MODELS.GEMINI_LIVE,
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: VOICE_CONFIG.VOICE_NAME } },
        },
        systemInstruction: SYSTEM_INSTRUCTIONS.VOICE,
        outputAudioTranscription: {},
      },
      callbacks: {
        onopen: () => {
          if (clientWs.readyState === clientWs.OPEN) {
            clientWs.send(JSON.stringify({ type: 'open' }));
          }
        },
        onmessage: (message: any) => {
          if (clientWs.readyState === clientWs.OPEN) {
            clientWs.send(JSON.stringify({ type: 'message', message }));
          }
        },
        onerror: (err: any) => {
          console.error('Gemini LIVE back-to-back stream integration error:', err);
          if (clientWs.readyState === clientWs.OPEN) {
            clientWs.send(JSON.stringify({ type: 'error', error: err.message || String(err) }));
          }
        },
        onclose: () => {
          if (clientWs.readyState === clientWs.OPEN) {
            clientWs.send(JSON.stringify({ type: 'close' }));
          }
        },
      },
    });

    clientWs.on('message', (raw) => {
      try {
        const payload = JSON.parse(raw.toString());
        if (payload.audio && liveSession) {
          liveSession.sendRealtimeInput({
            audio: {
              data: payload.audio.data,
              mimeType: payload.audio.mimeType,
            },
          });
        }
      } catch (err) {
        console.error('Vocal proxy socket relay failure:', err);
      }
    });
  } catch (err: any) {
    console.error('Secure vocal live session initialization failure:', err);
    if (clientWs.readyState === clientWs.OPEN) {
      clientWs.send(
        JSON.stringify({ type: 'error', error: err.message || 'Session initialization failed' }),
      );
    }
    clientWs.close();
    return;
  }

  const closeLiveSession = () => {
    if (liveSession) {
      try {
        liveSession.close();
      } catch (e) {}
      liveSession = null;
    }
  };

  clientWs.on('close', () => {
    console.log('Secure vocal proxy socket closed.');
    closeLiveSession();
  });

  clientWs.on('error', (err) => {
    console.error('Secure vocal proxy socket error:', err);
    closeLiveSession();
  });
});

// Handle upgrade from HTTP to WebSocket protocol securely
server.on('upgrade', (request, socket, head) => {
  const { pathname } = new URL(request.url || '', `http://${request.headers.host}`);
  if (pathname === '/api/live') {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request);
    });
  } else {
    socket.destroy();
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server configuration deployed. Running on http://localhost:${PORT}`);
  });
}

startServer();
