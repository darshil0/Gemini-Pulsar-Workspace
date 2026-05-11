import { LiveServerMessage } from "@google/genai";

/**
 * Core type definitions for Google Pulsar Workspace
 */

export type Priority = 'low' | 'medium' | 'high' | 'urgent';

export interface EmailAnalysis {
  category: string;
  priority: Priority;
  mood: string;
  actionItems: string[];
  draftReply: string;
}

export interface ImageTransformationResult {
  imageUrl: string;
  analysis: string;
}

export type ActiveTab = 'email' | 'image' | 'voice' | 'settings';

export interface LiveVoiceCallbacks {
  onopen?: () => void;
  onmessage?: (message: LiveServerMessage) => void;
  onerror?: (error: any) => void;
  onclose?: () => void;
}
