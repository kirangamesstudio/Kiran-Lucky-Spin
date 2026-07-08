import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ShieldAlert, Database, Key, Terminal, ExternalLink, RefreshCw, Sparkles, CheckCircle2, X } from 'lucide-react';
import { playClickSound } from '../utils/audio';

interface FirebaseSetupScreenProps {
  soundEnabled?: boolean;
  onClose?: () => void;
}

export default function FirebaseSetupScreen({ soundEnabled = true, onClose }: FirebaseSetupScreenProps) {
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = () => {
    playClickSound(soundEnabled);
    setRefreshing(true);
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

  const requiredVars = [
    { name: 'VITE_FIREBASE_API_KEY', description: 'Your Firebase Web API Key' },
    { name: 'VITE_FIREBASE_PROJECT_ID', description: 'Your unique Firebase Project ID' },
    { name: 'VITE_FIREBASE_APP_ID', description: 'Your Firebase Web App ID' },
    { name: 'VITE_FIREBASE_AUTH_DOMAIN', description: 'Authentication domain (usually project-id.firebaseapp.com)' },
    { name: 'VITE_FIREBASE_FIRESTORE_DATABASE_ID', description: 'Custom Firestore database ID (required for sandbox isolation)', optional: true },
  ];

  const content = (
    <div className="w-full max-w-md bg-gradient-to-b from-[#09102b] to-[#04081c] border border-red-500/30 rounded-[32px] p-6 sm:p-8 shadow-[0_20px_50px_rgba(239,68,68,0.15)] relative overflow-hidden">
      
      {/* Close button if in modal mode */}
      {onClose && (
        <button
          onClick={() => {
            playClickSound(soundEnabled);
            onClose();
          }}
          className="absolute top-5 right-5 p-1.5 bg-slate-950 text-slate-400 hover:text-white rounded-full hover:scale-105 transition-all z-20 border border-slate-800"
        >
          <X className="w-4 h-4" />
        </button>
      )}

      {/* Ambient background glows */}
      <div className="absolute -top-16 -right-16 w-32 h-32 bg-red-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-16 -left-16 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="flex flex-col items-center text-center">
        {/* Warn Badge & Icon */}
        <div className="w-16 h-16 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-center justify-center mb-5 shadow-inner">
          <Database className="w-8 h-8 text-red-400" />
        </div>

        <p className="text-[10px] font-mono text-red-400 tracking-[0.3em] uppercase font-black mb-1">Configuration Required</p>
        <h2 className="text-2xl font-black bg-gradient-to-b from-white to-slate-300 bg-clip-text text-transparent leading-tight mb-3">
          Firebase Not Configured
        </h2>
        <p className="text-xs text-slate-400 leading-relaxed max-w-sm mb-6">
          Kiran Lucky Spin runs on a production-grade Firebase + Firestore engine. To enable real-time tournaments, user progression sync, global leaderboards, and sharing systems, you must configure your credentials.
        </p>
      </div>

      {/* Environment setup card */}
      <div className="bg-[#030612]/90 border border-slate-800/80 rounded-2xl p-4 mb-6">
        <div className="flex items-center gap-2 mb-3.5 pb-2 border-b border-slate-800/80">
          <Terminal className="w-4 h-4 text-amber-400" />
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-300">Environment Variables (.env)</span>
        </div>

        <div className="flex flex-col gap-3 max-h-[180px] overflow-y-auto pr-1">
          {requiredVars.map((v, idx) => (
            <div key={idx} className="flex flex-col gap-1 text-left p-2 bg-slate-950/60 border border-slate-800/40 rounded-xl">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-black text-amber-500 tracking-wide">{v.name}</span>
                {v.optional ? (
                  <span className="text-[8px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">Optional</span>
                ) : (
                  <span className="text-[8px] bg-red-500/15 text-red-400 border border-red-500/25 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">Required</span>
                )}
              </div>
              <span className="text-[10px] text-slate-400 leading-snug">{v.description}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Action button container */}
      <div className="flex flex-col gap-3">
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:brightness-110 disabled:brightness-75 text-slate-950 font-black text-xs rounded-xl tracking-wider flex items-center justify-center gap-2 shadow-[0_4px_14px_rgba(245,158,11,0.2)] active:scale-[0.98] transition-all"
        >
          {refreshing ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
          RE-CHECK CONFIGURATION
        </button>

        <a
          href="https://ai.studio/build"
          target="_blank"
          rel="noopener noreferrer"
          className="w-full py-3 bg-slate-950 border border-slate-800 hover:bg-slate-900 text-slate-300 font-bold text-xs rounded-xl tracking-wider flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
        >
          <ExternalLink className="w-4 h-4 text-slate-400" />
          OPEN AI STUDIO SECRETS
        </a>
      </div>

      {/* Brief helpful tip */}
      <div className="mt-5 text-center flex items-center justify-center gap-1.5 text-[10px] text-slate-500 font-medium">
        <ShieldAlert className="w-3.5 h-3.5 text-slate-500" />
        <span>Need help? Check the README.md or .env.example.</span>
      </div>
    </div>
  );

  if (onClose) {
    return content;
  }

  return (
    <div className="w-full min-h-screen bg-[#020512] flex items-center justify-center p-4 sm:p-6 text-white select-none">
      {content}
    </div>
  );
}
