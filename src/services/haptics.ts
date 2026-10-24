import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';

class HapticService {
    private enabled: boolean = true;

    public setEnabled(enabled: boolean): void {
        this.enabled = enabled;
    }

    public async tap(): Promise<void> {
        if (!this.enabled) return;
        try {
            await Haptics.impact({ style: ImpactStyle.Light });
        } catch {
            if ('vibrate' in navigator) navigator.vibrate(10);
        }
    }

    public async success(): Promise<void> {
        if (!this.enabled) return;
        try {
            await Haptics.notification({ type: NotificationType.Success });
        } catch {
            if ('vibrate' in navigator) navigator.vibrate([15, 40, 20]);
        }
    }

    public async error(): Promise<void> {
        if (!this.enabled) return;
        try {
            await Haptics.notification({ type: NotificationType.Error });
        } catch {
            if ('vibrate' in navigator) navigator.vibrate([30, 20, 30]);
        }
    }
}

export const haptics = new HapticService();