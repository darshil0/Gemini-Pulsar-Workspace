import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import { MODELS } from "./src/config/constants";

dotenv.config();

const app = express();
const PORT = 3000;

// Gemini client initialization
let genAI: GoogleGenAI | null = null;
function getAI() {
  if (!genAI) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) throw new Error("GEMINI_API_KEY is missing");
    genAI = new GoogleGenAI({ apiKey: key });
  }
  return genAI;
}

app.use(express.json({ limit: '10mb' }));

// API Routes
app.get("/api/health", (req, res) => {
  const hasKey = !!process.env.GEMINI_API_KEY;
  res.json({ status: "ok", hasApiKey: hasKey });
});

app.get("/api/config", (req, res) => {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return res.status(500).json({ error: "Gemini API key is not set on the server." });
  res.json({ apiKey: key });
});

app.post("/api/analyze-email", async (req, res) => {
  try {
    const { emailContent } = req.body;
    if (!emailContent || typeof emailContent !== 'string') {
      return res.status(400).json({ error: "Invalid email content provided." });
    }
    
    const ai = getAI();
    const result = await ai.models.generateContent({
      model: MODELS.GEMINI_FLASH,
      contents: [{ role: 'user', parts: [{ text: `Analyze the following email content and provide structured data including:
      1. Category (e.g., Work, Personal, Spam, Newsletter)
      2. Priority (low, medium, high, urgent)
      3. Mood of the sender
      4. List of action items
      5. A professional draft reply
      
      Email Content:
      "${emailContent}"` }]}],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            category: { type: Type.STRING },
            priority: { type: Type.STRING, enum: ['low', 'medium', 'high', 'urgent'] },
            mood: { type: Type.STRING },
            actionItems: { 
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            draftReply: { type: Type.STRING }
          },
          required: ["category", "priority", "mood", "actionItems", "draftReply"]
        }
      }
    });

    const text = result.text;
    res.json(JSON.parse(text || '{}'));
  } catch (error: any) {
    console.error("Analysis Error:", error);
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/transform-image", async (req, res) => {
  try {
    const { imageBase64, mimeType, instruction } = req.body;
    
    if (!imageBase64 || !mimeType || !instruction) {
      return res.status(400).json({ error: "Missing required fields (imageBase64, mimeType, instruction)." });
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
          }
        ]
      }
    });

    let imageUrl = "";
    let analysis = "";

    const parts = result.candidates?.[0]?.content?.parts || [];
    for (const part of parts) {
      if (part.inlineData) {
        imageUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      } else if (part.text) {
        analysis += part.text;
      }
    }

    res.json({ imageUrl, analysis });
  } catch (error: any) {
    console.error("Transformation Error:", error);
    res.status(500).json({ error: error.message });
  }
});

// For Live Voice, since bidirectional streaming from client to server to Gemini is heavy for a simple dashboard,
// we could use a custom endpoint to return a secure session token or simply acknowledge that 
// in this environment, for a full-stack experience, we'd normally proxy the WS.
// However, the simplest fix for "Keeping key hidden" while using SDK live is to pass the key via a server-side managed process.
// But the client-side Google SDK *can* be used if we don't expose the key in the bundle.
// The real fix is to never put the key in vite.config.ts define, and instead fetch it or use a proxy.

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    // Create Vite server in middleware mode
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
