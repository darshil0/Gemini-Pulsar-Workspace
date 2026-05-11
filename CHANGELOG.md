# Changelog

All notable changes to this project will be documented in this file.

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
