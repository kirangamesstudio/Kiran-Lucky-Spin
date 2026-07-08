import { Trophy, Star, Gift, Check, Lock, Sparkles, Coins } from 'lucide-react';
import { UserProfile } from '../types';
import { playClickSound } from '../utils/audio';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  requirementType: 'spins' | 'coins' | 'level' | 'streak';
  requirementValue: number;
  rewardCoins: number;
  rewardSpins: number;
  badge: string;
}

export const GAME_ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_spin',
    title: 'First Spin',
    description: 'Complete your first lucky spin of the wheel!',
    requirementType: 'spins',
    requirementValue: 1,
    rewardCoins: 100,
    rewardSpins: 2,
    badge: '🎯',
  },
  {
    id: 'spin_rookie',
    title: 'Spin Rookie',
    description: 'Complete 10 total lucky spins!',
    requirementType: 'spins',
    requirementValue: 10,
    rewardCoins: 250,
    rewardSpins: 3,
    badge: '⚙️',
  },
  {
    id: 'spin_master',
    title: 'Spin Veteran',
    description: 'Complete 50 total lucky spins!',
    requirementType: 'spins',
    requirementValue: 50,
    rewardCoins: 1000,
    rewardSpins: 10,
    badge: '🔮',
  },
  {
    id: 'coin_wealthy',
    title: 'Coin Collector',
    description: 'Amass a total of 5,000 virtual coins!',
    requirementType: 'coins',
    requirementValue: 5000,
    rewardCoins: 500,
    rewardSpins: 4,
    badge: '💰',
  },
  {
    id: 'coin_millionaire',
    title: 'Treasure Lord',
    description: 'Amass a total of 15,000 virtual coins!',
    requirementType: 'coins',
    requirementValue: 15000,
    rewardCoins: 1500,
    rewardSpins: 8,
    badge: '💎',
  },
  {
    id: 'level_5',
    title: 'Power Level 5',
    description: 'Reach Level 5 via spin XP!',
    requirementType: 'level',
    requirementValue: 5,
    rewardCoins: 300,
    rewardSpins: 3,
    badge: '👑',
  },
  {
    id: 'level_10',
    title: 'Grand Master 10',
    description: 'Reach Level 10 via spin XP!',
    requirementType: 'level',
    requirementValue: 10,
    rewardCoins: 1200,
    rewardSpins: 10,
    badge: '🌟',
  },
  {
    id: 'daily_loyalist',
    title: 'Daily Devotee',
    description: 'Reach a 3-day daily streak!',
    requirementType: 'streak',
    requirementValue: 3,
    rewardCoins: 400,
    rewardSpins: 4,
    badge: '🔥',
  }
];

interface AchievementsProps {
  profile: UserProfile;
  onClaimAchievement: (achievementId: string, rewardCoins: number, rewardSpins: number) => void;
}

