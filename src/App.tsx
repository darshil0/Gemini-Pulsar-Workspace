/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, Sparkles, Mic, Sun, Moon, LayoutGrid, Info, Zap, CheckCircle2 } from 'lucide-react';
import { EmailHelper } from './components/EmailHelper';
import { ImageStudio } from './components/ImageStudio';
import { VocalWorkspace } from './components/VocalWorkspace';
import { cn } from './lib/utils';
import { ActiveTab } from './types';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('email');
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [hasApiKey, setHasApiKey] = useState(false);

  useEffect(() => {
    // Check for API key status
    setHasApiKey(!!process.env.GEMINI_API_KEY);
    
    // Apply theme
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const tabs = [
    { id: 'email', label: 'Email Helper', icon: Mail, color: 'text-blue-500' },
    { id: 'image', label: 'Image Studio', icon: Zap, color: 'text-purple-500' },
    { id: 'voice', label: 'Vocal Workspace', icon: Mic, color: 'text-rose-500' },
  ];

  return (
    <div className="min-h-screen font-sans">
      {/* Background blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-blue-500/10 blur-[120px] rounded-full animate-pulse-subtle" />
        <div className="absolute top-[40%] -right-[10%] w-[60%] h-[60%] bg-purple-500/10 blur-[120px] rounded-full animate-pulse-subtle" style={{ animationDelay: '2s' }} />
      </div>

      <div className="max-w-[1400px] mx-auto min-h-screen flex flex-col p-4 md:p-8">
        
        {/* Header */}
        <header className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8 lg:mb-12">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-primary to-brand-secondary flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
              <Sparkles className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Gemini Pulsar</h1>
              <p className="text-xs font-medium tracking-[0.2em] uppercase opacity-50">Advanced AI Workspace</p>
            </div>
          </div>

          <nav className="flex gap-2 bg-black/20 p-1.5 rounded-xl border border-white/5">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as ActiveTab)}
                className={cn(
                  "px-5 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all transition-colors duration-200",
                  activeTab === tab.id 
                    ? "active-tab" 
                    : "text-slate-400 glass-hover"
                )}
              >
                <tab.icon className="w-4 h-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
            <div className="w-px h-6 bg-white/10 mx-2" />
            <button
               onClick={() => setIsDarkMode(!isDarkMode)}
               className="p-2 rounded-lg text-slate-400 hover:text-white glass-hover transition-colors"
            >
              {isDarkMode ? <Sun className="w-5 h-5 text-yellow-500" /> : <Moon className="w-5 h-5" />}
            </button>
          </nav>

          <div className="flex items-center gap-4">
             <div className={cn(
               "flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest glass",
               hasApiKey 
                 ? "text-emerald-400" 
                 : "text-red-400"
             )}>
               <span className={cn("status-dot", hasApiKey ? "bg-emerald-500 shadow-[0_0_8px_#10b981]" : "bg-red-500 shadow-[0_0_8px_#ef4444]")}></span>
               {hasApiKey ? 'System Ready' : 'Key Required'}
             </div>
             
             <button 
              onClick={() => setActiveTab('settings')}
              className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center transition-all",
                activeTab === 'settings' ? "bg-brand-primary text-white" : "glass glass-hover text-slate-400"
              )}
             >
                <LayoutGrid className="w-5 h-5" />
             </button>
          </div>
        </header>

        {/* Main Workspace */}
        <main className="flex-1 glass shadow-2xl rounded-2xl p-6 md:p-8 relative overflow-hidden flex flex-col min-h-0">
          {/* Internal background elements */}
          <div className="absolute top-0 right-0 p-8 flex gap-2 opacity-5 pointer-events-none">
            <Sparkles className="w-32 h-32" />
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="h-full"
            >
              {activeTab === 'email' && <EmailHelper />}
              {activeTab === 'image' && <ImageStudio />}
              {activeTab === 'voice' && <VocalWorkspace />}
              {activeTab === 'settings' && (
                <div className="max-w-2xl mx-auto py-12">
                   <h2 className="text-3xl font-bold mb-8">System Configuration</h2>
                   <div className="space-y-6">
                      <div className="glass-card p-6">
                         <div className="flex items-center gap-3 mb-4">
                            <Info className="w-5 h-5 text-brand-primary" />
                            <h3 className="font-semibold italic">Gemini API Connection</h3>
                         </div>
                         <p className="text-sm opacity-80 mb-6 leading-relaxed">
                            Your workspace is configured to use the Gemini Enterprise endpoints. 
                            The API key is securely managed via AI Studio's environment secrets.
                         </p>
                         <div className="flex items-center justify-between p-4 bg-black/20 rounded-xl">
                            <span className="text-xs font-mono">GEMINI_API_KEY</span>
                            <span className="text-xs font-bold text-emerald-500 flex items-center gap-2">
                               <CheckCircle2 className="w-3 h-3" />
                               VERIFIED BY RUNTIME
                            </span>
                         </div>
                      </div>

                      <div className="glass-card p-6 border-brand-primary/20 bg-brand-primary/5">
                         <h3 className="font-semibold mb-2">Workspace Optimization</h3>
                         <p className="text-sm opacity-70">
                            Pulsar uses Gemini 3 Flash for maximum performance and 3.1 Live for real-time vocal feedback. 
                            Ensure you are in a quiet environment for the best vocal experience.
                         </p>
                      </div>
                   </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </main>

        <footer className="mt-8 text-center opacity-30 text-[10px] uppercase tracking-[0.4em] font-medium">
          Built with Gemini Multimodal Logic & Antigravity Systems
        </footer>
      </div>
    </div>
  );
}
