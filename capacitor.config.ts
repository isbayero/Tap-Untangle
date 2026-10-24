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
    },
};

export default config;