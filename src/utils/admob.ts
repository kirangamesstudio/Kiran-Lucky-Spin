import { Capacitor } from '@capacitor/core';
import { 
  AdMob, 
  BannerAdPosition, 
  BannerAdSize, 
  RewardAdPluginEvents,
  BannerAdOptions,
  RewardAdOptions
} from '@capacitor-community/admob';

// Test Ad Unit IDs for Android
const ANDROID_TEST_BANNER_ID = 'ca-app-pub-3940256099942544/6300978111';
const ANDROID_TEST_REWARDED_ID = 'ca-app-pub-3940256099942544/5224354917';

export class AdMobManager {
  private static isInitialized = false;
  private static isBannerShowing = false;
  private static isAdMobAvailable = Capacitor.isNativePlatform();

  static async initialize(onRewarded?: (rewardAmount: number) => void) {
    if (!this.isAdMobAvailable) {
      console.log('[AdMob Web Simulation] AdMob is simulated on web.');
      return;
    }

    try {
      await AdMob.initialize({
        initializeForTesting: true,
      });
      this.isInitialized = true;
      console.log('[AdMob Native] AdMob initialized successfully.');

      // Setup global listener for rewarded actions
      AdMob.addListener(RewardAdPluginEvents.Rewarded, (reward) => {
        console.log('[AdMob Native] User earned reward:', reward);
        if (onRewarded) {
          onRewarded(reward.amount || 100);
        }
      });
    } catch (error) {
      console.error('[AdMob Native] Failed to initialize AdMob:', error);
    }
  }

  static async showBanner() {
    if (!this.isAdMobAvailable) {
      console.log('[AdMob Web Simulation] Showing simulated banner ad.');
      return;
    }

    try {
      // Ensure we clean up any old banners first
      try {
        await AdMob.removeBanner();
      } catch (e) {
        // Ignore removal errors if not present
      }

      const options: BannerAdOptions = {
        adId: ANDROID_TEST_BANNER_ID,
        adSize: BannerAdSize.BANNER,
        position: BannerAdPosition.BOTTOM_CENTER,
        margin: 0,
        isTesting: true,
      };
      await AdMob.showBanner(options);
      this.isBannerShowing = true;
      console.log('[AdMob Native] Banner ad displayed.');
    } catch (error) {
      console.error('[AdMob Native] Failed to show banner:', error);
    }
  }

  static async hideBanner() {
    if (!this.isAdMobAvailable) {
      return;
    }

    try {
      await AdMob.removeBanner();
      this.isBannerShowing = false;
      console.log('[AdMob Native] Banner ad removed.');
    } catch (error) {
      console.error('[AdMob Native] Failed to hide banner:', error);
    }
  }

  static async showRewarded(onEarned: () => void, onFailed?: () => void) {
    if (!this.isAdMobAvailable) {
      console.log('[AdMob Web Simulation] Triggering simulated rewarded ad.');
      // Web fallback triggers instantly
      onEarned();
      return;
    }

    try {
      console.log('[AdMob Native] Preparing rewarded ad...');
      const options: RewardAdOptions = {
        adId: ANDROID_TEST_REWARDED_ID,
        isTesting: true,
      };
      await AdMob.prepareRewardVideoAd(options);

      let earned = false;

      // Add temporary listeners for this single session
      const rewardedListener = await AdMob.addListener(RewardAdPluginEvents.Rewarded, () => {
        console.log('[AdMob Native] Reward earned event triggered.');
        earned = true;
      });

      const dismissedListener = await AdMob.addListener(RewardAdPluginEvents.Dismissed, () => {
        console.log('[AdMob Native] Rewarded ad dismissed.');
        rewardedListener.remove();
        dismissedListener.remove();
        if (earned) {
          onEarned();
        } else if (onFailed) {
          onFailed();
        }
      });

      const failedToShowListener = await AdMob.addListener(RewardAdPluginEvents.FailedToShow, () => {
        console.error('[AdMob Native] Rewarded ad failed to show.');
        rewardedListener.remove();
        dismissedListener.remove();
        failedToShowListener.remove();
        if (onFailed) onFailed();
      });

      console.log('[AdMob Native] Showing rewarded ad...');
      await AdMob.showRewardVideoAd();
    } catch (error) {
      console.error('[AdMob Native] Failed to prepare/show rewarded ad:', error);
      if (onFailed) onFailed();
    }
  }
}
