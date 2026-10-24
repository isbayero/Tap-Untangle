class SoundEngine {
    private ctx: AudioContext | null = null;
    private enabled: boolean = true;

    public setEnabled(enabled: boolean): void {
        this.enabled = enabled;
    }

    private initContext(): AudioContext {
        if (!this.ctx) {
            const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
            this.ctx = new AudioCtx();
        }
        if (this.ctx.state === 'suspended') {
            void this.ctx.resume();
        }
        return this.ctx;
    }

    public playTap(): void {
        if (!this.enabled) return;
        try {
            const ctx = this.initContext();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(420, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(140, ctx.currentTime + 0.04);

            gain.gain.setValueAtTime(0.25, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.start();
            osc.stop(ctx.currentTime + 0.04);
        } catch {
            // AudioContext fallback
        }
    }

    public playSlide(comboMultiplier: number = 1): void {
        if (!this.enabled) return;
        try {
            const ctx = this.initContext();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            const baseFreq = 260 + Math.min(comboMultiplier, 5) * 60;
            osc.type = 'sine';
            osc.frequency.setValueAtTime(baseFreq, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(baseFreq * 2.2, ctx.currentTime + 0.22);

            gain.gain.setValueAtTime(0.2, ctx.currentTime);
            gain.gain.linearRampToValueAtTime(0.28, ctx.currentTime + 0.08);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.22);

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.start();
            osc.stop(ctx.currentTime + 0.22);
        } catch { }
    }

    public playBlocked(): void {
        if (!this.enabled) return;
        try {
            const ctx = this.initContext();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(130, ctx.currentTime);
            osc.frequency.setValueAtTime(95, ctx.currentTime + 0.08);

            gain.gain.setValueAtTime(0.3, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.start();
            osc.stop(ctx.currentTime + 0.2);
        } catch { }
    }

    public playHint(): void {
        if (!this.enabled) return;
        try {
            const ctx = this.initContext();
            const notes = [587.33, 880]; // D5, A5
            notes.forEach((freq, idx) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();

                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.08);

                gain.gain.setValueAtTime(0.18, ctx.currentTime + idx * 0.08);
                gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.08 + 0.28);

                osc.connect(gain);
                gain.connect(ctx.destination);

                osc.start(ctx.currentTime + idx * 0.08);
                osc.stop(ctx.currentTime + idx * 0.08 + 0.28);
            });
        } catch { }
    }

    public playWin(): void {
        if (!this.enabled) return;
        try {
            const ctx = this.initContext();
            const chord = [392.0, 523.25, 659.25, 783.99]; // G4, C5, E5, G5
            chord.forEach((freq, i) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();

                osc.type = 'triangle';
                osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.06);

                gain.gain.setValueAtTime(0.22, ctx.currentTime + i * 0.06);
                gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.06 + 0.5);

                osc.connect(gain);
                gain.connect(ctx.destination);

                osc.start(ctx.currentTime + i * 0.06);
                osc.stop(ctx.currentTime + i * 0.06 + 0.5);
            });
        } catch { }
    }
}

export const sound = new SoundEngine();