import { GoogleGenAI, Type, Modality } from "@google/genai";

// Initialize with lazy loading as per best practices
let genAIInstance: GoogleGenAI | null = null;

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

export interface EmailAnalysis {
  category: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  mood: string;
  actionItems: string[];
  draftReply: string;
}

export const analyzeEmail = async (emailContent: string): Promise<EmailAnalysis> => {
  const ai = getAI();
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
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
    return JSON.parse(text);
  } catch (error) {
    console.error("Error analyzing email:", error);
    throw error;
  }
};

export const transformImage = async (
  imageBase64: string, 
  mimeType: string, 
  instruction: string
): Promise<{ imageUrl: string; analysis: string }> => {
  const ai = getAI();
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
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

export const connectLiveVoice = (callbacks: any) => {
  const ai = getAI();
  return ai.live.connect({
    model: "gemini-3.1-flash-live-preview",
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: { prebuiltVoiceConfig: { voiceName: "Zephyr" } },
      },
      systemInstruction: "You are Pulsar, a helpful voice assistant. Keep responses concise and natural for conversation.",
      outputAudioTranscription: {},
    },
    ...callbacks
  });
};


