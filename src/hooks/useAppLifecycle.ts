import { useEffect } from 'react';
import { App as CapApp } from '@capacitor/app';

export function useAppLifecycle(onPause: () => void, onResume?: () => void): void {
    useEffect(() => {
        let removeListener: (() => void) | null = null;

        void CapApp.addListener('appStateChange', (state) => {
            if (!state.isActive) {
                onPause();
            } else if (onResume) {
                onResume();
            }
        }).then((handle) => {
            removeListener = () => handle.remove();
        });

        const handleVisibilityChange = () => {
            if (document.hidden) {
                onPause();
            } else if (onResume) {
                onResume();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            if (removeListener) removeListener();
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [onPause, onResume]);
}