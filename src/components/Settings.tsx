import { useState } from 'react';
import { Volume2, VolumeX, Smartphone, Sparkles, Check, Share2, Globe } from 'lucide-react';
import { playClickSound } from '../utils/audio';

interface SettingsProps {
  soundEnabled: boolean;
  hapticEnabled: boolean;
  onUpdateSound: (enabled: boolean) => void;
  onUpdateHaptic: (enabled: boolean) => void;
  onClose: () => void;
}

export default function Settings({
  soundEnabled,
  hapticEnabled,
  onUpdateSound,
  onUpdateHaptic,
  onClose,
}: SettingsProps) {
  const [copied, setCopied] = useState(false);
  
  const toggleSound = () => {
    const nextVal = !soundEnabled;
    onUpdateSound(nextVal);
    playClickSound(nextVal);
  };

  const toggleHaptic = () => {
    onUpdateHaptic(!hapticEnabled);
    playClickSound(soundEnabled);
  };

  const handleShare = async () => {
    playClickSound(soundEnabled);
    const shareData = {
      title: 'Kiran Lucky Spin',
      text: '🎡 Spin the wheel, win virtual coins, and beat the daily check-in streaks!',
      url: window.location.origin + window.location.pathname,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch (err) {
        console.log('Native share failed or dismissed, trying fallback', err);
      }
    }

    // Fallback to clipboard copy
    try {
      await navigator.clipboard.writeText(shareData.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error('Clipboard copy failed', err);
    }
  };

  const handleSocialShare = (platform: 'whatsapp' | 'twitter' | 'telegram') => {
    playClickSound(soundEnabled);
    const shareUrl = encodeURIComponent(window.location.origin + window.location.pathname);
    const text = encodeURIComponent('🎡 Spin the wheel, win virtual gold, and level up in Kiran Lucky Spin! Play here: ');
    
    let url = '';
    if (platform === 'whatsapp') {
      url = `https://api.whatsapp.com/send?text=${text}${shareUrl}`;
    } else if (platform === 'twitter') {
      url = `https://twitter.com/intent/tweet?text=${text}&url=${shareUrl}`;
    } else if (platform === 'telegram') {
      url = `https://t.me/share/url?url=${shareUrl}&text=${text}`;
    }

    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="w-full bg-[#001c55]/90 border border-amber-500/20 rounded-3xl p-5 shadow-xl text-white select-none">
      
      {/* Settings Header */}
      <div className="flex items-center gap-2.5 mb-5 pb-3 border-b border-amber-500/10">
        <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl">
          <Smartphone className="w-5 h-5 text-amber-400" />
        </div>
        <div>
          <h3 className="text-base font-extrabold text-white">Device Settings</h3>
          <p className="text-[10px] text-slate-400 font-medium">Configure game and audio preferences</p>
        </div>
      </div>

      {/* Control Buttons List */}
      <div className="flex flex-col gap-3 mb-5">
        
        {/* Sound toggle */}
        <div className="flex items-center justify-between p-3 bg-[#030712]/50 border border-slate-800 rounded-xl">
          <div className="flex items-center gap-3">
            <div className="p-1.5 bg-slate-900 rounded-lg">
              {soundEnabled ? (
                <Volume2 className="w-4 h-4 text-amber-400" />
              ) : (
                <VolumeX className="w-4 h-4 text-slate-500" />
              )}
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-bold text-slate-200">Game Sound Effects</span>
              <span className="text-[9px] text-slate-500 font-medium">Synthesized arcade ticks & chimes</span>
            </div>
          </div>

          <button
            onClick={toggleSound}
            className={`w-11 h-6 rounded-full p-1 transition-all ${
              soundEnabled ? 'bg-amber-500' : 'bg-slate-800'
            }`}
          >
            <div
              className={`w-4 h-4 rounded-full bg-slate-950 transition-all ${
                soundEnabled ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Haptic simulation toggle */}
        <div className="flex items-center justify-between p-3 bg-[#030712]/50 border border-slate-800 rounded-xl">
          <div className="flex items-center gap-3">
            <div className="p-1.5 bg-slate-900 rounded-lg">
              <Smartphone className="w-4 h-4 text-amber-400" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-bold text-slate-200">Haptic Vibration</span>
              <span className="text-[9px] text-slate-500 font-medium">Buzzer feedbacks upon spin ticks</span>
            </div>
          </div>

          <button
            onClick={toggleHaptic}
            className={`w-11 h-6 rounded-full p-1 transition-all ${
              hapticEnabled ? 'bg-amber-500' : 'bg-slate-800'
            }`}
          >
            <div
              className={`w-4 h-4 rounded-full bg-slate-950 transition-all ${
                hapticEnabled ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Share / Publish Card */}
      <div className="w-full bg-slate-950/80 p-4 rounded-2xl border border-amber-500/15 flex flex-col gap-3">
        <h4 className="text-xs font-extrabold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
          <Globe className="w-3.5 h-3.5 text-amber-400" />
          Publish & Share Web App
        </h4>
        <p className="text-[10px] text-slate-400 leading-relaxed">
          Love playing <strong>Kiran Lucky Spin</strong>? Share your lucky link with friends to show off your virtual balance and spin stats!
        </p>

        <div className="flex flex-col gap-2">
          <button
            id="share-app-btn"
            onClick={handleShare}
            className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:brightness-110 active:scale-[0.98] transition-all text-slate-950 text-xs font-black rounded-xl flex items-center justify-center gap-2 shadow-[0_4px_12px_rgba(245,158,11,0.2)]"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4" />
                COPIED TO CLIPBOARD!
              </>
            ) : (
              <>
                <Share2 className="w-4 h-4" />
                SHARE LUCKY LINK
              </>
            )}
          </button>

          {/* Quick Social Icons */}
          <div className="flex items-center justify-around mt-1 border-t border-slate-900 pt-3">
            <button
              onClick={() => handleSocialShare('whatsapp')}
              className="px-2 py-1 bg-green-500/10 border border-green-500/20 rounded-lg hover:bg-green-500/20 text-green-400 transition-all text-[10px] font-bold"
            >
              WhatsApp
            </button>
            <button
              onClick={() => handleSocialShare('twitter')}
              className="px-2 py-1 bg-blue-400/10 border border-blue-400/20 rounded-lg hover:bg-blue-400/20 text-blue-400 transition-all text-[10px] font-bold"
            >
              Twitter / X
            </button>
            <button
              onClick={() => handleSocialShare('telegram')}
              className="px-2 py-1 bg-sky-500/10 border border-sky-500/20 rounded-lg hover:bg-sky-500/20 text-sky-400 transition-all text-[10px] font-bold"
            >
              Telegram
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
