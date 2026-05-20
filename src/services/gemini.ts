import { 
  EmailAnalysis, 
  ImageTransformationResult, 
  LiveVoiceCallbacks 
} from "../config/types";
import { MODELS, VOICE_CONFIG } from "../config/constants";

/**
  * Analyzes an email's content using the backend proxy.
  */
export const analyzeEmail = async (emailContent: string): Promise<EmailAnalysis> => {
  const response = await fetch("/api/analyze-email", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ emailContent }),
  });
  if (!response.ok) throw new Error("Failed to analyze email via proxy");
  return response.json();
};

/**
  * Transforms an image using the backend proxy.
  */
export const transformImage = async (
  imageBase64: string, 
  mimeType: string, 
  instruction: string
): Promise<ImageTransformationResult> => {
  // Strip header before sending to reduce payload overhead if needed, 
  // but backend expects the data specifically. 
  // Issue #7 says split should happen at point of storage or documented.
  const data = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64;

  const response = await fetch("/api/transform-image", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ imageBase64: data, mimeType, instruction }),
  });
  if (!response.ok) throw new Error("Failed to transform image via proxy");
  return response.json();
};

/**
  * Establishes a live WebSocket connection via the server-side proxy for secure, low-latency voice interaction.
  */
export const connectLiveVoice = async (callbacks: LiveVoiceCallbacks) => {
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  const wsUrl = `${protocol}//${window.location.host}/api/live`;
  const ws = new WebSocket(wsUrl);

  ws.onopen = () => {
    // Connection established; wait for server-side Gemini live ready signal
  };

  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      if (data.type === 'open') {
        if (callbacks.onopen) callbacks.onopen();
      } else if (data.type === 'message') {
        if (callbacks.onmessage) callbacks.onmessage(data.message);
      } else if (data.type === 'error') {
        if (callbacks.onerror) callbacks.onerror(new Error(data.error));
      } else if (data.type === 'close') {
        if (callbacks.onclose) callbacks.onclose();
      }
    } catch (err) {
      console.error("Vocal frame client parsing failure:", err);
    }
  };

  ws.onerror = (err) => {
    if (callbacks.onerror) callbacks.onerror(err);
  };

  ws.onclose = () => {
    if (callbacks.onclose) callbacks.onclose();
  };

  return {
    sendRealtimeInput: (input: any) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ audio: input.audio }));
      }
    },
    close: () => {
      if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
        ws.close();
      }
    }
  };
};



