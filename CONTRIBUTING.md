# Contributing to Google Pulsar Workspace

Thank you for your interest in contributing! This project is a high-performance, AI-driven workspace designed to showcase the latest capabilities of the Gemini model family.

## 🛠️ Development Setup

1. **Clone & Install**:
   ```bash
   npm install
   ```
2. **Environment Variables**:
   Create a `.env` file (or set in AI Studio Settings) with:
   - `GEMINI_API_KEY`: Your Google AI Studio API key.

3. **Run Dev Server**:
   ```bash
   npm run dev
   ```

## 🎨 Coding Standards

### TypeScript

- Use functional components with hooks.
- Define interfaces for all API responses and component props in `src/types.ts`.
- Avoid `any` at all costs.

### Styling (Tailwind 4)

- Use utility classes exclusively.
- Use the `@theme` block in `src/index.css` for custom variables.
- Maintain the "Clean Minimalism" aesthetic (glassmorphism, subtle borders, high contrast typography).

### Icons

- Use `lucide-react` for all iconography.

### Animations

- Use `motion/react` (Framer Motion) for layout transitions and micro-interactions.

## 🧠 AI Guidelines

- **Service Pattern**: Always use the centralized `src/services/gemini.ts` for AI interactions.
- **Model Selection**:
  - `gemini-1.5-flash`: General text and reasoning.
  - `gemini-1.5-flash`: Vision and image generation/editing.
  - `gemini-2.0-flash-exp`: Multimodal live streaming.
- **Safety**: Always handle API errors gracefully and never expose raw system prompts to the client-side logs.

## 🔊 Audio & Real-time

- Modifications to `useAudioLive.ts` must be tested for jitter and drift.
- **Interruption Handling**: Always ensure that incoming `serverContent.interrupted` signals immediately halt current `AudioBufferSourceNode` playback.
- **Implementation**: Always use `AudioWorklet` for PCM processing to ensure main-thread responsiveness.

## 🧹 Memory Safety

- **Binary Assets**: When using `URL.createObjectURL` for previews, you **must** call `URL.revokeObjectURL` as soon as the image is no longer needed (e.g., when replaced or cleared) to prevent significant browser memory usage.

## 📝 Pull Request Process

1. Ensure `npm run lint` passes without errors.
2. Ensure the app builds successfully with `npm run build`.
3. Update `CHANGELOG.md` with your changes under the `[Unreleased]` section.
4. Provide a clear description of the feature or fix in your PR.

---

_Note: This project follows the [Contributor Covenant Code of Conduct](https://www.contributor-covenant.org/version/2/1/code_of_conduct/code_of_conduct.md)._
