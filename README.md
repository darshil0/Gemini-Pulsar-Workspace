# Google Pulsar Workspace

Integrated AI productivity suite with email analysis, image generation, and real-time voice interaction via Gemini API.

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Last Commit](https://img.shields.io/badge/last%20commit-May%202026-brightgreen.svg)]()
[![TypeScript](https://img.shields.io/badge/TypeScript-6.0-blue.svg?logo=typescript&logoColor=white)]()
[![React](https://img.shields.io/badge/React-19.0-61DAFB.svg?logo=react&logoColor=black)]()
[![Vite](https://img.shields.io/badge/Vite-8.0-646CFF.svg?logo=vite&logoColor=white)]()

## What It Does

Three interconnected workspaces: email threading with multi-layer sentiment & priority detection, image remix with preset styles, and low-latency voice streaming with 24kHz PCM buffers and visual feedback.

## Features

**Email Helper**: Analyzes threads for category, priority, and tone. Generates response drafts. History cached in `localStorage` with 24h TTL—no server persistence, PII scrubbed from logs.

**Image Studio**: Upload and transform via natural language. Presets: Cyberpunk, Sketch, Watercolor. Memory-safe with `URL.createObjectURL()` cleanup; no leaks on multi-image workflows.

**Vocal Workspace**: Real-time voice I/O over WebSocket. Adaptive 150ms jitter buffer handles network drift. Hard interruption logic kills active `AudioBufferSourceNode` playbacks to prevent overlap. Orbital visualizer shows real-time frequency feedback.

**Notifications**: Global context-aware alerts (success, error, info) with non-blocking UI.

**UI**: Clean minimalism—glassmorphism, fluid motion, responsive bento grid.

## How It Works

### Audio Pipeline (useAudioLive)

Streams 24kHz PCM over WebSocket. Maintains 150ms lookahead to absorb latency spikes. If playback clock drifts >1s from server, auto-resync. Active sources ref prevents overlapping playback on user interruption—eliminates crackling.

### Privacy & Data

Email history = `localStorage` only, auto-pruned >24h. Error logs filtered to prevent email content in console. No server-side retention of analysis data.

### Memory Management

Image uploads/generations use `URL.createObjectURL()` → `URL.revokeObjectURL()` on cleanup. Explicit lifecycle prevents leaks in long sessions.

### Security: Server-Side Proxy

Raw `GEMINI_API_KEY` lives in Node.js (`server.ts`) only. Client requests routed through `/api/*` endpoints. Validation: immediate payload checks, 400 Bad Request on malformed input. Health check: `/api/health` confirms config readiness without exposing secrets.

### Deployment & Observability

Targets Kubernetes/Cloud Run. `/api/health` probe for orchestrators. Request tracing: unique `x-request-id` headers, latency + status logged to stdout. Dynamic port binding: `process.env.PORT` with fallback to 3000.

## Tech Stack

**Frontend**: React 18 + Vite, Tailwind 4, Framer Motion (`motion/react`), D3/Recharts, date-fns, Lucide.

**Backend**: Node.js, Google GenAI SDK.

**Models**: `gemini-1.5-flash` (text/image), `gemini-2.0-flash-exp` (multimodal live).

**Language**: TypeScript 6.0.

## Structure

```
/src/components/workspaces  → Email, Image, Voice modules
/src/context                → Global state (notifications, etc.)
/src/hooks                  → useAudioLive, custom reactive logic
/src/services               → API clients, Gemini integration
/src/config                 → Types, constants
/src/lib                    → Utilities
/src/App.tsx                → Shell & layout
```

## Setup

1. Set `GEMINI_API_KEY` via Settings.
2. Single Gemini client instance for resource optimization.
3. Navigate to Vocal Workspace → WebSocket connects → 24kHz streams + orbital feedback.

## Validation Checklist

**Email Analysis**: Precondition = valid thread; ensure category/priority output, draft quality. Check PII scrubbing in error logs.

**Image Transforms**: Upload → preset apply → verify URL cleanup (no dangling refs). Test multi-image workflows for memory stability.

**Voice Streaming**: WebSocket connection → audio buffering → interruption kill-switch. Monitor jitter buffer drift correction.

**API Security**: Verify `GEMINI_API_KEY` never exposed in client. Health check returns `{ "status": "ok", "hasApiKey": true }`.

**Deployment**: Port binding, request tracing middleware, health probe integration with orchestrator.

## License

MIT. See LICENSE.
