// File-based scene sound engine: licensed CC0 music + scene sound effects.
// Levels are baked into the files (music ~ -15 LU, SFX ~ -18 LU relative to
// narration at -18 LUFS), so narration stays dominant. Scene changes crossfade.

export type MusicId = 'colony' | 'fungus' | 'extinction' | 'outside' | 'queen';
export type SfxId = 'wind' | 'thunder' | 'cicada' | 'drip' | 'morning' | 'water' | 'rain';

export interface SfxLayer {
    id: SfxId;
    /** Relative gain 0..1 on top of the baked level (default 1). */
    gain?: number;
}

export interface SceneSound {
    music: MusicId | null;
    musicGain?: number;
    sfx?: (SfxId | SfxLayer)[];
}

export interface SoundConfig {
    scenes: SceneSound[];
}

const files = import.meta.glob('/content/audio/**/*.mp3', {
    eager: true,
    query: '?url',
    import: 'default'
}) as Record<string, string>;

function urlFor(kind: 'music' | 'sfx', id: string): string | undefined {
    const url = files[`/content/audio/${kind}/${id}.mp3`];
    if (!url) console.warn(`[sound] missing ${kind} file: ${id}`);
    return url;
}

const FADE = 1.6; // seconds, scene crossfade time constant basis

interface Layer {
    key: string;
    gain: GainNode;
    src: AudioBufferSourceNode;
}

export class SoundEngine {
    private ctx: AudioContext | null = null;
    private master: GainNode | null = null;
    private musicBus: GainNode | null = null;
    private sfxBus: GainNode | null = null;
    private buffers = new Map<string, Promise<AudioBuffer | null>>();
    private layers = new Map<string, Layer>();
    private scene = 0;
    private token = 0;
    private level = 1;
    private musicWanted = true;
    private sfxWanted = true;
    private running = false;
    private paused = false;
    private debounce: number | null = null;

    constructor(private config: SoundConfig) {}

    start() {
        if (!this.ctx) this.build();
        const ctx = this.ctx!;
        if (ctx.state === 'suspended') void ctx.resume();
        this.running = true;
        this.paused = false;
        this.applyBus();
        void this.applyScene();
    }

    pause() {
        if (!this.ctx || !this.master) return;
        this.paused = true;
        this.master.gain.setTargetAtTime(0, this.ctx.currentTime, 0.15);
        const c = this.ctx;
        window.setTimeout(() => {
            if (this.paused && c.state === 'running') void c.suspend();
        }, 700);
    }

    resume() {
        if (!this.ctx || !this.master || !this.running) return;
        this.paused = false;
        if (this.ctx.state === 'suspended') void this.ctx.resume();
        this.master.gain.setTargetAtTime(this.level, this.ctx.currentTime, 0.2);
    }

    stop() {
        this.running = false;
        if (this.debounce !== null) { window.clearTimeout(this.debounce); this.debounce = null; }
        this.token++;
        if (!this.ctx || !this.master) return;
        const t = this.ctx.currentTime;
        this.master.gain.setTargetAtTime(0, t, 0.3);
        const ctx = this.ctx;
        window.setTimeout(() => {
            this.layers.forEach((l) => { try { l.src.stop(); } catch { /* already stopped */ } });
            this.layers.clear();
            void ctx.close();
        }, 1500);
        this.ctx = null;
    }

    setScene(i: number) {
        if (i === this.scene && this.layers.size) return;
        this.scene = i;
        if (!this.ctx || !this.running) return;
        // Debounce: smooth-scrolling through scenes must not start every scene's layers.
        if (this.debounce !== null) window.clearTimeout(this.debounce);
        this.debounce = window.setTimeout(() => { this.debounce = null; void this.applyScene(); }, 350);
    }

    setMusic(on: boolean) { this.musicWanted = on; this.applyBus(); }
    setSfx(on: boolean) { this.sfxWanted = on; this.applyBus(); }

