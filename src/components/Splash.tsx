import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Trophy, Disc } from 'lucide-react';

interface SplashProps {
  onComplete: () => void;
}

export default function Splash({ onComplete }: SplashProps) {
  const [loadingText, setLoadingText] = useState('Initializing Systems...');
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Simulated loading texts for real game experience
    const texts = [
      'Loading Kiran Lucky Spin...',
      'Connecting to Virtual Coin Wallet...',
      'Polishing Golden Accents...',
      'Ready to Spin!',
    ];

    let textIdx = 0;
    const textInterval = setInterval(() => {
      textIdx = (textIdx + 1) % texts.length;
      setLoadingText(texts[textIdx]);
    }, 600);

    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          clearInterval(textInterval);
          setTimeout(() => {
            onComplete();
          }, 300);
          return 100;
        }
        return prev + 4;
      });
    }, 80);

    return () => {
      clearInterval(textInterval);
      clearInterval(progressInterval);
    };
  }, [onComplete]);

  return (
    <div id="splash-screen" className="fixed inset-0 flex flex-col justify-between items-center bg-radial from-[#0d1b3e] to-[#040814] text-white overflow-hidden p-6 z-50">
      {/* Decorative Golden Ambient Lights */}
      <div className="absolute top-[-10%] left-[-10%] w-72 h-72 rounded-full bg-yellow-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-72 h-72 rounded-full bg-amber-500/10 blur-[120px] pointer-events-none" />

      {/* Empty spacer for alignment */}
      <div />

      {/* Main Logo Content */}
      <div className="flex flex-col items-center text-center">
        {/* Animated Gold Logo Symbol */}
        <motion.div
          initial={{ scale: 0.3, rotate: -45, opacity: 0 }}
          animate={{ scale: 1, rotate: 0, opacity: 1 }}
          transition={{ type: 'spring', damping: 15, stiffness: 80, delay: 0.1 }}
          className="relative w-36 h-36 flex items-center justify-center mb-6"
        >
          {/* External golden rotating rings */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
            className="absolute inset-0 rounded-full border border-dashed border-amber-400/40"
          />
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
            className="absolute inset-2 rounded-full border border-amber-500/30"
          />
          
          {/* Outer Gold Shield Outer */}
          <div className="absolute inset-4 rounded-full bg-gradient-to-br from-amber-300 via-yellow-500 to-amber-700 p-[3px] shadow-[0_0_30px_rgba(245,158,11,0.3)]">
            <div className="w-full h-full rounded-full bg-[#030712] flex items-center justify-center relative overflow-hidden">
              <div className="absolute inset-0 bg-radial from-amber-500/10 to-transparent" />
              {/* Inner Crown or Star Emblem */}
              <motion.div
                animate={{ scale: [1, 1.08, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              >
                <Trophy className="w-14 h-14 text-gradient bg-gradient-to-b from-yellow-300 via-amber-400 to-yellow-600 drop-shadow-[0_2px_8px_rgba(245,158,11,0.5)]" />
              </motion.div>
            </div>
          </div>

          {/* Floating Sparkles around Logo */}
          <motion.div
            animate={{ y: [-5, 5, -5], x: [3, -3, 3] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute -top-1 -right-1 text-yellow-300"
          >
            <Sparkles className="w-6 h-6 animate-pulse" />
          </motion.div>
          <motion.div
            animate={{ y: [5, -5, 5], x: [-3, 3, -3] }}
            transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute -bottom-1 -left-1 text-amber-400"
          >
            <Sparkles className="w-5 h-5 animate-pulse" />
          </motion.div>
        </motion.div>

        {/* Kiran Games Studio Header */}
        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="text-amber-400 font-mono tracking-[0.3em] text-xs uppercase font-semibold mb-2 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]"
        >
          Kiran Games Studio
        </motion.p>

        {/* Game Title */}
        <motion.h1
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.7 }}
          className="text-4xl sm:text-5xl font-extrabold font-sans tracking-wide bg-gradient-to-b from-yellow-100 via-amber-300 to-yellow-500 bg-clip-text text-transparent drop-shadow-[0_4px_12px_rgba(245,158,11,0.25)]"
        >
          LUCKY SPIN
        </motion.h1>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
          className="flex items-center gap-1.5 mt-2 px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full"
        >
          <Disc className="w-3.5 h-3.5 text-amber-400 animate-spin" />
          <span className="text-[10px] text-amber-300/80 uppercase font-bold tracking-widest">
            Premium Virtual Edition
          </span>
        </motion.div>
      </div>

      {/* Loading Bar & Footer */}
      <div className="w-full max-w-xs flex flex-col items-center mb-6">
        <span className="text-xs text-slate-400 font-medium mb-2.5 tracking-wider transition-all duration-300">
          {loadingText}
        </span>
        
        {/* Outer bar */}
        <div className="w-full h-2.5 bg-slate-900 border border-amber-500/20 rounded-full overflow-hidden p-[2px]">
          {/* Inner progress */}
          <motion.div
            className="h-full bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 rounded-full shadow-[0_0_8px_rgba(245,158,11,0.6)]"
            animate={{ width: `${progress}%` }}
            transition={{ ease: 'easeOut' }}
          />
        </div>
        
        <span className="text-[10px] text-amber-500/60 mt-3 font-mono">
          V1.0.0 • virtual coin system
        </span>
      </div>
    </div>
  );
}
