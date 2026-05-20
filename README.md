# Google Pulsar Workspace

A high-performance AI dashboard featuring an intelligent email assistant, generative image studio, and a real-time vocal workspace powered by Gemini.

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Last Commit](https://img.shields.io/badge/last%20commit-May%202026-brightgreen.svg)]()
[![TypeScript](https://img.shields.io/badge/TypeScript-6.0-blue.svg?logo=typescript&logoColor=white)]()
[![React](https://img.shields.io/badge/React-19.0-61DAFB.svg?logo=react&logoColor=black)]()
[![Vite](https://img.shields.io/badge/Vite-8.0-646CFF.svg?logo=vite&logoColor=white)]()

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
- **Memory Safety**: Every uploaded or generated image URL is created via `URL.createObjectURL` and explicitly destroyed via `URL.revokeObjectURL` (both script worklet URLs and user imagery) when the session is cleared or the image is replaced to prevent memory leaks in long sessions.
- **Error Boundaries**: Comprehensive error handling for image analysis failures with detailed UI feedback.

### 4. Full-Stack Proxy & API Security Architecture
To guarantee API key secrecy and full compliance with our security standards:
- **Server-Side API Proxy**: Raw `GEMINI_API_KEY` is maintained exclusively inside Node.js (`server.ts`). Client tasks such as email analysis and image transformation are proxied through local REST endpoints (`/api/*`).
- **Endpoint validation**: Server routes validate payloads immediately, preventing unhandled exceptions and returning standard validation errors (400 Bad Request) on empty inputs.
- **Client Handshake**: The user interface does not expose or directly manipulate raw secrets. Instead, it queries the non-leaking `/api/health` status handshake on load to render the "System Ready" indicators and workspace states.

### 5. Deployment, Health Checks & Observability (Issue #23, #27)
For seamless integration into containerized orchestrators (e.g., Kubernetes, Cloud Run):
- **Health Handshakes**: The `/api/health` path exposes a lightweight probe checking whether server configuration keys exist. It returns `{ "status": "ok", "hasApiKey": true }` to identify deployment health status immediately.
- **Request Tracing Middleware**: A structured logging engine generates high-entropy tracking headers (in the form of `x-request-id`) for incoming REST payloads, rendering exact latencies and status codes in stdout.
- **Port Dynamic Binding**: The service automatically conforms to generic container standards by binding dynamically to `process.env.PORT` before defaulting to local fallback `3000`.

## 🛠️ Tech Stack

- **Framework**: React 18 + Vite
- **Styling**: Tailwind CSS 4
- **Animation**: Framer Motion (`motion/react`)
- **Data Viz**: D3.js + Recharts
- **Utilities**: Date-fns
- **AI Backend**: Google GenAI SDK (Node-level with secure local runtime queries)
    - **Processing**: `gemini-1.5-flash`
    - **Vision**: `gemini-1.5-flash`
    - **Multimodal Live**: `gemini-2.0-flash-exp`
- **Icons**: Lucide React

## 🚥 Getting Started

1. Set your `GEMINI_API_KEY` in the environment variables (via the Settings menu).
2. The application uses a single singleton `GoogleGenAI` instance for optimal resource usage.
3. Access the **Vocal Workspace** to engage in real-time, ultra-low latency voice conversation.

## 🏗️ Architecture

- `/src/components/workspaces`: Feature-specific modules for Email, Image, and Voice workspaces.
- `/src/context`: Global application state providers (e.g., `NotificationContext.tsx`).
- `/src/hooks`: Custom reactive logic hooks like `useAudioLive.ts`.
- `/src/services`: Centralized API clients and service logic (e.g., `gemini.ts`).
- `/src/config`: Global types and system constants.
- `/src/lib`: Core utility functions and shared helpers.
- `/src/App.tsx`: Main application shell and layout structure.
