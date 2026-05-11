import React, { useState } from 'react';
import { Mail, Send, Loader2, CheckCircle2, AlertCircle, Copy, Sparkles, User, Tag, Clock, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { analyzeEmail } from '../services/gemini';
import { cn } from '../lib/utils';
import { EmailAnalysis } from '../types';

/**
 * Intelligent Email Assistant component.
 * Allows users to paste email text and get tone analysis, priority, action items, and a generated response.
 */
export const EmailHelper: React.FC = () => {
  const [input, setInput] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<EmailAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<EmailAnalysis[]>([]);

  /**
   * Triggers the Gemini-powered analysis of the input email text.
   */
  const handleAnalyze = async () => {
    if (!input.trim()) return;
    setIsAnalyzing(true);
    setError(null);
    try {
      const data = await analyzeEmail(input);
      setResult(data);
      setHistory(prev => [data, ...prev].slice(0, 5)); // Keep last 5
    } catch (err) {
      setError('Failed to analyze email. Please try again.');
      console.error(err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const selectFromHistory = (item: EmailAnalysis) => {
    setResult(item);
  };

  const clearInput = () => {
    setInput('');
    setResult(null);
    setError(null);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
      {/* Input Side */}
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex flex-col gap-4 min-h-0"
      >
        <div className="flex-1 glass-card p-5 flex flex-col relative group/input">
          <div className="flex items-center justify-between mb-4">
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Input Content</label>
            <div className="flex items-center gap-3">
              {input && (
                <button 
                  onClick={clearInput}
                  className="text-[10px] font-bold text-red-400/60 hover:text-red-400 transition-colors uppercase tracking-widest flex items-center gap-1"
                  aria-label="Clear input"
                >
                  <Trash2 className="w-3 h-3" />
                  Clear
                </button>
              )}
              <span className="text-[10px] bg-white/5 opacity-50 px-2 py-1 rounded font-mono">
                {input.length} CHARS
              </span>
            </div>
          </div>
          
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Paste your email thread or content here..."
            className="flex-1 w-full bg-transparent border-none outline-none resize-none text-sm leading-relaxed placeholder:text-neutral-600 focus:ring-0"
            aria-label="Email content input"
          />
        </div>

        <div className="glass-card p-4 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={cn("w-2 h-2 rounded-full", isAnalyzing ? "bg-blue-500 animate-pulse" : "bg-neutral-600")}></div>
              <span className="text-xs font-medium text-slate-500">
                {isAnalyzing ? 'Gemini is analyzing context...' : 'Ready to analyze'}
              </span>
            </div>
            <button
              onClick={handleAnalyze}
              disabled={isAnalyzing || !input.trim()}
              className={cn(
                "px-6 py-2 rounded-xl text-sm font-bold shadow-lg transition-all",
                isAnalyzing || !input.trim() 
                  ? "bg-white/5 text-neutral-500 cursor-not-allowed" 
                  : "bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/20 active:scale-95"
              )}
            >
              {isAnalyzing ? 'Analyzing...' : 'Analyze Email'}
            </button>
          </div>

          {history.length > 0 && (
            <div className="pt-4 border-t border-white/5">
              <h4 className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                <Clock className="w-3 h-3" /> Recent History
              </h4>
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {history.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => selectFromHistory(item)}
                    className={cn(
                      "flex-shrink-0 px-3 py-2 rounded-lg text-[10px] font-medium border transition-all",
                      result === item 
                        ? "bg-blue-500/20 border-blue-500/40 text-blue-300"
                        : "bg-white/5 border-white/5 text-slate-400 hover:bg-white/10 hover:text-white"
                    )}
                  >
                    {item.category} ({item.priority})
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </motion.div>


      {/* Output Side */}
      <div className="flex flex-col gap-6">
        <AnimatePresence mode="wait">
          {!result && !isAnalyzing && !error && (
            <motion.div 
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 glass-card p-12 flex flex-col items-center justify-center text-center opacity-60"
            >
              <div className="w-16 h-16 rounded-full bg-brand-primary/10 flex items-center justify-center mb-4">
                <Mail className="w-8 h-8 text-brand-primary" />
              </div>
              <h3 className="text-lg font-medium mb-2">No analysis yet</h3>
              <p className="text-sm max-w-xs">Paste an email on the left and click Analyze to see magic happen.</p>
            </motion.div>
          )}

          {isAnalyzing && (
            <motion.div 
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 glass-card p-12 flex flex-col items-center justify-center text-center"
            >
              <Loader2 className="w-12 h-12 text-brand-primary animate-spin mb-4" />
              <h3 className="text-lg font-medium mb-2">Deciphering Email...</h3>
              <p className="text-sm">Gemini is looking for patterns, mood, and intent.</p>
            </motion.div>
          )}

          {error && (
            <motion.div 
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 glass-card p-8 border-red-500/20 bg-red-500/5 flex flex-col items-center justify-center text-center"
            >
              <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
              <h3 className="text-lg font-medium text-red-500 mb-2">Analysis Failed</h3>
              <p className="text-sm opacity-80">{error}</p>
              <button 
                onClick={handleAnalyze}
                className="mt-6 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                Retry
              </button>
            </motion.div>
          )}

          {result && !isAnalyzing && (
            <motion.div 
              key="result"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col gap-4 overflow-y-auto max-h-full pr-2 h-full"
            >
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div className="glass-card p-4">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter mb-1">Category</p>
                  <p className="text-blue-400 font-semibold">{result.category}</p>
                </div>
                <div className="glass-card p-4 border-l-4 border-l-amber-500/50">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter mb-1">Priority</p>
                  <p className="text-amber-400 font-semibold capitalize">{result.priority}</p>
                </div>
                <div className="glass-card p-4 sm:col-span-1 col-span-2">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter mb-1">Sentiment</p>
                  <p className="text-slate-200 font-semibold">{result.mood}</p>
                </div>
              </div>

              {/* Action Items */}
              <div className="glass-card p-6 flex flex-col gap-4">
                <h3 className="text-sm font-bold text-slate-400 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span> 
                  Suggested Action Items
                </h3>
                <ul className="space-y-3">
                  {result.actionItems.map((item, i) => (
                    <li key={i} className="flex items-center gap-3 text-sm text-slate-300 bg-white/5 p-3 rounded-xl border border-white/5 group transition-all glass-hover">
                      <span className="text-emerald-400 font-bold">✓</span>
                      <span className="opacity-80 group-hover:opacity-100 transition-opacity">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Draft Reply */}
              <div className="glass-card p-6 flex flex-col flex-1 min-h-0">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-slate-200">AI Draft Response</h3>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => copyToClipboard(result.draftReply)}
                      className="text-[10px] font-bold bg-white/5 text-slate-400 px-3 py-1.5 rounded-lg hover:text-white glass-hover transition-colors uppercase tracking-widest"
                    >
                      Copy
                    </button>
                    <button 
                      onClick={handleAnalyze}
                      className="text-[10px] font-bold bg-white/5 text-slate-400 px-3 py-1.5 rounded-lg hover:text-white glass-hover transition-colors uppercase tracking-widest"
                    >
                      Regenerate
                    </button>
                  </div>
                </div>
                <div className="flex-1 bg-white/5 border border-white/5 rounded-xl p-4 overflow-y-auto text-sm text-slate-300 leading-relaxed scrollbar-hide">
                  {result.draftReply}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
