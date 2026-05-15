# Google Pulsar Workspace

A high-performance AI dashboard featuring an intelligent email assistant, generative image studio, and a real-time vocal workspace powered by Gemini.

## 🚀 Features

- **Email Helper**: Multi-layered analysis of incoming threads including category detection, priority calculation, and tone sentiment.
    - **Session History**: Persists up to 5 analysis results in `localStorage` with a 24-hour Time-To-Live (TTL) for privacy-conscious convenience.
    - **Draft Generation**: Intelligent response generation based on the analyzed mood and context.
- **Image Studio**: Upload and remix assets using vision-guided instructions and preset styles.
    - **Memory Efficiency**: Utilizes `URL.createObjectURL` and explicit cleanup with `URL.revokeObjectURL` to handle binary assets without memory leaks.
    - **Quick Styles**: One-tap presets for Cyberpunk, Sketch, Watercolor, and more.
- **Vocal Workspace**: Low-latency, streaming voice interaction with real-time feedback.
    - **Adaptive Jitter Buffer**: A custom 150ms lookahead logic in `useAudioLive` to absorb network fluctuations and prevent audio "crackling" at 24kHz.
    - **Orbital Visualizer**: A canvas-based frequency visualizer that provides real-time orbital feedback of the model's vocal output.
- **Notification System**: A global, context-aware notification provider (`useNotification`) for non-blocking success, error, and info alerts.
- **Modern UI**: Polished "Clean Minimalism" theme with glassmorphism effects, fluid animations, and a responsive bento-grid layout.

## 🛠️ Technical Implementation Details

### 1. Adaptive Jitter Buffer & Interruption Logic (Audio)
To handle 24kHz PCM audio streams over WebSockets, the `useAudioLive` hook implements a custom jitter management strategy:
- **Lookahead**: 150ms buffer to absorb network latency spikes.
- **Drift Correction**: Automatically re-syncs the `playTime` if the audio clock drifts more than 1 second from the server output.
- **Hard Interruption**: Uses an `activeSourcesRef` to immediately kill all scheduled `AudioBufferSourceNode` playbacks when an interruption signal is received, preventing "overlapping voices."

### 2. Privacy & Transient History
The Email Helper implements a "Transient Persistence" model:
- **Pruning**: Automatically removes history entries older than 24 hours.
- **Local Isolation**: All history is stored in `localStorage`, remaining strictly within the user's browser environment.
- **PII Scrubbing**: Error logs are filtered to prevent sensitive email content from leaking into browser consoles.

### 3. Binary Asset Optimization & Safety
The Image Studio uses a lazy-loading and proactive cleanup pattern:
- **Memory Safety**: Every uploaded or generated image URL is created via `URL.createObjectURL` and explicitly destroyed via `URL.revokeObjectURL` when the session is cleared or the image is replaced to prevent memory leaks in long sessions.
- **Error Boundaries**: Comprehensive error handling for image analysis failures with detailed UI feedback.

## 🛠️ Tech Stack

- **Framework**: React 18 + Vite
- **Styling**: Tailwind CSS 4
- **Animation**: Framer Motion (`motion/react`)
- **Data Viz**: D3.js + Recharts
- **Utilities**: Date-fns
- **AI Backend**: Google GenAI SDK
    - **Processing**: `gemini-3-flash-preview`
    - **Vision**: `gemini-2.5-flash-image`
    - **Multimodal Live**: `gemini-3.1-flash-live-preview`
- **Icons**: Lucide React

## 🚥 Getting Started

1. Set your `GEMINI_API_KEY` in the environment variables (via the Settings menu).
2. The application uses a single singleton `GoogleGenAI` instance for optimal resource usage.
3. Access the **Vocal Workspace** to engage in real-time, ultra-low latency voice conversation.

## 🏗️ Architecture

- `/src/components`: UI modules for Email, Image, and Voice workspaces.
- `/src/hooks`: 
    - `useAudioLive.ts`: Manages MediaStream, ScriptProcessor, and PCM->Base64 conversion for bidirectional Gemini Live audio.
    - `useNotification.tsx`: Global notification context and provider logic.
- `/src/services/gemini.ts`: Centralized service for SDK initialization and API calling patterns.
- `/src/types.ts`: Centralized TypeScript interfaces for type-safe cross-component communication.
- `/src/constants.ts`: Global configuration (sample rates, model names, style prompts).
- `/src/index.css`: Global design system including Tailwind 4 variables and glassmorphism utilities.