export default function Achievements({ profile, onClaimAchievement }: AchievementsProps) {
  const claimedList = profile.claimedAchievements || [];
  const spinsCount = profile.spinsCompleted || 0;
  const currentCoins = profile.coins;
  const currentLevel = profile.level;
  const dailyStreak = profile.dailyRewardStreak || 0;

  // Calculate user progress values for each requirement type
  const getProgress = (achievement: Achievement) => {
    switch (achievement.requirementType) {
      case 'spins':
        return Math.min(spinsCount, achievement.requirementValue);
      case 'coins':
        return Math.min(currentCoins, achievement.requirementValue);
      case 'level':
        return Math.min(currentLevel, achievement.requirementValue);
      case 'streak':
        return Math.min(dailyStreak, achievement.requirementValue);
      default:
        return 0;
    }
  };

  // Helper to determine status
  const getStatus = (achievement: Achievement) => {
    const isClaimed = claimedList.includes(achievement.id);
    if (isClaimed) return 'claimed';

    const currentProgress = getProgress(achievement);
    const isUnlocked = currentProgress >= achievement.requirementValue;
    return isUnlocked ? 'unlocked' : 'locked';
  };

  // Total progression calculation
  const totalAchievements = GAME_ACHIEVEMENTS.length;
  const completedAchievements = GAME_ACHIEVEMENTS.filter(a => getStatus(a) === 'unlocked' || getStatus(a) === 'claimed').length;
  const overallPercentage = Math.round((completedAchievements / totalAchievements) * 100);

  return (
    <div className="w-full bg-[#001c55]/90 border border-amber-500/20 rounded-3xl p-5 shadow-xl select-none text-white">
      {/* Header with overall progress bar */}
      <div className="flex flex-col gap-3 mb-5 border-b border-amber-500/10 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl">
            <Trophy className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-white">Kiran Achievements</h3>
            <p className="text-[10px] text-slate-400 font-medium">Claim free bonus coins & spins</p>
          </div>
        </div>

        {/* Dynamic Progress indicator */}
        <div className="bg-slate-950/80 p-3 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between mb-1.5 text-[10px] font-mono text-slate-400 font-bold">
            <span>CHALLENGES UNLOCKED</span>
            <span className="text-amber-400">{completedAchievements} / {totalAchievements} ({overallPercentage}%)</span>
          </div>
          <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden p-[1px]">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 rounded-full transition-all duration-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]"
              style={{ width: `${overallPercentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* List of achievements */}
      <div className="flex flex-col gap-2.5 max-h-[310px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-amber-500/20">
        {GAME_ACHIEVEMENTS.map((item) => {
          const status = getStatus(item);
          const currentProgress = getProgress(item);
          const percent = Math.round((currentProgress / item.requirementValue) * 100);
          
          return (
            <div
              key={item.id}
              className={`flex flex-col gap-2 p-3 rounded-2xl border transition-all ${
                status === 'claimed'
                  ? 'bg-slate-950/40 border-slate-900 opacity-60'
                  : status === 'unlocked'
                  ? 'bg-gradient-to-r from-amber-500/10 to-transparent border-amber-500/40 shadow-[0_0_12px_rgba(245,158,11,0.08)]'
                  : 'bg-[#030712]/60 border-slate-800/80'
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                {/* Badge and Title */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center text-2xl select-none">
                    {item.badge}
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-100 flex items-center gap-1.5">
                      {item.title}
                      {status === 'unlocked' && (
                        <span className="text-[7px] bg-amber-500 text-[#070e27] font-extrabold px-1.5 py-0.5 rounded-full uppercase tracking-wider animate-pulse">Claim</span>
                      )}
                    </h4>
                    <p className="text-[10px] text-slate-400 mt-0.5 leading-tight">{item.description}</p>
                  </div>
                </div>

                {/* Reward Indicator or Action Button */}
                <div>
                  {status === 'claimed' ? (
                    <div className="p-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg">
                      <Check className="w-4 h-4" />
                    </div>
                  ) : status === 'unlocked' ? (
                    <button
                      id={`claim-${item.id}-btn`}
                      onClick={() => {
                        playClickSound(profile.soundEnabled);
                        onClaimAchievement(item.id, item.rewardCoins, item.rewardSpins);
                      }}
                      className="px-3 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black text-[10px] rounded-xl hover:brightness-110 active:scale-95 transition-all shadow-[0_2px_8px_rgba(245,158,11,0.3)]"
                    >
                      CLAIM
                    </button>
                  ) : (
                    <div className="flex flex-col items-end gap-0.5 text-right font-mono text-[9px] text-slate-500 font-bold uppercase">
                      <div className="flex items-center gap-0.5 text-slate-400">
                        <Coins className="w-2.5 h-2.5 text-amber-500" />
                        <span>+{item.rewardCoins}</span>
                      </div>
                      <div>+{item.rewardSpins} Spins</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Progress Bar (Only show if not fully claimed) */}
              {status !== 'claimed' && (
                <div className="flex items-center gap-2.5 mt-1">
                  <div className="flex-1 h-1.5 bg-slate-950 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 to-amber-600 rounded-full transition-all duration-300"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                  <span className="text-[9px] font-mono font-bold text-slate-500 shrink-0">
                    {currentProgress}/{item.requirementValue}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <p className="text-[8px] text-slate-500 text-center mt-3.5 font-mono uppercase tracking-wider">
        Earn XP with every claim to power up your levels!
      </p>
    </div>
  );
}
