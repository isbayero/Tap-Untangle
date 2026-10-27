import { AdMob, RewardAdPluginEvents } from '@capacitor-community/admob';
import { Capacitor } from '@capacitor/core';

export const adService = {
    async initialize() {
        // Skip initialization if running in a web browser
        if (Capacitor.getPlatform() !== 'android') return;

        await AdMob.initialize({
            initializeForTesting: true, // IMPORTANT: Set to false in production
        });

        // Pre-load the first ad in the background
        this.prepareRewardedAd();
    },

    async prepareRewardedAd() {
        if (Capacitor.getPlatform() !== 'android') return;

        // Google's official Android Test Ad Unit ID for Rewarded Video
        const adId = 'ca-app-pub-1336812483262882/7099561045';

        try {
            await AdMob.prepareRewardVideoAd({ adId });
        } catch (e) {
            console.error('Failed to prepare ad', e);
        }
    },

    async showRewardedAd(): Promise<boolean> {
        // If testing on the web, simulate a 1.5s ad watch
        if (Capacitor.getPlatform() !== 'android') {
            await new Promise(r => setTimeout(r, 1500));
            return true;
        }

        return new Promise(async (resolve) => {
            let userEarnedReward = false;

            // 1. Listen for the reward event (user watched enough of the ad)
            const rewardListener = await AdMob.addListener(
                RewardAdPluginEvents.Rewarded,
                () => {
                    userEarnedReward = true;
                }
            );

            // 2. Listen for when the ad is closed
            const dismissListener = await AdMob.addListener(
                RewardAdPluginEvents.Dismissed,
                () => {
                    // Clean up listeners
                    rewardListener.remove();
                    dismissListener.remove();

                    // Pre-load the next ad so it's ready immediately next time
                    this.prepareRewardedAd();

                    // Resolve true only if they didn't skip early
                    resolve(userEarnedReward);
                }
            );

            try {
                await AdMob.showRewardVideoAd();
            } catch (e) {
                console.error('Failed to show ad', e);
                rewardListener.remove();
                dismissListener.remove();
                resolve(false);
            }
        });
    }
};