import React, { useEffect, useRef } from 'react';
import { Mic, MicOff, Waves, Volume2, Sparkles, MessageSquare, ExternalLink, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAudioLive } from '../hooks/useAudioLive';
import { cn } from '../lib/utils';
import { useNotification } from '../hooks/useNotification';

export const VocalWorkspace: React.FC = () => {
  const { notify } = useNotification();
  const { start, stop, isActive, isConnecting, error, analyser, transcription } = useAudioLive();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const transcriptionEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isActive) {
      notify('info', 'Live Session Active', 'Streaming high-fidelity audio to Gemini.');
    }
  }, [isActive, notify]);

  useEffect(() => {
    if (error) {
      notify('error', 'Connectivity Restricted', 'There was an issue establishing the live voice stream.');
    }
  }, [error, notify]);

  useEffect(() => {
    if (transcriptionEndRef.current) {
      transcriptionEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [transcription]);

  useEffect(() => {
    if (!isActive || !analyser || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    let animationId: number;

    const draw = () => {
      animationId = requestAnimationFrame(draw);
      analyser.getByteFrequencyData(dataArray);

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const radius = canvas.width * 0.35;
      
      // Draw circular frequency bars
      for (let i = 0; i < bufferLength; i += 2) {
        const value = dataArray[i];
        const percent = value / 255;
        const barHeight = percent * (canvas.width * 0.15);
        const angle = (i / bufferLength) * Math.PI * 2;
        
        const x1 = centerX + Math.cos(angle) * radius;
        const y1 = centerY + Math.sin(angle) * radius;
        const x2 = centerX + Math.cos(angle) * (radius + barHeight);
        const y2 = centerY + Math.sin(angle) * (radius + barHeight);
        
        ctx.strokeStyle = `rgba(59, 130, 246, ${percent + 0.3})`;
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }
      
      // Draw an inner pulse
      const avg = dataArray.reduce((acc, v) => acc + v, 0) / bufferLength;
      const innerPulseRadius = radius * (1 + (avg / 255) * 0.1);
      ctx.beginPath();
      ctx.arc(centerX, centerY, innerPulseRadius, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(59, 130, 246, 0.2)`;
      ctx.lineWidth = 1;
      ctx.stroke();
    };

    draw();
    return () => cancelAnimationFrame(animationId);
  }, [isActive, analyser]);

  return (
    <div className="flex flex-col items-center justify-center h-full max-w-4xl mx-auto py-12 px-6 text-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-12"
      >
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-[10px] font-bold tracking-widest mb-4">
          <Sparkles className="w-3 h-3" />
          SYSTEM LIVE INFRASTRUCTURE
        </div>
        <h2 className="text-4xl font-bold mb-4 tracking-tight text-white">Vocal Workspace</h2>
        <p className="text-slate-500 max-w-md mx-auto text-sm leading-relaxed">
          Experience low-latency, natural voice interaction. Click the heart of Pulsar to begin streaming.
        </p>
      </motion.div>

      <div className="relative mb-12 flex flex-col items-center">
        {/* Pulsar Core */}
        <motion.div 
          animate={isActive ? { scale: [1, 1.05, 1], rotate: [0, 5, -5, 0] } : {}}
          transition={{ repeat: Infinity, duration: 4 }}
          className="relative"
        >
          {/* Outer glow */}
          <div className={cn(
            "absolute inset-0 blur-3xl opacity-20 transition-all duration-1000",
            isActive ? "bg-blue-500 scale-150 opacity-40" : "bg-neutral-800"
          )} />
          
          <button
            onClick={isActive ? stop : start}
            disabled={isConnecting}
            aria-label={isActive ? "Stop voice session" : "Start voice session"}
            aria-pressed={isActive}
            className={cn(
              "relative w-48 h-48 rounded-full flex items-center justify-center transition-all duration-500 shadow-2xl overflow-hidden glass group",
              isActive ? "border-2 border-blue-500/50 shadow-blue-500/20" : "hover:border-white/20 border border-white/5"
            )}
          >
            <AnimatePresence mode="wait">
              {isConnecting ? (
                <motion.div key="connecting" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <Waves className="w-16 h-16 text-blue-400 animate-pulse" />
                </motion.div>
              ) : isActive ? (
                <motion.div key="active" initial={{ scale: 0.5 }} animate={{ scale: 1 }} className="flex flex-col items-center">
                  <Mic className="w-12 h-12 text-blue-400 mb-1" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-blue-400">Live</span>
                </motion.div>
              ) : (
                <motion.div key="inactive" initial={{ scale: 0.5 }} animate={{ scale: 1 }}>
                  <MicOff className="w-12 h-12 text-slate-600" />
                </motion.div>
              )}
            </AnimatePresence>
            
            {/* Visualizer overlay */}
            <canvas 
              ref={canvasRef} 
              width={384} 
              height={384} 
              className="absolute inset-0 pointer-events-none mix-blend-overlay opacity-80"
            />
          </button>
        </motion.div>

        {/* Status Indicators */}
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <div className="flex items-center gap-2 px-4 py-2 glass rounded-xl">
            <Volume2 className={cn("w-3.5 h-3.5", isActive ? "text-blue-400" : "text-slate-600")} />
            <span className="text-[9px] font-bold uppercase tracking-widest opacity-80">{isActive ? 'Receiving Audio' : 'Audio Disabled'}</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 glass rounded-xl">
            <MessageSquare className={cn("w-3.5 h-3.5", isActive ? "text-purple-400" : "text-slate-600")} />
            <span className="text-[9px] font-bold uppercase tracking-widest opacity-80">{isActive ? 'Listening' : 'Stream Closed'}</span>
          </div>
          {isActive && (
            <div className="flex items-center gap-2 px-4 py-2 glass rounded-xl border-emerald-500/10">
              <Zap className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-[9px] font-bold uppercase tracking-widest text-emerald-400">150ms Jitter Buffer Active</span>
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {transcription && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-lg glass p-6 rounded-2xl text-left mb-8 max-h-48 overflow-y-auto scrollbar-hide border border-blue-500/10 shadow-lg shadow-blue-500/5"
          >
            <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-2">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-blue-400 flex items-center gap-2">
                <MessageSquare className="w-3.5 h-3.5" />
                Live Context Stream
              </h4>
              <div className="flex gap-1">
                <div className="w-1 h-1 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-1 h-1 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '200ms' }} />
                <div className="w-1 h-1 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '400ms' }} />
              </div>
            </div>
            <p className="text-sm text-slate-200 leading-relaxed font-medium">
              {transcription}
            </p>
            <div ref={transcriptionEndRef} />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500 text-sm flex flex-col gap-2"
          >
            <div className="flex items-center gap-2 font-semibold">
              <MicOff className="w-4 h-4" />
              Connectivity Restricted
            </div>
            <p>{error}</p>
            <p className="opacity-70 text-[11px] max-w-sm">
              Note: The Gemini Live API requires specific permissions and a valid paid Tier API key. 
              Audio streaming may be inhibited within some iframe environments.
            </p>
            <button 
              onClick={() => window.open(window.location.href, '_blank')}
              className="mt-2 flex items-center justify-center gap-2 px-4 py-2 bg-red-500 text-white rounded-xl text-xs font-bold hover:bg-red-600 transition-all shadow-lg"
            >
              <ExternalLink className="w-3 h-3" />
              Open in New Tab
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
