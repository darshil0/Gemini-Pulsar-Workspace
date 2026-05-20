# Changelog - Google Pulsar Workspace

All notable changes to this project will be documented in this file.

## [1.7.3] - 2026-05-20
### Added
- **Secure Server-Side WebSocket Proxy**: Implemented a secure Node.js proxy (`server.ts`) to manage Live Voice audio streaming pipelines, completely removing the `/api/config` endpoint and the need to expose raw API keys to the client.
- **Service Payload Safety Enforcement**: Configured rigid Express body limits of `4MB` to guard the image transformation backend against oversized base64 uploads and trigger structural `413 Payload Too Large` responses.
- **Explicit CORS Integration**: Configured formal server CORS middleware validation to protect endpoint visibility.

### Fixed
- **Memory safety on unmount**: Added passive `useEffect` hooks in the `ImageStudio` and `NotificationProvider` to systematically release active object blobs and clean up active `setTimeout` handles during natural view unmounting.
- **Timestamp Key Collision**: Appended high-entropy fractional random components to the history item generation layout in `EmailHelper` to completely isolate the layout against unique key collisions.
- **Type Compiler Errors**: Corrected implicit `any` parameter mappings on AudioWorklet message processing callback hooks and fixed Express server listening arguments.

## [1.7.2] - 2026-05-20
### Added
- **API Architecture Documentation**: Fully documented the full-stack proxy design, validation schemas, and local health handshake endpoints in the `README.md`.

### Fixed
- **Live Session Race Safety**: Fixed a critical micro-race condition inside the AudioWorklet messages stream callback in `useAudioLive.ts`. It now does a strict validation check against the active ref and session identity before forwarding PCM frames to Gemini.
- **Model Standard Alignment**: Aligned the developer contribution guide (`CONTRIBUTING.md`) and readme files with production configurations to avoid system mismatch.

## [1.7.1] - 2026-05-15
### Added
- **Security Checkpoint**: Implemented `/api/health` to allow the client to verify API key presence without exposing the key itself.

### Fixed
- **API Key Leak Prevention**: Removed unused `loadEnv` from `vite.config.ts` to prevent accidental key exposure during builds.
- **Microphone Closure Bug**: Fixed a stale closure in `useAudioLive` that caused the microphone to disconnect incorrectly by using a `useRef` for connection state.
- **Memory Leak (Binary)**: Added `URL.revokeObjectURL` for both the AudioWorklet script and transformed image assets to prevent browser storage exhaustion.
- **History Highlighting**: Improved `EmailHelper` history tracking using unique timestamps for stable UI state and selection highlighting.
- **Session Sequence**: Fixed a race condition in `ImageStudio` where revoked URLs could be leaked if the session was cleared while an image update was pending.
- **SDK Safety**: Added robust input validation to Express API routes to gracefully handle empty or malformed requests.
- **Model Truth**: Unified `MODELS` constant between server and client to prevent version mismatch errors.

## [1.7.0] - 2026-05-15
### Added
- **Full-Stack Proxy Architecture**: Migrated Gemini API calls to a server-side Express proxy and implemented a runtime handshake to keep `GEMINI_API_KEY` secure and hidden from the client bundle.
- **AudioWorklet Implementation**: Replaced deprecated `ScriptProcessorNode` with a high-performance `AudioWorklet` to move audio processing off the main thread.
- **Strict Mode Compliance**: Enabled `"strict": true` in `tsconfig.json` and resolved all null-checks and type mismatches.

### Changed
- **Enhanced Dark/Light Mode**: Refined the design system for better accessibility in Light Mode, including explicit background tokens and contrast-fixed glass components.
- **Model Registry Update**: Corrected model strings to use production-stable Gemini aliases (`gemini-1.5-flash`, `gemini-2.0-flash-exp`).
- **Improved Retry Logic**: "Reset & Try Again" in Image Studio now allows dismissing errors without wiping the uploaded image asset.

### Fixed
- **History Data Integrity**: Fixed a bug where all history items in Email Helper would receive identical timestamps during a save.
- **Visualizer Initialization**: Fixed a race condition where the `analyser` node was null during the first active frame of the Vocal Workspace.
- **Notification Robustness**: Switched to `crypto.randomUUID()` for unique notification tracking, preventing ID collisions.
- **Metadata**: Updated `index.html` title and cleaned up duplicate `vite` dependencies in `package.json`.

## [1.6.0] - 2026-05-15
### Changed
- **Architectural Re-organization**: Refactored the project structure into a modular hierarchy:
    - Moved workspace components to `src/components/workspaces`.
    - Moved notification logic to `src/context/NotificationContext`.
    - Moved types and constants to `src/config`.
- Updated all import maps to reflect the new directory structure.

## [1.5.0] - 2026-05-15
### Added
- **Global Notification System**: Implemented a subtle, non-blocking notification system (`useNotification`) for real-time feedback.
- **Context-Aware Alerts**: Integrated notifications across all major modules:
    - **Email Helper**: Success/error alerts for analysis and clipboard actions.
    - **Image Studio**: Status updates for transformations and downloads.
    - **Vocal Workspace**: Connection status and session activity alerts.
