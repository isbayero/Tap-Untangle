
import { Capacitor } from '@capacitor/core';
import {
    AdMob,
    AdmobConsentStatus,
    BannerAdSize,
    BannerAdPosition,
} from '@capacitor-community/admob';

// Google demo ad units for Android.
// Keep these while developing and testing.
const TEST_BANNER_ID =
    'ca-app-pub-3940256099942544/6300978111';

const TEST_REWARDED_ID =
    'ca-app-pub-1336812483262882/7099561045';

let initialized = false;
let initializationPromise = null;
let bannerShown = false;

export async function initializeAdMob() {
    if (!Capacitor.isNativePlatform()) {
        return false;
    }

    if (initialized) return true;
    if (initializationPromise) return initializationPromise;

    initializationPromise = (async () => {
        try {
            // Refresh consent information at app launch.
            let consent = await AdMob.requestConsentInfo();

            if (
                consent.isConsentFormAvailable &&
                consent.status === AdmobConsentStatus.REQUIRED
            ) {
                consent = await AdMob.showConsentForm();
            }

            if (!consent.canRequestAds) {
                console.info('Ads unavailable until consent permits requests.');
                return false;
            }

            await AdMob.initialize();
            initialized = true;
            return true;
        } catch (error) {
            console.error('AdMob initialization failed:', error);
            return false;
        } finally {
            initializationPromise = null;
        }
    })();

    return initializationPromise;
}

export async function showBannerAd() {
    const ready = await initializeAdMob();

    if (!ready || bannerShown) return;

    try {
        await AdMob.showBanner({
            adId: TEST_BANNER_ID,
            adSize: BannerAdSize.ADAPTIVE_BANNER,
            position: BannerAdPosition.BOTTOM_CENTER,
            margin: 0,
            isTesting: true,
        });

        bannerShown = true;
    } catch (error) {
        console.error('Banner ad failed:', error);
    }
}

export async function hideBannerAd() {
    if (!Capacitor.isNativePlatform() || !bannerShown) return;

    try {
        await AdMob.hideBanner();
    } catch (error) {
        console.error('Could not hide banner:', error);
    }
}

export async function removeBannerAd() {
    if (!Capacitor.isNativePlatform() || !bannerShown) return;

    try {
        await AdMob.removeBanner();
    } catch (error) {
        console.error('Could not remove banner:', error);
    } finally {
        bannerShown = false;
    }
}

export async function showRewardedAd() {
    const ready = await initializeAdMob();

    if (!ready) {
        return { success: false, reason: 'ads_unavailable' };
    }

    try {
        await AdMob.prepareRewardVideoAd({
            adId: TEST_REWARDED_ID,
            isTesting: true,
        });

        // A successful result means the user earned the reward.
        const reward = await AdMob.showRewardVideoAd();

        return {
            success: true,
            amount: reward.amount,
            type: reward.type,
        };
    } catch (error) {
        console.error('Rewarded ad failed:', error);

        return {
            success: false,
            reason: 'ad_failed',
        };
    }
}
