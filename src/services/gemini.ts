import { 
  EmailAnalysis, 
  ImageTransformationResult, 
  LiveVoiceCallbacks 
} from "../config/types";
import { MODELS, SYSTEM_INSTRUCTIONS, VOICE_CONFIG } from "../config/constants";
import { GoogleGenAI, Modality } from "@google/genai";

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
  * Establishes a live WebSocket connection for low-latency voice interaction.
  */
export const connectLiveVoice = async (callbacks: LiveVoiceCallbacks) => {
  // Fetch key securely at runtime (Issue #1, #20)
  const configResponse = await fetch("/api/config");
  if (!configResponse.ok) throw new Error("Failed to fetch runtime configuration");
  const { apiKey } = await configResponse.json();
  
  const genAI = new GoogleGenAI({ apiKey });
  
  return genAI.live.connect({
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
      onopen: callbacks.onopen || (() => {}),
      onmessage: callbacks.onmessage || (() => {}),
      onerror: callbacks.onerror || (() => {}),
      onclose: callbacks.onclose || (() => {}),
    }
  });
};



