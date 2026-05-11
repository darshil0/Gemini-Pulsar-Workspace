/**
 * Application constants for Google Pulsar Workspace
 */

export const MODELS = {
  GEMINI_FLASH: "gemini-3-flash-preview",
  GEMINI_IMAGE: "gemini-2.5-flash-image",
  GEMINI_LIVE: "gemini-3.1-flash-live-preview",
} as const;

export const VOICE_CONFIG = {
  VOICE_NAME: "Zephyr",
  INPUT_SAMPLE_RATE: 16000,
  OUTPUT_SAMPLE_RATE: 24000,
} as const;

export const JITTER_BUFFER = {
  LOOKAHEAD: 0.15, // 150ms
  DRIFT_THRESHOLD: 1.0, // 1 second
} as const;

export const SYSTEM_INSTRUCTIONS = {
  VOICE: "You are Pulsar, a helpful voice assistant. Keep responses concise and natural for conversation.",
} as const;

export const IMAGE_STYLES = [
  { id: 'cyberpunk', label: 'Cyberpunk', iconName: 'Sparkles', prompt: 'Apply a high-tech, neon-drenched cyberpunk aesthetic with deep blues and purples.' },
  { id: 'sketch', label: 'Sketch', iconName: 'Palette', prompt: 'Transform into a detailed pencil sketch or charcoal drawing.' },
  { id: 'watercolor', label: 'Watercolor', iconName: 'Palette', prompt: 'Apply a delicate watercolor painting effect with visible brush strokes and soft edges.' },
  { id: 'vintage', label: 'Vintage', iconName: 'Camera', prompt: 'Apply an aged, film-like vintage aesthetic with light leaks and grain.' },
  { id: 'nobg', label: 'Remove BG', iconName: 'Eraser', prompt: 'Remove the background and place the subject on a clean, professional studio background.' },
  { id: 'enhance', label: 'Enhance', iconName: 'Wand2', prompt: 'Enhance details, lighting, and colors while maintaining the original subject.' },
] as const;

