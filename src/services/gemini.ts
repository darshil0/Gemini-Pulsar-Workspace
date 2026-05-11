import { GoogleGenAI, Type, Modality } from "@google/genai";
import { EmailAnalysis, ImageTransformationResult, LiveVoiceCallbacks } from "../types";
import { MODELS, SYSTEM_INSTRUCTIONS, VOICE_CONFIG } from "../constants";

// Initialize with lazy loading as per best practices
let genAIInstance: GoogleGenAI | null = null;

/**
 * Ensures a single instance of the GoogleGenAI SDK is created.
 * @returns The GoogleGenAI instance.
 */
const getAI = () => {
  if (!genAIInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("GEMINI_API_KEY is not set.");
    }
    genAIInstance = new GoogleGenAI({ apiKey: apiKey || '' });
  }
  return genAIInstance;
};

/**
 * Analyzes an email's content using Gemini to extract tone, priority, and action items.
 * @param emailContent Raw text of the email thread.
 * @returns Structured analysis and a draft reply.
 */
export const analyzeEmail = async (emailContent: string): Promise<EmailAnalysis> => {
  const ai = getAI();
  try {
    const response = await ai.models.generateContent({
      model: MODELS.GEMINI_FLASH,
      contents: `Analyze the following email content and provide structured data including:
      1. Category (e.g., Work, Personal, Spam, Newsletter)
      2. Priority (low, medium, high, urgent)
      3. Mood of the sender
      4. List of action items
      5. A professional draft reply
      
      Email Content:
      "${emailContent.replace(/"/g, '\"')}"`,
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

    const text = response.text;
    if (!text) throw new Error("No response from Gemini");
    return JSON.parse(text) as EmailAnalysis;
  } catch (error) {
    console.error("Error analyzing email:", error);
    throw error;
  }
};

/**
 * Transforms an image based on user instructions using Gemini Vision-to-Gen capabilities.
 * @param imageBase64 Base64 encoded image string.
 * @param mimeType Image MIME type.
 * @param instruction Transformation instruction or style.
 * @returns Transformed image URL or descriptive analysis.
 */
export const transformImage = async (
  imageBase64: string, 
  mimeType: string, 
  instruction: string
): Promise<ImageTransformationResult> => {
  const ai = getAI();
  try {
    const response = await ai.models.generateContent({
      model: MODELS.GEMINI_IMAGE,
      contents: {
        parts: [
          {
            inlineData: {
              data: imageBase64.split(',')[1] || imageBase64,
              mimeType: mimeType,
            },
          },
          {
            text: `Please modify this image based on the following instruction or style: "${instruction}". 
            If you are unable to generate a new image, provide a detailed creative analysis of how the image would look after such a transformation.`,
          },
        ],
      }
    });

    let imageUrl = "";
    let analysis = "";

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        imageUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      } else if (part.text) {
        analysis += part.text;
      }
    }

    return { imageUrl, analysis };
  } catch (error) {
    console.error("Error transforming image:", error);
    throw error;
  }
};

/**
 * Establishes a live WebSocket connection for low-latency voice interaction.
 * @param callbacks Event hooks for transcription and audio output.
 * @returns The active Live session.
 */
export const connectLiveVoice = (callbacks: LiveVoiceCallbacks) => {
  const ai = getAI();
  return ai.live.connect({
    model: MODELS.GEMINI_LIVE,
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: { prebuiltVoiceConfig: { voiceName: VOICE_CONFIG.VOICE_NAME } },
      },
      systemInstruction: SYSTEM_INSTRUCTIONS.VOICE,
      outputAudioTranscription: {},
    },
    callbacks: callbacks as any
  });
};



