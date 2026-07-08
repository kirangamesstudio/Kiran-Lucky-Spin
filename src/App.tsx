import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Capacitor } from '@capacitor/core';
import { UserProfile, WheelSector, Transaction } from './types';
import Splash from './components/Splash';
import SpinWheel from './components/SpinWheel';
import DailyReward from './components/DailyReward';
import Leaderboard from './components/Leaderboard';
import Profile from './components/Profile';
import Settings from './components/Settings';
import AdsPlaceholder, { RewardedAdModal } from './components/AdsPlaceholder';
import { playClickSound, playCoinSound, playFanfareSound, triggerHapticFeedback } from './utils/audio';
import { AdMobManager } from './utils/admob';

// Firebase core + Auth + Db imports
import { auth, onAuthStateChanged, signInAnonymously, User, signOut, isFirebaseConfigured, isFirebaseAvailable } from './utils/firebase';
import { syncUserProfile, updateUserProfileInDb, submitTournamentScore } from './utils/firebaseDb';

// Import New Subsystems
import Auth from './components/Auth';
import Achievements from './components/Achievements';
import Tournaments from './components/Tournaments';
import Referrals from './components/Referrals';
import FirebaseSetupScreen from './components/FirebaseSetupScreen';

// Lucide icon imports
import {
  Disc,
  Gift,
  Trophy,
  User as UserIcon,
  Settings as SettingsIcon,
  Coins as CoinIcon,
  Flame,
  PlusCircle,
  HelpCircle,
  Sparkles,
  Award,
  Users,
  ShieldAlert,
  Database
} from 'lucide-react';

const LOCAL_STORAGE_PROFILE_KEY = 'kiran_lucky_spin_user_profile_v1';
const LOCAL_STORAGE_LEDGER_KEY = 'kiran_lucky_spin_user_ledger_v1';

const DEFAULT_PROFILE: UserProfile = {
  username: 'Lucky_Spinner_Guest',
  avatar: '👑',
  coins: 500, // starting coins
  spinsRemaining: 5, // starting spins
  lastSpinTime: null,
  lastDailyRewardTime: null,
  dailyRewardStreak: 0,
  xp: 0,
  level: 1,
  soundEnabled: true,
  hapticEnabled: true,
  spinsCountSinceLastAd: 0,
  referralCode: '',
  referredBy: null,
  spinsCompleted: 0,
  claimedAchievements: [],
  lastShareTime: null,
};

const DEFAULT_TRANSACTIONS: Transaction[] = [
  {
    id: 'welcome-tx',
    type: 'welcome',
    amount: 500,
    timestamp: new Date().toISOString(),
    label: 'Kiran Games Welcome Bonus',
  },
];

