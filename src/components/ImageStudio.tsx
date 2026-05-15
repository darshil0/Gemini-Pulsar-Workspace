import React, { useState, useRef } from 'react';
import { Upload, Image as ImageIcon, Sparkles, Download, Loader2, Wand2, Eraser, Layers, Palette, Camera, Grid, Trash2, Send, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { transformImage } from '../services/gemini';
import { cn } from '../lib/utils';
import { IMAGE_STYLES } from '../constants';
import { ImageTransformationResult } from '../types';
import { useNotification } from '../hooks/useNotification';

const iconMap: Record<string, any> = {
  Sparkles,
  Palette,
  Camera,
  Eraser,
  Wand2
};

export const ImageStudio: React.FC = () => {
  const { notify } = useNotification();
  const [image, setImage] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string>('');
  const [prompt, setPrompt] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<ImageTransformationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageBase64Ref = useRef<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 4 * 1024 * 1024) {
        setError("Image is too large. Please upload an image under 4MB.");
        return;
      }
      
      setError(null);
      // Clear previous object URL if it exists to prevent memory leaks
      if (image && image.startsWith('blob:')) {
        URL.revokeObjectURL(image);
      }
      
      const objectUrl = URL.createObjectURL(file);
      setImage(objectUrl);
      setMimeType(file.type);
      
      const reader = new FileReader();
      reader.onload = () => {
        imageBase64Ref.current = reader.result as string;
      };
      reader.onerror = () => setError("Failed to read image file.");
      reader.readAsDataURL(file);
    }
  };

  const clearSession = () => {
    if (image && image.startsWith('blob:')) {
      URL.revokeObjectURL(image);
    }
    setImage(null);
    setMimeType('');
    setPrompt('');
    setResult(null);
    setError(null);
    imageBase64Ref.current = null;
  };

  const processImg = async (stylePrompt?: string) => {
    const b64 = imageBase64Ref.current;
    if (!b64) return;
    setIsProcessing(true);
    setError(null);
    try {
      const data = await transformImage(b64, mimeType, stylePrompt || prompt);
      setResult(data);
      notify('success', 'Transformation Complete', 'Your image has been re-imagined by Gemini Vision.');
    } catch (err) {
      setError("Image transformation failed. Ensure image size is within limits (max 4MB).");
      notify('error', 'Transformation Failed', 'There was an issue processing your image asset.');
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!result?.imageUrl) return;
    try {
      const link = document.createElement('a');
      link.href = result.imageUrl;
      link.download = `pulsar-gen-${Date.now()}.png`;
      link.click();
      notify('info', 'Download Started', 'Your image is being saved to your device.');
    } catch (err) {
      notify('error', 'Download Failed', 'Could not initiate image download.');
    }
  };

  return (
    <div className="flex flex-col h-full gap-6">
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 flex-1 min-h-0">
        
        {/* Sidebar: Controls */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="glass-card p-6 flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                <Layers className="w-3 h-3" />
                Source Image
              </h3>
              {image && (
                <button 
                  onClick={clearSession}
                  className="text-[10px] font-bold text-red-400/60 hover:text-red-400 transition-colors uppercase tracking-widest flex items-center gap-1"
                >
                  <Trash2 className="w-3 h-3" />
                  Reset
                </button>
              )}
            </div>
            
            <div 
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                "relative aspect-video rounded-xl border border-white/5 flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden bg-black/20 group",
                image ? "border-brand-primary/50" : "hover:border-white/20"
              )}
              aria-label="Upload image"
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                accept="image/*" 
                className="hidden" 
              />
              {image ? (
                <div className="relative w-full h-full">
                  <img src={image} className="w-full h-full object-cover transition-transform group-hover:scale-105" alt="Source" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="text-xs font-bold text-white uppercase tracking-widest">Change Image</span>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 text-slate-500">
                  <Upload className="w-6 h-6 opacity-50" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Upload Asset</span>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                <Wand2 className="w-3 h-3" />
                Quick Styles
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {IMAGE_STYLES.map((style) => {
                  const IconComponent = iconMap[style.iconName] || Palette;
                  return (
                    <button
                      key={style.id}
                      disabled={!image || isProcessing}
                      onClick={() => processImg(style.prompt)}
                      className="flex flex-col items-center gap-2 p-3 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed group glass-hover"
                      aria-label={`Apply ${style.label} style`}
                    >
                      <IconComponent className="w-4 h-4 group-hover:scale-110 transition-transform text-blue-400" />
                      <span className="text-[9px] font-bold uppercase tracking-tight">{style.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                 <Grid className="w-3 h-3" />
                 Custom Remix
              </h3>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Type instructions..."
                  className="flex-1 bg-black/20 border border-white/5 rounded-lg px-4 py-2 text-xs focus:outline-none focus:border-brand-primary transition-all placeholder:text-slate-600"
                  aria-label="Custom image remix instruction"
                />
                <button
                  onClick={() => processImg()}
                  disabled={!image || isProcessing || !prompt.trim()}
                  className="px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-lg disabled:opacity-50 transition-colors shadow-lg shadow-blue-600/10"
                  aria-label="Process custom instruction"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>


        {/* Main: Preview */}
        <div className="lg:col-span-3 glass-card flex flex-col">
          <div className="p-4 border-b border-white/10 flex items-center justify-between">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-brand-primary" />
              Creative Result
            </h3>
            {result && (
              <button 
                onClick={handleDownload}
                className="flex items-center gap-2 px-3 py-1.5 bg-brand-primary/10 text-brand-primary rounded-lg text-xs font-semibold hover:bg-brand-primary/20 transition-all"
              >
                <Download className="w-3 h-3" />
                Download
              </button>
            )}
          </div>

          <div className="flex-1 flex flex-col p-6 items-center justify-center relative min-h-[300px]">
            <AnimatePresence mode="wait">
              {error ? (
                <motion.div 
                  key="error"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center gap-4 text-red-500"
                >
                  <AlertCircle className="w-12 h-12" />
                  <p className="text-sm font-medium">{error}</p>
                  <button 
                    onClick={clearSession}
                    className="mt-2 text-xs uppercase tracking-widest font-bold underline underline-offset-4"
                  >
                    Reset & Try Again
                  </button>
                </motion.div>
              ) : isProcessing ? (
                <motion.div 
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center gap-4"
                >
                  <div className="relative">
                    <Loader2 className="w-12 h-12 text-brand-primary animate-spin" />
                    <div className="absolute inset-0 blur-xl bg-brand-primary/20 animate-pulse" />
                  </div>
                  <p className="text-sm animate-pulse">Gemini is re-imagining your image...</p>
                </motion.div>
              ) : result ? (
                <motion.div 
                  key="result"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="w-full h-full flex flex-col gap-4 overflow-hidden"
                >
                  <div className="flex-1 rounded-xl overflow-hidden bg-neutral-800 shadow-inner group relative">
                    <img src={result.imageUrl} className="w-full h-full object-contain" alt="Result" />
                    {!result.imageUrl && (
                       <div className="flex-1 flex items-center justify-center p-8 text-center text-neutral-400 italic">
                         Image generation direct bit-stream inhibited.
                       </div>
                    )}
                  </div>
                  {result.analysis && (
                    <div className="p-4 rounded-xl bg-brand-primary/10 border border-brand-primary/20 text-xs leading-relaxed max-h-32 overflow-y-auto">
                      <p className="font-semibold text-brand-primary mb-1 uppercase tracking-widest text-[9px]">AI Vision Analysis</p>
                      {result.analysis}
                    </div>
                  )}
                </motion.div>
              ) : (
                <motion.div 
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center gap-4 text-neutral-500"
                >
                  <ImageIcon className="w-16 h-16 opacity-10" />
                  <p className="text-sm">Upload an image and choose a style to begin</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};