    /** User volume 0..1 for the whole scene-sound layer. */
    setLevel(v: number) {
        this.level = Math.min(1, Math.max(0, v));
        if (this.ctx && this.master && !this.paused) this.master.gain.setTargetAtTime(this.level, this.ctx.currentTime, 0.2);
    }

    private applyBus() {
        if (!this.ctx) return;
        const t = this.ctx.currentTime;
        this.musicBus?.gain.setTargetAtTime(this.musicWanted ? 1 : 0, t, 0.2);
        this.sfxBus?.gain.setTargetAtTime(this.sfxWanted ? 1 : 0, t, 0.2);
    }

    private build() {
        const AC: typeof AudioContext = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        const ctx = new AC();
        this.ctx = ctx;
        this.master = ctx.createGain();
        this.master.gain.value = this.level;
        this.master.connect(ctx.destination);
        this.musicBus = ctx.createGain();
        this.musicBus.connect(this.master);
        this.sfxBus = ctx.createGain();
        this.sfxBus.connect(this.master);
        this.musicBus.gain.value = this.musicWanted ? 1 : 0;
        this.sfxBus.gain.value = this.sfxWanted ? 1 : 0;
    }

    private load(kind: 'music' | 'sfx', id: string): Promise<AudioBuffer | null> {
        const key = `${kind}/${id}`;
        let p = this.buffers.get(key);
        if (!p) {
            const url = urlFor(kind, id);
            const ctx = this.ctx;
            p = url && ctx
                ? fetch(url).then((r) => r.arrayBuffer()).then((b) => ctx.decodeAudioData(b)).catch((e) => {
                    console.warn(`[sound] failed to load ${key}`, e);
                    return null;
                })
                : Promise.resolve(null);
            this.buffers.set(key, p);
        }
        return p;
    }

    private wanted(): Map<string, { kind: 'music' | 'sfx'; id: string; gain: number }> {
        const cfg = this.config.scenes;
        const s = cfg[Math.min(this.scene, cfg.length - 1)];
        const out = new Map<string, { kind: 'music' | 'sfx'; id: string; gain: number }>();
        if (!s) return out;
        if (s.music) out.set(`music/${s.music}`, { kind: 'music', id: s.music, gain: s.musicGain ?? 1 });
        for (const e of s.sfx ?? []) {
            const l = typeof e === 'string' ? { id: e, gain: 1 } : { id: e.id, gain: e.gain ?? 1 };
            out.set(`sfx/${l.id}`, { kind: 'sfx', id: l.id, gain: l.gain ?? 1 });
        }
        return out;
    }

    private async applyScene() {
        const ctx = this.ctx;
        if (!ctx) return;
        const token = ++this.token;
        const want = this.wanted();
        // Fade out layers the new scene does not use.
        this.layers.forEach((l, key) => {
            if (!want.has(key)) {
                l.gain.gain.setTargetAtTime(0, ctx.currentTime, FADE / 3);
                window.setTimeout(() => { try { l.src.stop(); } catch { /* stopped */ } }, FADE * 1500);
                this.layers.delete(key);
            }
        });
        for (const [key, w] of want) {
            const existing = this.layers.get(key);
            if (existing) {
                existing.gain.gain.setTargetAtTime(w.gain, ctx.currentTime, FADE / 3);
                continue;
            }
            const buf = await this.load(w.kind, w.id);
            if (token !== this.token || this.ctx !== ctx || !buf) return;
            const src = ctx.createBufferSource();
            src.buffer = buf;
            src.loop = true;
            const gain = ctx.createGain();
            gain.gain.value = 0;
            src.connect(gain);
            gain.connect(w.kind === 'music' ? this.musicBus! : this.sfxBus!);
            src.start(0, Math.random() * Math.max(0, buf.duration - 1));
            gain.gain.setTargetAtTime(w.gain, ctx.currentTime, FADE / 3);
            this.layers.set(key, { key, gain, src });
        }
    }
}
