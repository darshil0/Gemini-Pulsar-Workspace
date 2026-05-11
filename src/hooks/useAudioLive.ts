import { useEffect, useRef, useState, useCallback } from 'react';
import { connectLiveVoice } from '../services/gemini';
import { LiveServerMessage } from '@google/genai';

export const useAudioLive = () => {
  const [isActive, setIsActive] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [transcription, setTranscription] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sessionRef = useRef<any>(null); // LiveWebsocket is not exported directly for easy type usage in all versions, keeping as any but hardening usage
  const analyserRef = useRef<AnalyserNode | null>(null);

  const nextPlayTimeRef = useRef<number>(0);

  const stop = useCallback(() => {
    if (sessionRef.current) {
      try {
        sessionRef.current.close();
      } catch (e) {
        console.error("Error closing session:", e);
      }
      sessionRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(console.error);
      audioContextRef.current = null;
    }
    setIsActive(false);
    setIsConnecting(false);
    nextPlayTimeRef.current = 0;
  }, []);

  const start = useCallback(async () => {
    if (isActive) return;
    setIsConnecting(true);
    setError(null);
    setTranscription('');

    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      audioContextRef.current = audioContext;
      
      // Explicitly resume context for browser policies
      await audioContext.resume();
      nextPlayTimeRef.current = audioContext.currentTime;

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;

      const source = audioContext.createMediaStreamSource(stream);
      const processor = audioContext.createScriptProcessor(2048, 1, 1);
      processorRef.current = processor;

      source.connect(analyser);
      analyser.connect(processor);
      processor.connect(audioContext.destination);

      const session = await connectLiveVoice({
        onopen: () => {
          setIsConnecting(false);
          setIsActive(true);
          console.log("Connected to Gemini Live");
        },
        onmessage: async (message: LiveServerMessage) => {
          // Transcription handling
          const transcriptionPart = message.serverContent?.modelTurn?.parts?.find(p => p.text);
          if (transcriptionPart?.text) {
             setTranscription(prev => prev + transcriptionPart.text);
          }
          
          const audioPart = message.serverContent?.modelTurn?.parts?.find(p => p.inlineData);
          if (audioPart?.inlineData?.data && audioContextRef.current && audioContextRef.current.state !== 'closed') {
            const base64 = audioPart.inlineData.data;
            const binary = atob(base64);
            const bytes = new Uint8Array(binary.length);
            for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
            
            // Assuming 24000Hz mono PCM from Gemini
            const pcm16 = new Int16Array(bytes.buffer);
            const float32 = new Float32Array(pcm16.length);
            for (let i = 0; i < pcm16.length; i++) float32[i] = pcm16[i] / 0x7FFF;
            
            try {
              const buffer = audioContextRef.current.createBuffer(1, float32.length, 24000);
              buffer.getChannelData(0).set(float32);
              
              const source = audioContextRef.current.createBufferSource();
              source.buffer = buffer;
              source.connect(audioContextRef.current.destination);
              
              // Adaptive Jitter Buffer logic
              // We maintain a 150ms lookahead to absorb network jitter
              const now = audioContextRef.current.currentTime;
              const lookahead = 0.15; 
              
              let startTime = nextPlayTimeRef.current;
              
              // If we've drifted too far or are just starting, reset to now + lookahead
              if (startTime < now || startTime > now + 1.0) {
                startTime = now + lookahead;
              }
              
              source.start(startTime);
              nextPlayTimeRef.current = startTime + buffer.duration;
            } catch (e) {
              console.error("Audio playback error:", e);
            }
          }

          if (message.serverContent?.interrupted) {
            nextPlayTimeRef.current = audioContextRef.current?.currentTime || 0;
          }
        },
        onerror: (err: any) => {
          console.error("Gemini LIVE Error:", err);
          setError("Connection error. Ensure API key is valid.");
          stop();
        },
        onclose: () => {
          stop();
        }
      });

      sessionRef.current = session;

      processor.onaudioprocess = (e) => {
        if (!sessionRef.current || sessionRef.current.readyState === 3) return; // 3 is CLOSED
        
        const inputData = e.inputBuffer.getChannelData(0);
        const pcm16 = new Int16Array(inputData.length);
        for (let i = 0; i < inputData.length; i++) {
          pcm16[i] = Math.max(-1, Math.min(1, inputData[i])) * 0x7FFF;
        }
        
        const uint8 = new Uint8Array(pcm16.buffer);
        let binary = '';
        for (let i = 0; i < uint8.length; i++) {
          binary += String.fromCharCode(uint8[i]);
        }
        const base64 = btoa(binary);
        
        try {
          sessionRef.current.sendRealtimeInput({
            audio: { data: base64, mimeType: 'audio/pcm;rate=16000' }
          });
        } catch (err) {
          console.error("Error sending audio input:", err);
        }
      };

    } catch (err) {
      console.error(err);
      setError("Microphone access denied or connection failed.");
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
    transcription
  };
};