type TabType = 'wheel' | 'daily' | 'leaderboard' | 'tournaments' | 'achievements' | 'referrals' | 'profile' | 'settings';

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('wheel');
  const [profile, setProfile] = useState<UserProfile>(DEFAULT_PROFILE);
  const [transactions, setTransactions] = useState<Transaction[]>(DEFAULT_TRANSACTIONS);
  const [showAdModal, setShowAdModal] = useState(false);
  const [showBuySpinsModal, setShowBuySpinsModal] = useState(false);
  const [levelUpAlert, setLevelUpAlert] = useState<{ show: boolean; level: number }>({ show: false, level: 1 });

  // Multiplayer Online Auth States
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [rewardsSubTab, setRewardsSubTab] = useState<'achievements' | 'referrals'>('achievements');
  const [showFirebaseInfoModal, setShowFirebaseInfoModal] = useState(false);

  // Load from LocalStorage
  useEffect(() => {
    try {
      const savedProfile = localStorage.getItem(LOCAL_STORAGE_PROFILE_KEY);
      const savedLedger = localStorage.getItem(LOCAL_STORAGE_LEDGER_KEY);

      if (savedProfile) {
        setProfile(JSON.parse(savedProfile));
      }
      if (savedLedger) {
        setTransactions(JSON.parse(savedLedger));
      }
    } catch (e) {
      console.warn('LocalStorage load failed', e);
    }
  }, []);

  // Firebase auth status listener
  useEffect(() => {
    if (!isFirebaseAvailable) {
      setAuthLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        setAuthLoading(false);
        try {
          // Synchronize profile data with real Firestore db
          const syncedProfile = await syncUserProfile(user.uid, profile);
          setProfile(syncedProfile);
        } catch (e) {
          console.error('[App AuthSync] Profile fetch/sync failed:', e);
        }
      } else {
        // Automatically provision an anonymous Guest session to prevent any UX friction
        setCurrentUser(null);
        setAuthLoading(true);
        try {
          await signInAnonymously(auth);
        } catch (e) {
          console.error('[App AuthSync] Auto-provision guest failed (falling back to offline local mode):', e);
          setAuthLoading(false);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  // Initialize real AdMob for native mobile platforms
  useEffect(() => {
    AdMobManager.initialize(() => {
      handleAdCompleted('coins');
    }).then(() => {
      AdMobManager.showBanner();
    });

    return () => {
      AdMobManager.hideBanner();
    };
  }, []);

  // Helper to update and persist profile
  const updateProfileAndPersist = (updates: Partial<UserProfile> | ((prev: UserProfile) => Partial<UserProfile>)) => {
    setProfile((prev) => {
      const resolvedUpdates = typeof updates === 'function' ? updates(prev) : updates;
      const updated = { ...prev, ...resolvedUpdates };
      try {
        localStorage.setItem(LOCAL_STORAGE_PROFILE_KEY, JSON.stringify(updated));
        if (currentUser) {
          updateUserProfileInDb(currentUser.uid, resolvedUpdates);
        }
      } catch (e) {
        console.warn('LocalStorage save failed', e);
      }
      return updated;
    });
  };

  // Helper to log transaction and persist
  const addTransactionAndPersist = (tx: Omit<Transaction, 'id' | 'timestamp'>) => {
    const newTx: Transaction = {
      ...tx,
      id: `tx-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
    };
    setTransactions((prev) => {
      const updated = [newTx, ...prev].slice(0, 50); // limit to 50
      try {
        localStorage.setItem(LOCAL_STORAGE_LEDGER_KEY, JSON.stringify(updated));
      } catch (e) {
        console.warn('LocalStorage save failed', e);
      }
      return updated;
    });
  };

  // Reset Game progress
  const handleResetGameData = async () => {
    setProfile(DEFAULT_PROFILE);
    setTransactions(DEFAULT_TRANSACTIONS);
    setActiveTab('wheel');
    try {
      localStorage.setItem(LOCAL_STORAGE_PROFILE_KEY, JSON.stringify(DEFAULT_PROFILE));
      localStorage.setItem(LOCAL_STORAGE_LEDGER_KEY, JSON.stringify(DEFAULT_TRANSACTIONS));
      if (currentUser) {
        // Reset in DB
        await updateUserProfileInDb(currentUser.uid, DEFAULT_PROFILE);
      }
    } catch (e) {
      console.warn('LocalStorage/Firestore wipe failed', e);
    }
    playCoinSound(profile.soundEnabled);
  };

  // Claim achievement rewards and log transaction
  const handleClaimAchievement = (achievementId: string, rewardCoins: number, rewardSpins: number) => {
    const updatedCoins = profile.coins + rewardCoins;
    const updatedSpins = profile.spinsRemaining + rewardSpins;
    const updatedClaimed = [...(profile.claimedAchievements || []), achievementId];

    addTransactionAndPersist({
      type: 'xp_bonus',
      amount: rewardCoins,
      label: `Claimed Achievement: ${achievementId.split('_').map(w => w.toUpperCase()).join(' ')}`,
    });

    updateProfileAndPersist({
      coins: updatedCoins,
      spinsRemaining: updatedSpins,
      claimedAchievements: updatedClaimed,
    });

    // Also award some XP for claiming an achievement
    gainXp(50, {
      ...profile,
      coins: updatedCoins,
      spinsRemaining: updatedSpins,
      claimedAchievements: updatedClaimed,
    });

    playCoinSound(profile.soundEnabled);
  };

  // Handle XP accumulation and Level Up triggers
  const gainXp = (amount: number, currentProfile: UserProfile) => {
    const totalXp = currentProfile.xp + amount;
    const nextLevelXp = currentProfile.level * 100;

    if (totalXp >= nextLevelXp) {
      // LEVEL UP!
      const nextLevel = currentProfile.level + 1;
      const leftoverXp = totalXp - nextLevelXp;

      // level reward: +100 virtual coins, +3 free spins
      const rewardCoins = 100;
      const rewardSpins = 3;

      setLevelUpAlert({ show: true, level: nextLevel });
      playFanfareSound(currentProfile.soundEnabled);
      triggerHapticFeedback(currentProfile.hapticEnabled);

      addTransactionAndPersist({
        type: 'xp_bonus',
        amount: rewardCoins,
        label: `Level ${nextLevel} Milestone Reward!`,
      });

      updateProfileAndPersist({
        xp: leftoverXp,
        level: nextLevel,
        coins: currentProfile.coins + rewardCoins,
        spinsRemaining: currentProfile.spinsRemaining + rewardSpins,
      });
    } else {
      updateProfileAndPersist({ xp: totalXp });
    }
  };

  // Wheel Spin Completed handler
  const handleSpinComplete = (sector: WheelSector) => {
    // 1. Consume spin and record timestamp
    const updatedSpins = Math.max(0, profile.spinsRemaining - 1);
    let newCoins = profile.coins;
    let earnedSpins = 0;
    let xpAwarded = 25; // 25 XP per spin baseline

    // 2. Evaluate sector reward type
    if (sector.type === 'coins' || sector.type === 'jackpot' || sector.type === 'mystery') {
      newCoins += sector.value;
      addTransactionAndPersist({
        type: 'spin',
        amount: sector.value,
        label: `Spin Reward: ${sector.label}`,
      });
    } else if (sector.type === 'extra_spin') {
      earnedSpins += sector.value;
      addTransactionAndPersist({
        type: 'spin',
        amount: 0,
        label: `Spin Reward: Free +${sector.value} Spin`,
      });
    } else if (sector.type === 'multiplier') {
      xpAwarded += 50; // extra XP multiplier
      addTransactionAndPersist({
        type: 'spin',
        amount: 0,
        label: `Spin Reward: ${sector.label} Boost`,
      });
    }

    // 3. Update overall user details
    const nextAdCount = (profile.spinsCountSinceLastAd || 0) + 1;
    const spinsDone = (profile.spinsCompleted || 0) + 1;
    const intermediateProfile = {
      ...profile,
      coins: newCoins,
      spinsRemaining: updatedSpins + earnedSpins,
      lastSpinTime: new Date().toISOString(),
      spinsCountSinceLastAd: nextAdCount,
      spinsCompleted: spinsDone,
    };

    updateProfileAndPersist({
      coins: newCoins,
      spinsRemaining: updatedSpins + earnedSpins,
      lastSpinTime: new Date().toISOString(),
      spinsCountSinceLastAd: nextAdCount,
      spinsCompleted: spinsDone,
    });

    // Award XP
    gainXp(xpAwarded, intermediateProfile);

    // Increment Online Daily Tournament score in Firestore
    if (currentUser) {
      submitTournamentScore(currentUser.uid, profile.username, profile.avatar, 1);
    }
  };

  // Handle Close Result Modal to trigger Ad after every 5 spins
  const handleCloseResultModal = () => {
    const currentSpinsCount = profile.spinsCountSinceLastAd || 0;
    if (currentSpinsCount >= 5) {
      updateProfileAndPersist({
        spinsCountSinceLastAd: 0,
      });

      if (Capacitor.isNativePlatform()) {
        AdMobManager.showRewarded(
          () => {
            handleAdCompleted('coins');
          },
          () => {
            console.log('[AdMob Native] Rewarded ad failed or skipped.');
          }
        );
      } else {
        setShowAdModal(true);
      }
    }
  };

  // Daily Check-In claimed handler
  const handleClaimDailyReward = (coinsWon: number, spinsWon: number, nextStreak: number) => {
    const updatedCoins = profile.coins + coinsWon;
    const updatedSpins = profile.spinsRemaining + spinsWon;

    const intermediateProfile = {
      ...profile,
      coins: updatedCoins,
      spinsRemaining: updatedSpins,
      lastDailyRewardTime: new Date().toISOString(),
      dailyRewardStreak: nextStreak,
    };

    addTransactionAndPersist({
      type: 'daily_reward',
      amount: coinsWon,
      label: `Day ${nextStreak} Daily Check-In Reward`,
    });

    updateProfileAndPersist({
      coins: updatedCoins,
      spinsRemaining: updatedSpins,
      lastDailyRewardTime: new Date().toISOString(),
      dailyRewardStreak: nextStreak,
    });

    gainXp(75, intermediateProfile); // 75 XP for check-in
  };

  // Rewarded Ad completion handler (simulated payout)
  const handleAdCompleted = (rewardType: 'coins' | 'spins') => {
    let coinsGained = 0;
    let spinsGained = 0;
    let description = '';

    if (rewardType === 'coins') {
      coinsGained = 100;
      description = 'AdMob Rewarded: 100 coins';
    } else {
      spinsGained = 3;
      description = 'AdMob Rewarded: 3 free spins';
    }

    addTransactionAndPersist({
      type: 'ad_bonus',
      amount: coinsGained,
      label: description,
    });

    updateProfileAndPersist((prev) => {
      const nextCoins = prev.coins + coinsGained;
      const nextSpins = prev.spinsRemaining + spinsGained;
      
      const totalXp = prev.xp + 40; // 40 XP for watching ad
      const nextLevelXp = prev.level * 100;
      let nextLevel = prev.level;
      let finalXp = totalXp;
      let finalCoins = nextCoins;
      let finalSpinsRemaining = nextSpins;

      if (totalXp >= nextLevelXp) {
        nextLevel = prev.level + 1;
        finalXp = totalXp - nextLevelXp;
        // Level up bonus reward: +100 coins, +3 spins
        finalCoins += 100;
        finalSpinsRemaining += 3;
        setTimeout(() => {
          setLevelUpAlert({ show: true, level: nextLevel });
          playFanfareSound(prev.soundEnabled);
          triggerHapticFeedback(prev.hapticEnabled);
        }, 100);
      }

      return {
        coins: finalCoins,
        spinsRemaining: finalSpinsRemaining,
        xp: finalXp,
        level: nextLevel,
      };
    });
  };

  // Virtual Spin Purchase (mock transaction using free virtual coins!)
  // Lets them exchange 200 coins for +2 spins, keeping the entire economy serverless and offline.
  const handleExchangeCoinsForSpins = () => {
    if (profile.coins < 200) return;
    
    addTransactionAndPersist({
      type: 'spin',
      amount: -200,
      label: 'Exchanged 200 Coins for +2 Spins',
    });

    updateProfileAndPersist({
      coins: profile.coins - 200,
      spinsRemaining: profile.spinsRemaining + 2,
    });

    playClickSound(profile.soundEnabled);
    setShowBuySpinsModal(false);
  };

  // Sound togglers
  const handleUpdateSound = (enabled: boolean) => updateProfileAndPersist({ soundEnabled: enabled });
  const handleUpdateHaptic = (enabled: boolean) => updateProfileAndPersist({ hapticEnabled: enabled });
  const handleUpdateProfile = (newProfile: Partial<UserProfile>) => updateProfileAndPersist(newProfile);

  if (showSplash) {
    return <Splash onComplete={() => setShowSplash(false)} />;
  }

  return (
    <div className="min-h-screen bg-[#030612] flex items-center justify-center py-0 sm:py-8 px-0 sm:px-4 text-white">
      {/* 
        AESTHETIC DEVICE WRAPPER FRAME FOR DESKTOP SIZES
        This surrounds the app with a sleek bezel, gold accent linings, and simulated front hardware
        when rendered on large computer screens, while melting perfectly into full mobile viewport on phones!
      */}
      <div className="w-full max-w-[430px] h-screen sm:h-[880px] sm:max-h-[92%] sm:rounded-[48px] sm:border-[8px] sm:border-[#1E293B] bg-[#070e27] shadow-[0_25px_60px_rgba(0,0,0,0.85)] relative flex flex-col justify-between overflow-hidden sm:outline sm:outline-[3px] sm:outline-[#D4AF37]/45">

        {/* 2. Premium Game Navigation Header */}
        <header className="w-full bg-gradient-to-b from-[#030712] to-[#070e27] px-4 py-2 border-b border-amber-500/15 flex items-center justify-between z-10 select-none shrink-0">
          <div className="flex items-center gap-1.5">
            <span className="text-xl">{profile.avatar}</span>
            <div className="flex flex-col">
              <span className="text-xs font-black tracking-wide text-white truncate max-w-[100px]">{profile.username}</span>
              <span className="text-[8px] text-amber-500 font-bold uppercase tracking-wider">Level {profile.level}</span>
            </div>
          </div>

          {/* Wallet and Ad Trigger Box */}
          <div className="flex items-center gap-2">
            
            {/* Coins indicator badge */}
            <div className="flex items-center gap-1 px-2.5 py-1.5 bg-[#030712]/90 border border-amber-500/20 rounded-full">
              <CoinIcon className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              <span className="text-xs font-black text-amber-400 font-mono">{profile.coins.toLocaleString()}</span>
            </div>

            {/* Simulated Free Coins ad launcher pill */}
            <button
              id="header-free-spins-btn"
              onClick={() => {
                setShowAdModal(true);
                playClickSound(profile.soundEnabled);
              }}
              className="flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-full text-[10px] font-extrabold uppercase tracking-widest hover:brightness-110 active:scale-95 transition-all"
            >
              <Flame className="w-3 h-3 text-white fill-white" />
              <span>FREE</span>
            </button>
          </div>
        </header>

        {/* 3. Main Router Content Container */}
        <main className="flex-1 overflow-y-auto px-4 py-4 flex flex-col items-center justify-start bg-radial from-[#070e27] to-[#020510] relative">
          
          {/* Offline/Local fallback notice banner */}
          {!isFirebaseAvailable && (
            <div className="w-full mb-4 px-3 py-2 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center justify-between gap-3 select-none shrink-0 shadow-[0_2px_8px_rgba(245,158,11,0.05)]">
              <div className="flex items-center gap-2">
                <Database className="w-3.5 h-3.5 text-amber-500 shrink-0 animate-pulse" />
                <span className="text-[10px] font-semibold text-amber-200/90 leading-tight">
                  Offline Mode: Local Storage active. Set up Firebase to enable online features.
                </span>
              </div>
              <button
                onClick={() => {
                  playClickSound(profile.soundEnabled);
                  setShowFirebaseInfoModal(true);
                }}
                className="text-[8px] bg-amber-500 hover:brightness-110 text-slate-950 px-2 py-0.5 rounded font-black uppercase tracking-wider shrink-0 transition-all active:scale-95"
              >
                SETUP
              </button>
            </div>
          )}

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.15 }}
              className="w-full flex flex-col items-center justify-start"
            >
              {activeTab === 'wheel' && (
                <div className="flex flex-col items-center w-full gap-5">
                  
                  {/* Premium Hero Title Accent */}
                  <div className="text-center">
                    <p className="text-[10px] text-amber-400 tracking-[0.25em] uppercase font-bold mb-0.5">Premium Lucky Wheel</p>
                    <h2 className="text-xl font-extrabold bg-gradient-to-b from-white to-slate-300 bg-clip-text text-transparent">Kiran Lucky Spin</h2>
                  </div>

                  {/* Wheel Component */}
                  <SpinWheel
                    coins={profile.coins}
                    spinsRemaining={profile.spinsRemaining}
                    soundEnabled={profile.soundEnabled}
                    hapticEnabled={profile.hapticEnabled}
                    onSpinComplete={handleSpinComplete}
                    onAdRequest={() => setShowAdModal(true)}
                    onBuySpins={() => setShowBuySpinsModal(true)}
                    onCloseResultModal={handleCloseResultModal}
                  />
                </div>
              )}

              {activeTab === 'wheel' && (
                <div className="flex flex-col items-center w-full gap-5">
                  
                  {/* Premium Hero Title Accent */}
                  <div className="text-center">
                    <p className="text-[10px] text-amber-400 tracking-[0.25em] uppercase font-bold mb-0.5">Premium Lucky Wheel</p>
                    <h2 className="text-xl font-extrabold bg-gradient-to-b from-white to-slate-300 bg-clip-text text-transparent">Kiran Lucky Spin</h2>
                  </div>

                  {/* Daily Reward Promo Bar */}
                  {(() => {
                    const lastClaim = profile.lastDailyRewardTime ? new Date(profile.lastDailyRewardTime).getTime() : 0;
                    const oneDayMs = 24 * 60 * 60 * 1000;
                    const isAvailable = Date.now() - lastClaim >= oneDayMs;
                    if (isAvailable) {
                      return (
                        <button
                          onClick={() => {
                            setActiveTab('daily');
                            playClickSound(profile.soundEnabled);
                          }}
                          className="w-full max-w-[340px] px-4 py-2.5 bg-gradient-to-r from-amber-500/20 via-yellow-500/10 to-amber-500/20 border border-amber-500/30 rounded-2xl flex items-center justify-between text-left hover:brightness-110 transition-all animate-pulse"
                        >
                          <div className="flex items-center gap-2.5">
                            <Gift className="w-5 h-5 text-amber-400 shrink-0" />
                            <div>
                              <p className="text-[10px] font-mono text-amber-400 uppercase tracking-wider font-extrabold">DAILY BONUS IS READY</p>
                              <p className="text-xs font-bold text-white">Claim free virtual coins & spins!</p>
                            </div>
                          </div>
                          <span className="text-[9px] bg-amber-500 text-slate-950 font-black px-2.5 py-1 rounded-lg">CLAIM</span>
                        </button>
                      );
                    }
                    return null;
                  })()}

                  {/* Wheel Component */}
                  <SpinWheel
                    coins={profile.coins}
                    spinsRemaining={profile.spinsRemaining}
                    soundEnabled={profile.soundEnabled}
                    hapticEnabled={profile.hapticEnabled}
                    onSpinComplete={handleSpinComplete}
                    onAdRequest={() => setShowAdModal(true)}
                    onBuySpins={() => setShowBuySpinsModal(true)}
                    onCloseResultModal={handleCloseResultModal}
                  />
                </div>
              )}

              {activeTab === 'daily' && (
                <DailyReward
                  lastDailyRewardTime={profile.lastDailyRewardTime}
                  dailyRewardStreak={profile.dailyRewardStreak}
                  soundEnabled={profile.soundEnabled}
                  onClaim={handleClaimDailyReward}
                />
              )}

              {activeTab === 'tournaments' && (
                <Tournaments
                  userId={currentUser ? currentUser.uid : null}
                  username={profile.username}
                  avatar={profile.avatar}
                  soundEnabled={profile.soundEnabled}
                />
              )}

              {activeTab === 'leaderboard' && (
                <Leaderboard
                  userCoins={profile.coins}
                  username={profile.username}
                  avatar={profile.avatar}
                  level={profile.level}
                />
              )}

              {activeTab === 'referrals' && (
                <div className="w-full flex flex-col items-center gap-4">
                  {/* Rewards Hub Secondary Tab Selector */}
                  <div className="w-full max-w-[340px] bg-slate-950/85 p-1 rounded-xl border border-slate-800/80 flex justify-between">
                    <button
                      onClick={() => {
                        setRewardsSubTab('achievements');
                        playClickSound(profile.soundEnabled);
                      }}
                      className={`flex-1 py-1.5 text-xs font-extrabold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                        rewardsSubTab === 'achievements'
                          ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <Award className="w-3.5 h-3.5" />
                      ACHIEVEMENTS
                    </button>
                    <button
                      onClick={() => {
                        setRewardsSubTab('referrals');
                        playClickSound(profile.soundEnabled);
                      }}
                      className={`flex-1 py-1.5 text-xs font-extrabold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                        rewardsSubTab === 'referrals'
                          ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <Users className="w-3.5 h-3.5" />
                      REFER & SHARE
                    </button>
                  </div>

                  {rewardsSubTab === 'achievements' ? (
                    <Achievements
                      profile={profile}
                      onClaimAchievement={handleClaimAchievement}
                    />
                  ) : (
                    <Referrals
                      userId={currentUser ? currentUser.uid : null}
                      profile={profile}
                      soundEnabled={profile.soundEnabled}
                      onUpdateProfile={handleUpdateProfile}
                      onAddTransaction={addTransactionAndPersist}
                    />
                  )}
                </div>
              )}

              {activeTab === 'profile' && (
                <Profile
                  profile={profile}
                  transactions={transactions}
                  onUpdateProfile={handleUpdateProfile}
                  onReset={handleResetGameData}
                  isAnonymous={currentUser ? currentUser.isAnonymous : true}
                  onSignOut={async () => {
                    await signOut(auth);
                  }}
                  onShowAuth={() => setShowAuthModal(true)}
                />
              )}

              {activeTab === 'settings' && (
                <Settings
                  soundEnabled={profile.soundEnabled}
                  hapticEnabled={profile.hapticEnabled}
                  onUpdateSound={handleUpdateSound}
                  onUpdateHaptic={handleUpdateHaptic}
                  onClose={() => setActiveTab('profile')}
                />
              )}
            </motion.div>
          </AnimatePresence>

          {/* AdMob Banner Mock Bottom Anchor (Web preview only) */}
          {!Capacitor.isNativePlatform() && (
            <div className="mt-auto pt-6 w-full shrink-0">
              <AdsPlaceholder
                soundEnabled={profile.soundEnabled}
                onAdCompleted={handleAdCompleted}
              />
            </div>
          )}
        </main>

        {/* 4. Bottom Simulated Mobile Navigation Bar */}
        <footer className="w-full bg-[#030712] border-t border-amber-500/15 py-1.5 flex justify-around items-center select-none z-10 shrink-0">
          
          {/* Wheel Tab Button */}
          <button
            id="tab-wheel"
            onClick={() => {
              setActiveTab('wheel');
              playClickSound(profile.soundEnabled);
            }}
            className={`flex flex-col items-center p-1.5 transition-all ${
              activeTab === 'wheel' ? 'text-amber-400 scale-105 font-bold' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <Disc className={`w-5 h-5 ${activeTab === 'wheel' ? 'animate-spin' : ''}`} style={{ animationDuration: '6s' }} />
            <span className="text-[9px] mt-1 font-medium tracking-wide">Spin Wheel</span>
          </button>

          {/* Online Tournament Tab Button */}
          <button
            id="tab-tournaments"
            onClick={() => {
              setActiveTab('tournaments');
              playClickSound(profile.soundEnabled);
            }}
            className={`flex flex-col items-center p-1.5 transition-all ${
              activeTab === 'tournaments' ? 'text-amber-400 scale-105 font-bold' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <Trophy className="w-5 h-5" />
            <span className="text-[9px] mt-1 font-medium tracking-wide">Tournament</span>
          </button>

          {/* Leaderboard Tab Button */}
          <button
            id="tab-leaderboard"
            onClick={() => {
              setActiveTab('leaderboard');
              playClickSound(profile.soundEnabled);
            }}
            className={`flex flex-col items-center p-1.5 transition-all ${
              activeTab === 'leaderboard' ? 'text-amber-400 scale-105 font-bold' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <Sparkles className="w-5 h-5" />
            <span className="text-[9px] mt-1 font-medium tracking-wide">Leaders</span>
          </button>

          {/* Achievements / Referrals Rewards Hub Tab Button */}
          <button
            id="tab-rewards"
            onClick={() => {
              setActiveTab('referrals');
              playClickSound(profile.soundEnabled);
            }}
            className={`flex flex-col items-center p-1.5 transition-all ${
              activeTab === 'referrals' ? 'text-amber-400 scale-105 font-bold' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <Award className="w-5 h-5" />
            <span className="text-[9px] mt-1 font-medium tracking-wide">Rewards</span>
          </button>

          {/* Profile Tab Button */}
          <button
            id="tab-profile"
            onClick={() => {
              setActiveTab('profile');
              playClickSound(profile.soundEnabled);
            }}
            className={`flex flex-col items-center p-1.5 transition-all ${
              activeTab === 'profile' ? 'text-amber-400 scale-105 font-bold' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <UserIcon className="w-5 h-5" />
            <span className="text-[9px] mt-1 font-medium tracking-wide">Profile</span>
          </button>
        </footer>
      </div>

      {/* 5. Simulated Rewarded Ads Station Modal */}
      <AnimatePresence>
        {showAdModal && (
          <RewardedAdModal
            isOpen={showAdModal}
            soundEnabled={profile.soundEnabled}
            onClose={() => setShowAdModal(false)}
            onComplete={handleAdCompleted}
          />
        )}
      </AnimatePresence>

      {/* 6. Buy Spins Modal (Convert coins to spins simulation) */}
      <AnimatePresence>
        {showBuySpinsModal && (
          <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-6 select-none">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-sm bg-gradient-to-b from-[#001c55] to-[#040814] border border-amber-500/35 rounded-3xl p-6 text-center shadow-2xl relative"
            >
              <button
                onClick={() => setShowBuySpinsModal(false)}
                className="absolute top-4 right-4 p-1.5 bg-slate-950 text-slate-400 hover:text-white rounded-full transition-all"
              >
                <PlusCircle className="w-4.5 h-4.5 rotate-45" />
              </button>

              <div className="w-14 h-14 bg-amber-500/10 border border-amber-500/25 rounded-full flex items-center justify-center mx-auto mb-3">
                <Disc className="w-7 h-7 text-amber-400 animate-spin" style={{ animationDuration: '8s' }} />
              </div>

              <h3 className="text-lg font-extrabold text-white">Refill Virtual Spins</h3>
              <p className="text-xs text-slate-400 mb-5 leading-relaxed">
                Exchange your virtual gold balance for free lucky spins instantly! Keep spinning to level up!
              </p>

              {/* Transaction block */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-left mb-6 flex flex-col gap-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-medium">Your Coins:</span>
                  <span className="text-white font-bold font-mono">{profile.coins.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between text-xs border-t border-slate-900 pt-2">
                  <span className="text-slate-400 font-medium">Exchange Price:</span>
                  <span className="text-amber-400 font-extrabold font-mono">200 Coins</span>
                </div>
                <div className="flex items-center justify-between text-xs border-t border-slate-900 pt-2">
                  <span className="text-slate-400 font-medium">Yield:</span>
                  <span className="text-emerald-400 font-extrabold font-mono">+2 Lucky Spins</span>
                </div>
              </div>

              {profile.coins >= 200 ? (
                <button
                  id="exchange-coins-confirm-btn"
                  onClick={handleExchangeCoinsForSpins}
                  className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-bold rounded-xl hover:brightness-110 active:scale-95 transition-all shadow-[0_4px_12px_rgba(245,158,11,0.3)]"
                >
                  EXCHANGE COINS!
                </button>
              ) : (
                <div className="flex flex-col gap-2.5">
                  <p className="text-[10px] text-red-400 font-bold">Insufficient virtual coins! Watch simulated ads to earn coins free.</p>
                  <button
                    onClick={() => {
                      setShowBuySpinsModal(false);
                      setShowAdModal(true);
                      playClickSound(profile.soundEnabled);
                    }}
                    className="w-full py-3 bg-blue-600 text-white font-extrabold text-xs rounded-xl"
                  >
                    WATCH AD FOR FREE REWARDS!
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 7. Level-Up Milestone Overlay */}
      <AnimatePresence>
        {levelUpAlert.show && (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[60] flex items-center justify-center p-6 select-none">
            <motion.div
              initial={{ scale: 0.6, rotate: -5, opacity: 0 }}
              animate={{ scale: [0.6, 1.1, 1], rotate: 0, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="w-full max-w-sm bg-gradient-to-b from-[#001c55] to-[#040814] border-2 border-amber-400 rounded-3xl p-6 text-center shadow-[0_0_50px_rgba(245,158,11,0.5)] relative overflow-hidden"
            >
              <div className="absolute top-0 inset-x-0 h-40 bg-radial from-amber-400/25 to-transparent pointer-events-none" />

              <div className="relative z-10 flex flex-col items-center">
                <motion.div
                  animate={{ y: [-10, 10, -10] }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                  className="w-20 h-20 bg-gradient-to-b from-yellow-300 to-amber-600 rounded-full flex items-center justify-center mb-4 shadow-lg p-[2px]"
                >
                  <div className="w-full h-full rounded-full bg-slate-950 flex items-center justify-center">
                    <Award className="w-11 h-11 text-amber-400" />
                  </div>
                </motion.div>

                <p className="text-amber-400 font-extrabold uppercase tracking-[0.2em] text-xs font-mono">
                  LEVEL COMPLETED!
                </p>
                <h3 className="text-3xl font-black text-white mb-2">
                  LEVEL UP!
                </h3>

                <div className="text-5xl font-black text-amber-400 my-4 tracking-wider animate-pulse">
                  {levelUpAlert.level}
                </div>

                <div className="w-full px-4 py-3 bg-[#030712] border border-amber-500/20 rounded-2xl flex flex-col gap-1.5 mb-6">
                  <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Milestone Rewards:</span>
                  <div className="flex justify-around items-center">
                    <span className="text-xs font-bold text-white flex items-center gap-1">
                      <CoinIcon className="w-3.5 h-3.5 text-amber-400" /> +100 Coins
                    </span>
                    <span className="text-xs font-bold text-white flex items-center gap-1">
                      <Disc className="w-3.5 h-3.5 text-blue-400" /> +3 Free Spins
                    </span>
                  </div>
                </div>

                <button
                  id="level-up-confirm-btn"
                  onClick={() => setLevelUpAlert({ show: false, level: 1 })}
                  className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-bold rounded-xl hover:brightness-110 active:scale-95 transition-all shadow-[0_4px_12px_rgba(245,158,11,0.3)]"
                >
                  FANTASTIC, CLAIM!
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 8. Online Account Auth Portal Modal */}
      <AnimatePresence>
        {showAuthModal && (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[70] flex items-center justify-center p-6 select-none animate-fade-in">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-sm relative"
            >
              <Auth
                soundEnabled={profile.soundEnabled}
                onAuthSuccess={() => {
                  setShowAuthModal(false);
                }}
                onClose={() => {
                  setShowAuthModal(false);
                }}
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 9. Firebase Setup Overlay Modal */}
      <AnimatePresence>
        {showFirebaseInfoModal && (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[80] flex items-center justify-center p-6 select-none">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-md relative"
            >
              <FirebaseSetupScreen
                soundEnabled={profile.soundEnabled}
                onClose={() => setShowFirebaseInfoModal(false)}
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
