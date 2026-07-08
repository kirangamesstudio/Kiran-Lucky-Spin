import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, X, ShieldAlert, Award, Clock, Star, Sparkles, Volume2, VolumeX, CheckCircle } from 'lucide-react';
import { playAdStartSound, playCoinSound } from '../utils/audio';

interface AdsPlaceholderProps {
  soundEnabled: boolean;
  onAdCompleted: (rewardType: 'coins' | 'spins') => void;
}

const SIMULATED_SPONSORS = [
  { title: 'Kiran Space Odyssey', tagline: 'Epic vertical space fighter shooter game. Try now!', emoji: '🚀' },
  { title: 'Kiran Block Puzzle Pro', tagline: 'Relaxing block fit brain teaser puzzle solver.', emoji: '🧩' },
  { title: 'Kiran Crypto Tycoon', tagline: 'Virtual trading simulator. Rule the global charts!', emoji: '📈' },
];

export default function AdsPlaceholder({
  soundEnabled,
  onAdCompleted,
}: AdsPlaceholderProps) {
  const [activeSimIndex, setActiveSimIndex] = useState(0);
  const [bannerClosed, setBannerClosed] = useState(false);

  // Rotate simulated banner sponsor texts
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveSimIndex((prev) => (prev + 1) % SIMULATED_SPONSORS.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const activeSponsor = SIMULATED_SPONSORS[activeSimIndex];

  return (
    <div className="w-full flex flex-col items-center select-none text-white gap-4">
      {/* 1. Regular AdMob Banner Mock Frame */}
      {!bannerClosed && (
        <div className="w-full bg-[#030712] border border-amber-500/15 rounded-xl p-2.5 relative overflow-hidden shadow-inner flex items-center justify-between">
          <div className="absolute top-0 left-0 bg-amber-500 text-[#070e27] text-[7px] font-extrabold uppercase px-1.5 py-0.5 rounded-br font-mono tracking-widest z-10">
            AdMob Banner
          </div>

          <div className="flex items-center gap-3 pl-1 mt-1.5">
            <span className="text-2xl animate-bounce">{activeSponsor.emoji}</span>
            <div className="flex flex-col text-left">
              <span className="text-xs font-black text-amber-400">
                {activeSponsor.title}
              </span>
              <span className="text-[9px] text-slate-400 font-medium">
                {activeSponsor.tagline}
              </span>
            </div>
          </div>

          {/* Banner Close simulated action */}
          <button
            onClick={() => setBannerClosed(true)}
            className="p-1 text-slate-500 hover:text-white transition-all shrink-0 self-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}

interface RewardedAdModalProps {
  isOpen: boolean;
  soundEnabled: boolean;
  onClose: () => void;
  onComplete: (rewardType: 'coins' | 'spins') => void;
}

export function RewardedAdModal({
  isOpen,
  soundEnabled,
  onClose,
  onComplete,
}: RewardedAdModalProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [countdown, setCountdown] = useState(10);
  const [rewardClaimed, setRewardClaimed] = useState(false);
  const [rewardSelection, setRewardSelection] = useState<'coins' | 'spins'>('spins');

  useEffect(() => {
    if (!isOpen) {
      setIsPlaying(false);
      setCountdown(10);
      setRewardClaimed(false);
      return;
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isPlaying) return;

    if (countdown <= 0) {
      setIsPlaying(false);
      setRewardClaimed(true);
      playCoinSound(soundEnabled);
      onComplete(rewardSelection);
      return;
    }

    const timer = setTimeout(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [isPlaying, countdown]);

  const handleStartAd = (type: 'coins' | 'spins') => {
    setRewardSelection(type);
    setIsPlaying(true);
    setCountdown(10);
    setRewardClaimed(false);
    playAdStartSound(soundEnabled);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-6">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="w-full max-w-sm bg-gradient-to-b from-[#001c55] to-[#040814] border border-amber-500/40 rounded-3xl p-6 text-center relative overflow-hidden shadow-2xl"
      >
        {/* Close Button if ad not playing */}
        {!isPlaying && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 bg-[#030712] border border-slate-800 text-slate-400 hover:text-white rounded-full transition-all"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        )}

        <div className="absolute top-0 left-0 bg-amber-500 text-slate-950 text-[8px] font-black uppercase px-2.5 py-1 rounded-br font-mono">
          AdMob Rewarded
        </div>

        {/* 1. Main Welcome Screen */}
        {!isPlaying && !rewardClaimed && (
          <div className="flex flex-col items-center pt-4">
            <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mb-4">
              <Award className="w-8 h-8 text-amber-400" />
            </div>

            <h3 className="text-xl font-extrabold text-white mb-2">Simulated Ad Station</h3>
            <p className="text-xs text-slate-400 mb-6 px-4 leading-relaxed">
              Watch a quick 10-second simulated sponsor showcase to claim valuable rewards absolutely free!
            </p>

            <div className="flex flex-col gap-3 w-full">
              {/* Option 1: Claim Free Spins */}
              <button
                onClick={() => handleStartAd('spins')}
                className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-extrabold text-xs rounded-xl flex items-center justify-center gap-2 hover:brightness-110 active:scale-95 transition-all"
              >
                <Play className="w-4 h-4 fill-slate-950" />
                WATCH FOR +3 FREE SPINS!
              </button>

              {/* Option 2: Claim Free Coins */}
              <button
                onClick={() => handleStartAd('coins')}
                className="w-full py-3 bg-slate-900 border border-amber-500/20 text-amber-400 font-extrabold text-xs rounded-xl flex items-center justify-center gap-2 hover:bg-slate-800 active:scale-95 transition-all"
              >
                <Play className="w-4 h-4 fill-amber-400" />
                WATCH FOR +100 COINS!
              </button>
            </div>
          </div>
        )}

        {/* 2. Playing Simulated Video Ad Player */}
        {isPlaying && (
          <div className="flex flex-col items-center py-6">
            {/* Pulsing countdown frame */}
            <div className="relative w-28 h-28 flex items-center justify-center mb-6">
              {/* Spinning progress ring */}
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="56"
                  cy="56"
                  r="48"
                  stroke="#0f172a"
                  strokeWidth="8"
                  fill="transparent"
                />
                <motion.circle
                  cx="56"
                  cy="56"
                  r="48"
                  stroke="#f59e0b"
                  strokeWidth="8"
                  fill="transparent"
                  strokeDasharray="301.6"
                  initial={{ strokeDashoffset: 0 }}
                  animate={{ strokeDashoffset: 301.6 }}
                  transition={{ duration: 10, ease: 'linear' }}
                />
              </svg>
              
              <span className="absolute text-3xl font-black text-white font-mono">
                {countdown}
              </span>
            </div>

            <p className="text-amber-400 font-extrabold uppercase tracking-widest text-xs font-mono mb-1">
              Simulating Sponsor Clip
            </p>
            <h4 className="text-lg font-bold text-white mb-2">
              Kiran Run: Temple Escape
            </h4>
            
            <p className="text-xs text-slate-400 max-w-xs px-2 leading-relaxed italic">
              "Experience the ultimate adrenaline-filled endless runner action from Kiran Games Studio! Compete against world charts..."
            </p>
          </div>
        )}

        {/* 3. Reward Claimed / Congratulations Screen */}
        {rewardClaimed && (
          <div className="flex flex-col items-center pt-4">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mb-4">
              <CheckCircle className="w-8 h-8 text-emerald-400" />
            </div>

            <h3 className="text-xl font-extrabold text-white mb-2">Reward Credited!</h3>
            <p className="text-xs text-slate-400 mb-6 px-4">
              Simulated ad complete. Your virtual reward of <strong>{rewardSelection === 'coins' ? '100 Virtual Coins' : '3 Free Lucky Spins'}</strong> has been successfully credited!
            </p>

            <button
              onClick={onClose}
              className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-bold rounded-xl hover:brightness-110 transition-all"
            >
              COLLECT REWARD!
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
