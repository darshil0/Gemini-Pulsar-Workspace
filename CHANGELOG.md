# Changelog

All notable changes to this project will be documented in this file.

## [1.3.0] - 2024-05-11
### Added
- Implemented **Adaptive Jitter Buffer** (150ms lookahead) for ultra-smooth 24kHz audio playback.
- Added **Orbital Frequency Visualizer** in Vocal Workspace for real-time engagement feedback.
- Integrated `URL.createObjectURL` and `revokeObjectURL` for optimized image memory management in Image Studio.
- Implemented **Email Helper Session History** to store and revisit the last 5 analyses in a transient local state.
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

## [1.2.0] - 2024-05-11
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

## [1.1.0] - 2024-05-11
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

## [1.0.0] - 2024-05-11
### Added
- Initial release of Gemini Pulsar Workspace.
- Core Email Helper module with JSON schema-based analysis.
- Core Image Studio with Gemini vision capabilities.
- Core Vocal Workspace with real-time multi-modal connectivity.
- Responsive dashboard layout with glassmorphism styling.
