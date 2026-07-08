import React, { useState } from 'react';
import { 
  Share2, 
  Copy, 
  Check, 
  Gift, 
  Users, 
  AlertCircle, 
  ArrowRight, 
  Coins, 
  Flame 
} from 'lucide-react';
import { UserProfile } from '../types';
import { redeemReferralCode, updateUserProfileInDb } from '../utils/firebaseDb';
import { playClickSound, playCoinSound } from '../utils/audio';

interface ReferralsProps {
  userId: string | null;
  profile: UserProfile;
  soundEnabled: boolean;
  onUpdateProfile: (updates: Partial<UserProfile>) => void;
  onAddTransaction: (tx: { type: any; amount: number; label: string }) => void;
}

export default function Referrals({
  userId,
  profile,
  soundEnabled,
  onUpdateProfile,
  onAddTransaction
}: ReferralsProps) {
  const [enteredCode, setEnteredCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  
  const referralCode = profile.referralCode || 'SIGN-IN';

  // Handle Share to Earn reward (once every 24 hours)
  const [sharing, setSharing] = useState(false);
  const [shareSuccess, setShareSuccess] = useState('');

  const canShareBonus = () => {
    if (!profile.lastShareTime) return true;
    const lastShare = new Date(profile.lastShareTime).getTime();
    const twentyFourHours = 24 * 60 * 60 * 1000;
    return Date.now() - lastShare >= twentyFourHours;
  };

  const handleShare = async () => {
    setError('');
    setSuccess('');
    setShareSuccess('');
    playClickSound(soundEnabled);

    const shareUrl = window.location.origin;
    const shareText = `🎰 Join me on Kiran Lucky Spin! Use my referral code: ${referralCode} to get +500 Coins & +5 free spins instantly! Play here: ${shareUrl}`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Kiran Lucky Spin',
          text: shareText,
          url: shareUrl,
        });
      } else {
        await navigator.clipboard.writeText(shareText);
        setShareSuccess('Invite text copied to clipboard! Share it with friends.');
      }

      // Reward user if eligible
      if (canShareBonus() && userId) {
        const rewardCoins = 150;
        const rewardSpins = 1;
        const nowStr = new Date().toISOString();

        await updateUserProfileInDb(userId, {
          coins: profile.coins + rewardCoins,
          spinsRemaining: profile.spinsRemaining + rewardSpins,
          lastShareTime: nowStr,
        });

        onUpdateProfile({
          coins: profile.coins + rewardCoins,
          spinsRemaining: profile.spinsRemaining + rewardSpins,
          lastShareTime: nowStr,
        });

        onAddTransaction({
          type: 'xp_bonus',
          amount: rewardCoins,
          label: 'Daily Share-to-Earn Bonus Reward',
        });

        playCoinSound(soundEnabled);
        setShareSuccess(`Shared successfully! Received +${rewardCoins} Coins & +${rewardSpins} Spin!`);
      }
    } catch (e) {
      console.error('[Share Error]', e);
    }
  };

  // Handle Referral Code submission
  const handleSubmitReferral = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) {
      setError('Please log in or play as Guest to claim referral rewards.');
      return;
    }
    if (!enteredCode.trim()) {
      setError('Please enter a code first.');
      return;
    }

    setError('');
    setSuccess('');
    setLoading(true);
    playClickSound(soundEnabled);

    try {
      const res = await redeemReferralCode(userId, enteredCode);
      if (res.success) {
        setSuccess(res.message);
        setEnteredCode('');
        
        // Give local updates
        const updatedCoins = profile.coins + (res.rewardCoins || 500);
        const updatedSpins = profile.spinsRemaining + (res.rewardSpins || 5);
        
        onUpdateProfile({
          coins: updatedCoins,
          spinsRemaining: updatedSpins,
          referredBy: 'partner', // placeholder to mark completed
        });

        onAddTransaction({
          type: 'xp_bonus',
          amount: res.rewardCoins || 500,
          label: 'Redeemed friend referral code',
        });

        playCoinSound(soundEnabled);
      } else {
        setError(res.message);
      }
    } catch (err: any) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Copy code directly to clipboard
  const handleCopyCode = async () => {
    playClickSound(soundEnabled);
    try {
      await navigator.clipboard.writeText(referralCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="w-full bg-[#001c55]/90 border border-amber-500/20 rounded-3xl p-5 shadow-xl select-none text-white flex flex-col gap-5">
      
      {/* 1. Header Portion */}
      <div className="flex items-center gap-2.5 border-b border-amber-500/10 pb-4">
        <div className="p-2.5 bg-blue-500/10 border border-blue-500/20 rounded-xl">
          <Users className="w-5 h-5 text-blue-400" />
        </div>
        <div>
          <h3 className="text-base font-extrabold text-white">Refer & Share Earn</h3>
          <p className="text-[10px] text-slate-400 font-medium">Power up with friends globally</p>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="p-3 bg-red-500/15 border border-red-500/30 rounded-xl flex items-center gap-2 text-[11px] text-red-300 font-medium">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-3 bg-emerald-500/15 border border-emerald-500/30 rounded-xl flex items-center gap-2 text-[11px] text-emerald-300 font-medium">
          <Gift className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* 2. My Referral Code Box */}
      <div className="bg-[#030712]/60 border border-slate-800 p-4 rounded-2xl flex flex-col gap-3">
        <div>
          <p className="text-[9px] text-slate-400 uppercase tracking-wider font-bold">Your Referral Code</p>
          <p className="text-[10px] text-slate-500 mt-0.5">Friends receive +500 Coins & +5 Spins when they enter your code!</p>
        </div>

        <div className="flex gap-2">
          <div className="flex-1 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-center py-2 px-3 font-mono text-base font-black text-amber-400 uppercase tracking-widest">
            {referralCode}
          </div>
          <button
            id="copy-referral-btn"
            onClick={handleCopyCode}
            className="px-4 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 active:scale-95 transition-all"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-400">COPIED</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-amber-500" />
                <span>COPY</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 3. Share to Earn daily bonus card */}
      <div className="bg-[#030712]/60 border border-slate-800 p-4 rounded-2xl flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-xs font-extrabold text-slate-100">Share to Earn</h4>
            <p className="text-[9px] text-slate-500 mt-0.5 leading-tight">Share once a day to instantly unlock extra bonus rewards!</p>
          </div>
          <span className={`text-[8px] font-mono px-2 py-0.5 rounded-full uppercase tracking-wider font-bold ${canShareBonus() ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800 text-slate-500'}`}>
            {canShareBonus() ? 'Daily Ready' : 'Cooldown'}
          </span>
        </div>

        {shareSuccess && (
          <p className="text-[10px] text-emerald-400 font-bold bg-emerald-500/5 p-2 rounded-lg border border-emerald-500/20">{shareSuccess}</p>
        )}

        <button
          id="share-game-btn"
          onClick={handleShare}
          className="w-full py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:brightness-110 text-white font-black rounded-xl text-xs active:scale-95 transition-all flex items-center justify-center gap-2"
        >
          <Share2 className="w-4 h-4 text-white" />
          SHARE WITH FRIENDS (+150 Coins & +1 Spin)
        </button>
      </div>

      {/* 4. Enter Friend Referral Code Form */}
      {!profile.referredBy ? (
        <form onSubmit={handleSubmitReferral} className="bg-[#030712]/60 border border-slate-800 p-4 rounded-2xl flex flex-col gap-3">
          <div>
            <p className="text-xs font-extrabold text-slate-100">Enter Referral Code</p>
            <p className="text-[10px] text-slate-500 mt-0.5">Enter a friend's referral code to instantly get +500 Coins and +5 Spins!</p>
          </div>

          <div className="flex gap-2">
            <input
              id="referral-input"
              type="text"
              value={enteredCode}
              onChange={(e) => setEnteredCode(e.target.value)}
              disabled={loading}
              placeholder="e.g. USER-1234"
              className="flex-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono font-bold text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 uppercase"
            />
            <button
              id="submit-referral-btn"
              type="submit"
              disabled={loading || !enteredCode.trim()}
              className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black rounded-xl text-xs hover:brightness-110 active:scale-95 transition-all flex items-center gap-1 shadow-[0_2px_8px_rgba(245,158,11,0.25)] disabled:opacity-50"
            >
              CLAIM
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      ) : (
        <div className="p-3.5 bg-slate-950/60 border border-slate-900 rounded-2xl text-center text-[11px] text-slate-400 flex items-center justify-center gap-2 font-medium">
          <Gift className="w-4 h-4 text-amber-500 animate-bounce" />
          <span>You have already redeemed a referral bonus. Happy spinning!</span>
        </div>
      )}
    </div>
  );
}
