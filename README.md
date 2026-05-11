# Gemini Pulsar Workspace

A high-performance AI dashboard featuring an intelligent email assistant, generative image studio, and a real-time vocal workspace powered by Gemini.

## 🚀 Features

- **Email Helper**: Multi-layered analysis of incoming threads including category detection, priority calculation, and tone sentiment. Now includes **Session History** to revisit recent analyses.
- **Image Studio**: Upload and remix assets using vision-guided instructions and preset styles. Optimized with memory-efficient Blob handling.
- **Vocal Workspace**: Low-latency, streaming voice interaction with **Adaptive Jitter Buffer** (150ms) and visual orbital frequency feedback.
- **Modern UI**: Polished "Clean Minimalism" theme with glassmorphism effects, fluid animations, and a responsive bento-grid layout.

## 🛠️ Tech Stack

- **Framework**: React 18 + Vite
- **Styling**: Tailwind CSS 4
- **Animation**: Framer Motion (motion/react)
- **AI Backend**: Google GenAI SDK (Gemini 3 Flash, Gemini 2.5 Flash Image, and Gemini 3.1 Live)
- **Icons**: Lucide React

## 🚥 Getting Started

1. Set your `GEMINI_API_KEY` in the environment variables.
2. The app automatically verifies your connection state in the dashboard.
3. Switch between tabs to explore different AI capabilities.

## 🏗️ Architecture

- `/src/components`: UI modules for Email, Image, and Voice.
- `/src/hooks`: Custom logic for Web Audio and Real-time streaming.
- `/src/services`: Integration layer for the Gemini API.
- `/src/types.ts`: Centralized TypeScript definitions.
- `/src/constants.ts`: Application-wide configuration and static data.
- `/src/index.css`: Global design system and glassmorphism utilities.
