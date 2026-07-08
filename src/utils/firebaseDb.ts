import { 
  db, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  collection, 
  getDocs, 
  query, 
  orderBy, 
  limit, 
  increment, 
  arrayUnion,
  runTransaction,
  writeBatch,
  isFirebaseAvailable
} from './firebase';
import { UserProfile, LeaderboardEntry } from '../types';

// Generate a random referral code
export function generateReferralCode(username: string, uid: string): string {
  const cleanName = username.replace(/[^a-zA-Z0-9]/g, '').slice(0, 4).toUpperCase();
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `${cleanName}-${randomSuffix}`;
}

// Get the YYYY-MM-DD date string for tournament identifiers
export function getDailyTournamentDateKey(): string {
  const date = new Date();
  return `${date.getUTCFullYear()}-${(date.getUTCMonth() + 1).toString().padStart(2, '0')}-${date.getUTCDate().toString().padStart(2, '0')}`;
}

/**
 * Synchs user profile in Firestore.
 * If user profile exists, returns it (merging in any missing defaults).
 * If user profile does not exist, creates it using the local profile.
 */
export async function syncUserProfile(uid: string, localProfile: UserProfile): Promise<UserProfile> {
  if (!isFirebaseAvailable) {
    console.log('[Firebase Db] Offline Mode: Bypassing user sync.');
    return localProfile;
  }
  try {
    const userRef = doc(db, 'users', uid);
    const docSnap = await getDoc(userRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      // Ensure standard defaults exist
      const dbProfile: UserProfile = {
        username: data.username || localProfile.username,
        avatar: data.avatar || localProfile.avatar,
        coins: typeof data.coins === 'number' ? data.coins : localProfile.coins,
        spinsRemaining: typeof data.spinsRemaining === 'number' ? data.spinsRemaining : localProfile.spinsRemaining,
        lastSpinTime: data.lastSpinTime || null,
        lastDailyRewardTime: data.lastDailyRewardTime || null,
        dailyRewardStreak: typeof data.dailyRewardStreak === 'number' ? data.dailyRewardStreak : localProfile.dailyRewardStreak,
        xp: typeof data.xp === 'number' ? data.xp : localProfile.xp,
        level: typeof data.level === 'number' ? data.level : localProfile.level,
        soundEnabled: typeof data.soundEnabled === 'boolean' ? data.soundEnabled : localProfile.soundEnabled,
        hapticEnabled: typeof data.hapticEnabled === 'boolean' ? data.hapticEnabled : localProfile.hapticEnabled,
        spinsCountSinceLastAd: typeof data.spinsCountSinceLastAd === 'number' ? data.spinsCountSinceLastAd : 0,
        referralCode: data.referralCode || generateReferralCode(data.username || localProfile.username, uid),
        referredBy: data.referredBy || null,
        spinsCompleted: typeof data.spinsCompleted === 'number' ? data.spinsCompleted : 0,
        claimedAchievements: Array.isArray(data.claimedAchievements) ? data.claimedAchievements : [],
        lastShareTime: data.lastShareTime || null,
      };
      return dbProfile;
    } else {
      // Generate code
      const referralCode = generateReferralCode(localProfile.username, uid);
      const newProfile: any = {
        ...localProfile,
        referralCode,
        referredBy: null,
        spinsCompleted: 0,
        claimedAchievements: [],
        lastShareTime: null,
        createdAt: new Date().toISOString(),
      };
      await setDoc(userRef, newProfile);
      return newProfile as UserProfile;
    }
  } catch (error) {
    console.error('[Firebase Db] Failed to sync user profile:', error);
    return localProfile;
  }
}

/**
 * Update user profile details directly in Firestore.
 */
export async function updateUserProfileInDb(uid: string, updates: Partial<UserProfile>) {
  if (!isFirebaseAvailable) return;
  try {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, updates as any);
  } catch (error) {
    console.error('[Firebase Db] Failed to update user profile:', error);
  }
}

/**
 * Fetch top 20 players by coins to construct real global standings.
 */
export async function fetchGlobalLeaderboard(): Promise<LeaderboardEntry[]> {
  if (!isFirebaseAvailable) {
    console.log('[Firebase Db] Offline Mode: Bypassing global leaderboard fetch.');
    return [];
  }
  try {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, orderBy('coins', 'desc'), limit(20));
    const querySnapshot = await getDocs(q);
    
    const entries: LeaderboardEntry[] = [];
    let rank = 1;
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      entries.push({
        rank,
        username: data.username || 'Lucky Spinner',
        avatar: data.avatar || '👤',
        coins: typeof data.coins === 'number' ? data.coins : 0,
        level: typeof data.level === 'number' ? data.level : 1,
      });
      rank++;
    });
    return entries;
  } catch (error) {
    console.error('[Firebase Db] Failed to fetch leaderboard:', error);
    return [];
  }
}

