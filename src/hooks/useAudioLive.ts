import { useEffect, useRef, useState, useCallback } from 'react';
import { connectLiveVoice } from '../services/gemini';
import { VOICE_CONFIG, JITTER_BUFFER } from '../config/constants';

/**
 * Hook to manage real-time audio interaction with Gemini Live.
 * Handles microphone input, PCM streaming, and adaptive jitter buffering for playback.
 */
export const useAudioLive = () => {
  const [isActive, setIsActive] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [transcription, setTranscription] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const isActiveRef = useRef(false);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const workletRef = useRef<AudioWorkletNode | null>(null);
  const workletUrlRef = useRef<string | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const sessionRef = useRef<any>(null); // Ideally use type from @google/genai when available
  const sessionIndexRef = useRef<number>(0);
  const activeSourcesRef = useRef<AudioBufferSourceNode[]>([]);

  const nextPlayTimeRef = useRef<number>(0);

  /**
   * Cleans up all audio resources and closes the WebSocket session.
   */
  const stop = useCallback(() => {
    if (sessionRef.current) {
      try {
        sessionRef.current.close();
      } catch (e) {
        console.error('Error closing session:', e);
      }
      sessionRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (workletRef.current) {
      workletRef.current.disconnect();
      workletRef.current = null;
    }
    if (workletUrlRef.current) {
      URL.revokeObjectURL(workletUrlRef.current);
      workletUrlRef.current = null;
    }
    activeSourcesRef.current.forEach((s) => {
      try {
        s.stop();
      } catch (e) {}
    });
    activeSourcesRef.current = [];

    if (audioContextRef.current) {
      audioContextRef.current.close().catch(console.error);
      audioContextRef.current = null;
    }
    setIsActive(false);
    isActiveRef.current = false;
    setIsConnecting(false);
    analyserRef.current = null;
    nextPlayTimeRef.current = 0;
  }, []);

  /**
   * Efficiently converts Uint8Array to Base64.
   */
  const arrayBufferToBase64 = (buffer: ArrayBuffer) => {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  };

  /**
   * Initializes the AudioContext, requests mic permissions, and connects to the Live service.
   */
  const start = useCallback(async () => {
    if (isActive) return;
    setIsConnecting(true);
    setError(null);
    setTranscription('');

    try {
      const newSessionIndex = Math.random();
      sessionIndexRef.current = newSessionIndex;

      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: VOICE_CONFIG.INPUT_SAMPLE_RATE,
      });
      audioContextRef.current = audioContext;

      // Explicitly resume context for browser policies
      await audioContext.resume();
      nextPlayTimeRef.current = audioContext.currentTime;

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const sourceNode = audioContext.createMediaStreamSource(stream);
      const analyserNode = audioContext.createAnalyser();
      analyserNode.fftSize = 256;
      analyserRef.current = analyserNode;

      // Modern AudioWorklet implementation (Issue #4) to avoid main-thread blocking
      const processorCode = `
        class AudioProcessor extends AudioWorkletProcessor {
          process(inputs) {
            const input = inputs[0];
            if (input.length > 0) {
              const samples = input[0];
              this.port.postMessage(samples);
            }
            return true;
          }
        }
        registerProcessor('audio-processor', AudioProcessor);
      `;
      const blob = new Blob([processorCode], { type: 'application/javascript' });
      const workletUrl = URL.createObjectURL(blob);
      workletUrlRef.current = workletUrl;
      await audioContext.audioWorklet.addModule(workletUrl);

      const workletNode = new AudioWorkletNode(audioContext, 'audio-processor');
      workletRef.current = workletNode;

      sourceNode.connect(analyserNode);
      analyserNode.connect(workletNode);
      workletNode.connect(audioContext.destination);

      const session = await connectLiveVoice({
        onopen: () => {
          setIsConnecting(false);
          setIsActive(true);
          isActiveRef.current = true;
          console.log('Connected to Gemini Live');
        },
        onmessage: async (message: any) => {
          // Transcription handling - Truncate to prevent memory bloat over time
          const transcriptionPart = message.serverContent?.modelTurn?.parts?.find(
            (p: any) => p.text,
          );
          if (transcriptionPart?.text) {
            setTranscription((prev) => {
              const combined = prev + transcriptionPart.text;
              return combined.length > 3000 ? '...' + combined.slice(-3000) : combined;
            });
          }

          const audioPart = message.serverContent?.modelTurn?.parts?.find((p: any) => p.inlineData);
          if (
            audioPart?.inlineData?.data &&
            audioContextRef.current &&
            audioContextRef.current.state !== 'closed'
          ) {
            const base64 = audioPart.inlineData.data;
            const binary = atob(base64);
            const bytes = new Uint8Array(binary.length);
            for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);

            const pcm16 = new Int16Array(bytes.buffer);
            const float32 = new Float32Array(pcm16.length);
            for (let i = 0; i < pcm16.length; i++) float32[i] = pcm16[i] / 0x7fff;

            try {
              const buffer = audioContextRef.current.createBuffer(
                1,
                float32.length,
                VOICE_CONFIG.OUTPUT_SAMPLE_RATE,
              );
              buffer.getChannelData(0).set(float32);

              const sourceNode = audioContextRef.current.createBufferSource();
              sourceNode.buffer = buffer;
              sourceNode.connect(audioContextRef.current.destination);
              activeSourcesRef.current.push(sourceNode);
              sourceNode.onended = () => {
                sourceNode.disconnect();
                activeSourcesRef.current = activeSourcesRef.current.filter((s) => s !== sourceNode);
              };

              const now = audioContextRef.current.currentTime;
              let startTime = nextPlayTimeRef.current;
              if (startTime < now || startTime > now + JITTER_BUFFER.DRIFT_THRESHOLD) {
                startTime = now + JITTER_BUFFER.LOOKAHEAD;
              }
              sourceNode.start(startTime);
              nextPlayTimeRef.current = startTime + buffer.duration;
            } catch (e) {
              console.error('Audio playback error:', e);
            }
          }

          if (message.serverContent?.interrupted) {
            activeSourcesRef.current.forEach((s) => {
              try {
                s.stop();
              } catch (e) {}
            });
            activeSourcesRef.current = [];
            nextPlayTimeRef.current = audioContextRef.current?.currentTime || 0;
          }
        },
        onerror: (err: any) => {
          console.error('Gemini LIVE Error:', err);
          setError('Connection error. Ensure API key is valid.');
          stop();
        },
        onclose: () => {
          stop();
        },
      });

      sessionRef.current = session;

      workletNode.port.onmessage = (event) => {
        const session = sessionRef.current;
        const currentSessionIndex = sessionIndexRef.current;
        if (!session || !isActiveRef.current || currentSessionIndex !== newSessionIndex) return;

        const inputData = event.data;
        const pcm16 = new Int16Array(inputData.length);
        for (let i = 0; i < inputData.length; i++) {
          pcm16[i] = Math.max(-1, Math.min(1, inputData[i])) * 0x7fff;
        }

        const base64 = arrayBufferToBase64(pcm16.buffer);
        try {
          // Final check to ensure we haven't stopped mid-processing
          if (
            isActiveRef.current &&
            sessionRef.current === session &&
            sessionIndexRef.current === currentSessionIndex
          ) {
            session.sendRealtimeInput({
              audio: { data: base64, mimeType: `audio/pcm;rate=${VOICE_CONFIG.INPUT_SAMPLE_RATE}` },
            });
          }
        } catch (err) {
          console.error('Error sending audio input:', err);
        }
      };
    } catch (err) {
      console.error(err);
      setError('Microphone access denied or connection failed.');
      setIsConnecting(false);
    }
  }, [isActive, stop]);

  useEffect(() => {
    return () => {
      stop();
    };
  }, [stop]);

  return {
    start,
    stop,
    isActive,
    isConnecting,
    error,
    analyser: analyserRef.current,
    transcription,
  };
};
