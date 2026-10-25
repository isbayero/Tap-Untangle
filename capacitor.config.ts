import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
    appId: 'com.lunnovate.arrowescape',
    appName: 'Tap Untangle',
    webDir: 'dist',
    server: {
        androidScheme: 'https',
    },
    plugins: {
        Haptics: {},
        StatusBar: {
            style: 'DARK',
            backgroundColor: '#0f1117',
        },
        SplashScreen: {
            launchShowDuration: 2000, // Show for 2 seconds or until hidden manually
            launchAutoHide: false,    // We will hide it manually in React once ready
            backgroundColor: '#F5F3EB',
            androidSplashResourceName: 'splash',
            androidScaleType: 'CENTER_CROP',
            showSpinner: false,
            splashFullScreen: true,
            splashImmersive: true,
        },
    },
};

export default config;