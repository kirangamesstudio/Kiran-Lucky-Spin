export interface UserProfile {
  username: string;
  avatar: string; // url or emoji
  coins: number;
  spinsRemaining: number;
  lastSpinTime: string | null;
  lastDailyRewardTime: string | null;
  dailyRewardStreak: number;
  xp: number;
  level: number;
  soundEnabled: boolean;
  hapticEnabled: boolean;
  spinsCountSinceLastAd?: number;
  referralCode?: string;
  referredBy?: string | null;
  spinsCompleted?: number;
  claimedAchievements?: string[];
  lastShareTime?: string | null;
}

export type SectorType = 'coins' | 'extra_spin' | 'jackpot' | 'multiplier' | 'mystery';

export interface WheelSector {
  id: number;
  label: string;
  value: number;
  type: SectorType;
  color: string;
  textColor: string;
  weight: number; // probability weight
}

export interface LeaderboardEntry {
  rank: number;
  username: string;
  avatar: string;
  coins: number;
  isUser?: boolean;
  level: number;
}

export interface SpinHistoryEntry {
  id: string;
  timestamp: string;
  sectorLabel: string;
  value: number;
  type: SectorType;
  coinsGained: number;
}

export interface Transaction {
  id: string;
  type: 'spin' | 'daily_reward' | 'ad_bonus' | 'welcome' | 'xp_bonus';
  amount: number;
  timestamp: string;
  label: string;
}