/**
 * Submits score to the Daily Tournament collection.
 * Increments the user's tournament score on each successful spin.
 */
export async function submitTournamentScore(
  uid: string,
  username: string,
  avatar: string,
  scoreDelta: number
) {
  if (!isFirebaseAvailable) return;
  try {
    const dateKey = getDailyTournamentDateKey();
    const tournamentRef = doc(db, 'tournaments', dateKey);
    const participantRef = doc(db, 'tournaments', dateKey, 'participants', uid);

    // Initialize/Ensure tournament document exists
    await setDoc(tournamentRef, { date: dateKey }, { merge: true });

    // Try to get existing score
    const pSnap = await getDoc(participantRef);
    if (pSnap.exists()) {
      await updateDoc(participantRef, {
        score: increment(scoreDelta),
        lastSpinAt: new Date().toISOString(),
      });
    } else {
      await setDoc(participantRef, {
        username,
        avatar,
        score: scoreDelta,
        lastSpinAt: new Date().toISOString(),
      });
    }
  } catch (error) {
    console.error('[Firebase Db] Failed to submit tournament score:', error);
  }
}

/**
 * Fetch daily tournament standings.
 */
export interface TournamentStanding {
  userId: string;
  username: string;
  avatar: string;
  score: number;
}

export async function fetchDailyTournamentStandings(dateKey: string): Promise<TournamentStanding[]> {
  if (!isFirebaseAvailable) {
    console.log('[Firebase Db] Offline Mode: Bypassing tournament standings fetch.');
    return [];
  }
  try {
    const participantsRef = collection(db, 'tournaments', dateKey, 'participants');
    const q = query(participantsRef, orderBy('score', 'desc'), limit(50));
    const querySnapshot = await getDocs(q);

    const standings: TournamentStanding[] = [];
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      standings.push({
        userId: docSnap.id,
        username: data.username || 'Spinner',
        avatar: data.avatar || '🎰',
        score: typeof data.score === 'number' ? data.score : 0,
      });
    });
    return standings;
  } catch (error) {
    console.error('[Firebase Db] Failed to fetch daily tournament standings:', error);
    return [];
  }
}

/**
 * Redeem referral code. Transactionally checks if code exists,
 * gives reward to both the referrer and the referred user.
 */
export async function redeemReferralCode(
  myUid: string,
  enteredCode: string
): Promise<{ success: boolean; message: string; rewardSpins?: number; rewardCoins?: number }> {
  const code = enteredCode.trim().toUpperCase();
  if (!code) {
    return { success: false, message: 'Please enter a valid code.' };
  }

  if (!isFirebaseAvailable) {
    return { success: false, message: 'Online features are currently unavailable (Offline Mode).' };
  }

  try {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, orderBy('referralCode'), limit(100)); // basic query to find the referrer
    const querySnapshot = await getDocs(q);

    let referrerUid: string | null = null;
    let referrerName = '';

    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      if (data.referralCode && data.referralCode.toUpperCase() === code) {
        referrerUid = docSnap.id;
        referrerName = data.username || 'Your friend';
      }
    });

    if (!referrerUid) {
      return { success: false, message: 'Referral code not found.' };
    }

    if (referrerUid === myUid) {
      return { success: false, message: 'You cannot use your own referral code!' };
    }

    const myUserRef = doc(db, 'users', myUid);
    const referrerUserRef = doc(db, 'users', referrerUid);

    const mySnap = await getDoc(myUserRef);
    if (!mySnap.exists()) {
      return { success: false, message: 'My profile not found.' };
    }

    const myData = mySnap.data();
    if (myData.referredBy) {
      return { success: false, message: 'You have already redeemed a referral code.' };
    }

    const REWARD_COINS = 500;
    const REWARD_SPINS = 5;

    // Execute atomic batch to update both players securely
    const batch = writeBatch(db);
    
    // Update me (give reward, set referredBy)
    batch.update(myUserRef, {
      coins: increment(REWARD_COINS),
      spinsRemaining: increment(REWARD_SPINS),
      referredBy: referrerUid,
    });

    // Update referrer (give reward)
    batch.update(referrerUserRef, {
      coins: increment(REWARD_COINS),
      spinsRemaining: increment(REWARD_SPINS),
    });

    await batch.commit();

    return { 
      success: true, 
      message: `Success! Code redeemed. You and ${referrerName} both received +500 Coins & +5 Spins!`,
      rewardCoins: REWARD_COINS,
      rewardSpins: REWARD_SPINS
    };

  } catch (error) {
    console.error('[Firebase Db] Error redeeming referral code:', error);
    return { success: false, message: 'An error occurred while redeeming. Please try again.' };
  }
}