- **Micro-Animations**: Added smooth entrance/exit animations for notifications using `motion/react` with layout-stable positioning.

## [1.4.0] - 2026-05-15
### Added
- **API Key Guard**: Added comprehensive environment variable validation to prevent startup crashes when `GEMINI_API_KEY` is missing.
- **Image Size Limits**: Implemented client-side validation to block uploads over 4MB, preventing payload errors.
- **Improved vision prompts**: Enhanced the creative transformation logic for vision-guided image remixing.

### Fixed
- **Memory Optimization**: Added transcription truncation and forced audio source disconnection to prevent memory leaks in extended sessions.
- **Live Voice Interruption**: Hard-synchronized current audio playback with model-led interruption signals.
- **Accessibility**: Added ARIA labels and pressed-state feedback to the main Vocal Workspace control.

## [1.3.1] - 2026-05-11
### Added
- Integrated **D3.js** and **Recharts** for future data visualization capabilities.
- Added adaptive scaling for the **Orbital Visualizer** in Vocal Workspace, improving responsiveness to different screen sizes.

### Changed
- Unified Branding: Migrated all references from "Gemini Pulsar" to **"Google Pulsar Workspace"**.
- Optimized UI: Added smoother tab transitions using `motion.div` with `layoutId` for spring-based active indicators.
- Improved Image Studio: Unified image processing state and added a robust error boundary UI for failed transformations.

### Fixed
- **Audio Memory Leak**: Resolved "Zombie Audio" issue by stopping and clearing `AudioBufferSourceNode` references on disconnection or model interruption.
- **Interruption Logic**: Fixed a bug where audio playback would continue after the model sent an `interrupted` signal.
- **Copy Feedback**: Fixed lack of visual confirmation when copying draft replies in Email Helper.

## [1.3.0] - 2026-05-11
### Added
- Implemented **Adaptive Jitter Buffer** (150ms lookahead) for ultra-smooth 24kHz audio playback.
- Added **Orbital Frequency Visualizer** and real-time **Status Indicators** (Jitter Buffer Active) in Vocal Workspace.
- Integrated `URL.createObjectURL` and `revokeObjectURL` for optimized image memory management in Image Studio.
- Implemented **Email Helper Session History** with `localStorage` persistence and a 24-hour auto-purge (TTL) for privacy compliance.
- Added "Clear All" history functionality for user data control in Email Helper.
- Centralized **Types & Constants** (`/src/types.ts`, `/src/constants.ts`) for improved codebase stability and configuration.

### Changed
- Hardened Error Logging: Stripped PII from transformation error logs to ensure privacy.
- Enhanced "Clear" functionality: Explicitly resetting internal base64 buffers and revoking binary resources.
- Optimized canvas rendering loop with circular geometry for the active Pulsar state.
- Refactored Image Studio styles to support flexible icons and centralized prompt definitions.

### Fixed
- Resolved audio drifting issues during long-form Gemini live sessions.
- Fixed memory leakage vulnerability during rapid image re-uploads.
- Corrected TypeScript interface mismatches in the Live Voice interaction layer.

## [1.2.0] - 2026-05-11
### Added
- Implemented "Clear" and "Reset" functionality in Email Helper and Image Studio for better session control.
- Added 24kHz mono PCM audio playback support in the Vocal Workspace.
- Integrated `audioContext.resume()` to handle browser auto-play restrictions.

### Changed
- Hardened Gemini services with comprehensive try-catch blocks and error logging.
- Refined Vocal Workspace UI with a dedicated Transcription panel and improved status indicators.
- Optimized audio streaming pipeline for better stability and lower latency.
- Enhanced layout responsiveness and accessibility (ARIA labels) across all modules.

### Fixed
- Corrected Google GenAI SDK `connect` signature for Live API compatibility.
- Resolved transcription data binding issues in the Live Voice hook.
- Fixed potential null pointer exceptions during audio context cleanup.

## [1.1.0] - 2026-05-11
### Added
- Created `README.md` and `CHANGELOG.md` for better project documentation.
- Integrated "Live Transcription" UI in the Vocal Workspace.
- Added automatic scrolling for transcriptions.

### Changed
- Refactored `useAudioLive` to handle full-duplex PCM audio playback from Gemini.
- Updated Gemini service to support audio transcription output.
- Applied "Clean Minimalism" design theme across all components.
- Migrated legacy `glass` classes to standard CSS variables in `index.css` for build compatibility.

### Fixed
- Resolved binary-to-base64 encoding issues in the audio streaming pipeline.
- Fixed `CheckCircle` icon collision by migrating to `CheckCircle2` from Lucide.
- Patched build errors related to Tailwind utility class generation.

## [1.0.0] - 2026-05-11
### Added
- Initial release of Google Pulsar Workspace.
- Core Email Helper module with JSON schema-based analysis.
- Core Image Studio with Gemini vision capabilities.
- Core Vocal Workspace with real-time multi-modal connectivity.
- Responsive dashboard layout with glassmorphism styling.
