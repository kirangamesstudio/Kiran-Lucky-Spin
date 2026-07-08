import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Calendar, Gift, Check, Clock, Coins, Flame, Trophy } from 'lucide-react';
import { playCoinSound, playFanfareSound } from '../utils/audio';

interface DailyRewardProps {
  lastDailyRewardTime: string | null;
  dailyRewardStreak: number;
  soundEnabled: boolean;
  onClaim: (coinsWon: number, spinsWon: number, nextStreak: number) => void;
}

interface RewardDay {
  day: number;
  coins: number;
  spins: number;
  label: string;
}

const REWARDS: RewardDay[] = [
  { day: 1, coins: 100, spins: 0, label: 'Starter' },
  { day: 2, coins: 150, spins: 0, label: 'Double Up' },
  { day: 3, coins: 200, spins: 1, label: 'Spin Bonus' },
  { day: 4, coins: 250, spins: 0, label: 'Big Coins' },
  { day: 5, coins: 350, spins: 1, label: 'Super Combo' },
  { day: 6, coins: 500, spins: 2, label: 'Lucky Six' },
  { day: 7, coins: 1000, spins: 5, label: 'GRAND JACKPOT ⭐' },
];

export default function DailyReward({
  lastDailyRewardTime,
  dailyRewardStreak,
  soundEnabled,
  onClaim,
}: DailyRewardProps) {
  const [canClaim, setCanClaim] = useState(false);
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [claimedToday, setClaimedToday] = useState(false);

  // Check check-in status
  useEffect(() => {
    const checkRewardStatus = () => {
      if (!lastDailyRewardTime) {
        setCanClaim(true);
        setClaimedToday(false);
        return;
      }

      const lastClaim = new Date(lastDailyRewardTime);
      const now = new Date();

      // Convert to timestamps
      const diffMs = now.getTime() - lastClaim.getTime();
      const diffHours = diffMs / (1000 * 60 * 60);

      // Reset streak if more than 48 hours passed
      if (diffHours >= 48) {
        // Handled at parent level when app loads, but set locally too
        setCanClaim(true);
        setClaimedToday(false);
      } else if (diffHours >= 24) {
        setCanClaim(true);
        setClaimedToday(false);
      } else {
        // Not 24 hours yet
        setCanClaim(false);
        setClaimedToday(true);

        // Start countdown timer for next reward
        const nextRewardTime = new Date(lastClaim.getTime() + 24 * 60 * 60 * 1000);
        const updateCountdown = () => {
          const currentTime = new Date();
          const remainingMs = nextRewardTime.getTime() - currentTime.getTime();
          
          if (remainingMs <= 0) {
            setCanClaim(true);
            setClaimedToday(false);
            setTimeLeft('');
          } else {
            const h = Math.floor(remainingMs / (1000 * 60 * 60));
            const m = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));
            const s = Math.floor((remainingMs % (1000 * 60)) / 1000);
            setTimeLeft(
              `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
            );
          }
        };

        updateCountdown();
        const interval = setInterval(updateCountdown, 1000);
        return () => clearInterval(interval);
      }
    };

    checkRewardStatus();
  }, [lastDailyRewardTime]);

  const handleClaim = () => {
    if (!canClaim) return;

    // Calculate current day index
    // Streak goes from 0 to 6, then loops back to 0
    const currentDayIndex = dailyRewardStreak % 7;
    const todayReward = REWARDS[currentDayIndex];

    const nextStreak = dailyRewardStreak + 1;

    // Trigger sounds
    playCoinSound(soundEnabled);
    playFanfareSound(soundEnabled);

    onClaim(todayReward.coins, todayReward.spins, nextStreak);
    setCanClaim(false);
    setClaimedToday(true);
  };

  // Determine current day reward index
  const currentDayIndex = dailyRewardStreak % 7;

  return (
    <div className="w-full bg-[#001c55]/90 border border-amber-500/20 rounded-3xl p-5 shadow-xl select-none text-white">
      {/* Daily Reward Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl">
            <Gift className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-white">Daily Check-In</h3>
            <p className="text-[10px] text-slate-400 font-medium">Claim virtual gold daily</p>
          </div>
        </div>

        {/* Current streak indicator */}
        <div className="flex items-center gap-1 px-3 py-1 bg-amber-500/15 border border-amber-500/30 rounded-full">
          <Flame className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
          <span className="text-xs font-bold text-amber-300">{dailyRewardStreak} Day Streak</span>
        </div>
      </div>

      {/* Grid of 7 days */}
      <div className="grid grid-cols-4 sm:grid-cols-7 gap-2 mb-6">
        {REWARDS.map((day, idx) => {
          const isClaimed = idx < currentDayIndex;
          const isToday = idx === currentDayIndex && canClaim;
          const isLocked = idx > currentDayIndex || (idx === currentDayIndex && !canClaim);
          const isGrandChest = day.day === 7;

          return (
            <div
              key={day.day}
              className={`relative flex flex-col items-center justify-between p-2 rounded-xl border text-center transition-all ${
                isClaimed
                  ? 'bg-amber-500/10 border-amber-500/40 text-amber-300'
                  : isToday
                  ? 'bg-gradient-to-b from-amber-400/20 to-amber-600/30 border-amber-400 scale-105 shadow-[0_0_12px_rgba(245,158,11,0.25)] animate-pulse'
                  : 'bg-[#030712] border-slate-800 text-slate-500'
              } ${isGrandChest ? 'col-span-2 sm:col-span-1' : ''}`}
            >
              <span className="text-[10px] font-bold uppercase tracking-wider mb-1">
                Day {day.day}
              </span>

              {/* Day Visual Core */}
              <div className="my-1.5 flex flex-col items-center justify-center">
                {isClaimed ? (
                  <div className="w-7 h-7 rounded-full bg-amber-500 flex items-center justify-center text-[#070e27]">
                    <Check className="w-4 h-4 stroke-[3]" />
                  </div>
                ) : isGrandChest ? (
                  <Trophy className={`w-8 h-8 ${isToday ? 'text-amber-400 animate-bounce' : 'text-slate-500'}`} />
                ) : (
                  <div className="relative">
                    <Coins className={`w-7 h-7 ${isToday ? 'text-amber-400' : 'text-slate-500'}`} />
                    {day.spins > 0 && (
                      <span className="absolute -top-1 -right-1 bg-blue-500 text-[8px] px-1 rounded-full text-white font-extrabold font-mono">
                        +{day.spins}S
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Day Reward Amount */}
              <div className="flex flex-col items-center">
                <span className="text-[10px] font-extrabold">
                  {day.coins > 0 ? `+${day.coins}` : ''}
                </span>
                <span className="text-[8px] font-mono opacity-80 text-slate-400">
                  {day.label}
                </span>
              </div>

              {/* Selected highlight dot */}
              {isToday && (
                <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Claim Action Bar */}
      <div className="w-full flex flex-col items-center">
        {canClaim ? (
          <button
            id="claim-daily-btn"
            onClick={handleClaim}
            className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 text-[#070e27] font-extrabold text-sm rounded-2xl hover:brightness-110 active:scale-95 transition-all shadow-[0_4px_15px_rgba(245,158,11,0.35)]"
          >
            CLAIM TODAY'S REWARD! (+{REWARDS[currentDayIndex].coins} Coins)
          </button>
        ) : (
          <div className="w-full flex items-center justify-between bg-slate-950/70 border border-slate-800 p-3 rounded-2xl">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-500" />
              <span className="text-xs text-slate-400 font-medium">Next daily reward in:</span>
            </div>
            <span className="text-sm font-extrabold font-mono text-amber-400">
              {claimedToday ? timeLeft : '24:00:00'}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
