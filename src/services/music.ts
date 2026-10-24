class Music {
    private el: HTMLAudioElement | null = null;
    private enabled = false;

    private ensure(): HTMLAudioElement {
        if (!this.el) {
            this.el = new Audio('/music.mp3'); // put your track in /public/music.mp3
            this.el.loop = true;
            this.el.volume = 0.35;
        }
        return this.el;
    }

    setEnabled(on: boolean): void {
        this.enabled = on;
        if (!on) {
            this.el?.pause();
            return;
        }
        const el = this.ensure();
        el.play().catch(() => {
            // Browsers block autoplay until the user taps; retry on the first tap
            const unlock = () => {
                if (this.enabled) el.play().catch(() => { });
            };
            window.addEventListener('pointerdown', unlock, { once: true });
        });
    }
}

export const music = new Music();