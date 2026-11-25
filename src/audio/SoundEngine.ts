// Generative sound engine: background music and scene sound effects,
// synthesized live with Web Audio so the page needs no extra audio files.

export type Beds = {
    wind: number; rumble: number; rustle: number; trickle: number;
    cicada: number; pulse: number; chirp: boolean; drop: boolean; music: number;
    drone: number;
};

export type SceneEffect = 'riser' | 'alarm' | 'bell';

export interface SoundConfig {
    beds: Beds[];
    tense?: number[];
    effects?: Record<number, SceneEffect>;
}

const EP1_BEDS: Beds[] = [
    { wind: 0.05, rumble: 0.00, rustle: 0.00, trickle: 0.00, cicada: 0.00, pulse: 0.00, chirp: true, drop: false, music: 0.90, drone: 0.00 }, // 1 dawn dew
    { wind: 0.00, rumble: 0.50, rustle: 0.12, trickle: 0.00, cicada: 0.00, pulse: 0.00, chirp: false, drop: false, music: 0.80, drone: 0.00 }, // 2 colony wakes
    { wind: 0.00, rumble: 0.40, rustle: 0.50, trickle: 0.00, cicada: 0.00, pulse: 0.00, chirp: false, drop: false, music: 0.80, drone: 0.00 }, // 3 narrow tunnel
    { wind: 0.00, rumble: 0.35, rustle: 0.25, trickle: 0.00, cicada: 0.00, pulse: 0.00, chirp: false, drop: true, music: 0.85, drone: 0.00 }, // 4 nursery
    { wind: 0.00, rumble: 0.30, rustle: 0.20, trickle: 0.50, cicada: 0.00, pulse: 0.00, chirp: false, drop: false, music: 0.90, drone: 0.00 }, // 5 granary
    { wind: 0.00, rumble: 0.25, rustle: 0.08, trickle: 0.00, cicada: 0.00, pulse: 0.00, chirp: false, drop: false, music: 1.00, drone: 0.00 }, // 6 portrait
    { wind: 0.04, rumble: 0.20, rustle: 0.20, trickle: 0.00, cicada: 0.00, pulse: 0.00, chirp: false, drop: false, music: 1.00, drone: 0.00 }, // 7 exit
    { wind: 0.10, rumble: 0.00, rustle: 0.25, trickle: 0.00, cicada: 0.15, pulse: 0.00, chirp: true, drop: false, music: 1.00, drone: 0.00 }, // 8 surface
    { wind: 0.07, rumble: 0.00, rustle: 0.45, trickle: 0.00, cicada: 0.10, pulse: 0.00, chirp: false, drop: false, music: 0.95, drone: 0.00 }, // 9 trail
    { wind: 0.12, rumble: 0.00, rustle: 0.30, trickle: 0.00, cicada: 0.10, pulse: 0.25, chirp: false, drop: false, music: 0.95, drone: 0.00 }, // 10 dragging seed
    { wind: 0.03, rumble: 0.40, rustle: 0.40, trickle: 0.20, cicada: 0.00, pulse: 0.00, chirp: false, drop: false, music: 0.90, drone: 0.00 }, // 11 entrance
    { wind: 0.00, rumble: 0.30, rustle: 0.10, trickle: 0.00, cicada: 0.00, pulse: 0.00, chirp: false, drop: true, music: 0.70, drone: 0.00 }, // 12 brood and death
    { wind: 0.08, rumble: 0.00, rustle: 0.30, trickle: 0.00, cicada: 0.35, pulse: 0.00, chirp: false, drop: false, music: 0.90, drone: 0.00 }, // 13 midday heat
    { wind: 0.06, rumble: 0.15, rustle: 0.25, trickle: 0.00, cicada: 0.10, pulse: 0.50, chirp: false, drop: false, music: 0.75, drone: 0.00 }, // 14 patrol and alarm
    { wind: 0.05, rumble: 0.00, rustle: 0.08, trickle: 0.00, cicada: 0.00, pulse: 0.00, chirp: false, drop: false, music: 1.00, drone: 0.00 }, // 15 evening mystery
];

// Episode 2: أشباح تحت الأوراق — a darker palette: more drone and pulse,
// less birdsong, near-silence for the collapse.
const EP2_BEDS: Beds[] = [
    { wind: 0.05, rumble: 0.10, rustle: 0.10, trickle: 0.00, cicada: 0.00, pulse: 0.00, chirp: false, drop: false, music: 0.75, drone: 0.10 }, // 1 paths changed
    { wind: 0.04, rumble: 0.05, rustle: 0.25, trickle: 0.00, cicada: 0.00, pulse: 0.15, chirp: false, drop: false, music: 0.70, drone: 0.15 }, // 2 strange smell
    { wind: 0.05, rumble: 0.05, rustle: 0.35, trickle: 0.00, cicada: 0.00, pulse: 0.10, chirp: false, drop: false, music: 0.65, drone: 0.20 }, // 3 leaf remains
    { wind: 0.03, rumble: 0.15, rustle: 0.15, trickle: 0.00, cicada: 0.00, pulse: 0.40, chirp: false, drop: false, music: 0.60, drone: 0.30 }, // 4 first body
    { wind: 0.08, rumble: 0.00, rustle: 0.45, trickle: 0.00, cicada: 0.12, pulse: 0.00, chirp: true, drop: false, music: 0.95, drone: 0.00 }, // 5 leaf-cutters
    { wind: 0.00, rumble: 0.30, rustle: 0.10, trickle: 0.20, cicada: 0.00, pulse: 0.00, chirp: false, drop: true, music: 0.90, drone: 0.00 }, // 6 fungus gardens
    { wind: 0.00, rumble: 0.25, rustle: 0.10, trickle: 0.10, cicada: 0.00, pulse: 0.15, chirp: false, drop: true, music: 0.70, drone: 0.30 }, // 7 pale thread
    { wind: 0.00, rumble: 0.30, rustle: 0.15, trickle: 0.05, cicada: 0.00, pulse: 0.20, chirp: false, drop: false, music: 0.65, drone: 0.30 }, // 8 gardens sicken
    { wind: 0.00, rumble: 0.30, rustle: 0.10, trickle: 0.00, cicada: 0.00, pulse: 0.25, chirp: false, drop: false, music: 0.60, drone: 0.40 }, // 9 spreads
    { wind: 0.00, rumble: 0.35, rustle: 0.40, trickle: 0.00, cicada: 0.00, pulse: 0.20, chirp: false, drop: false, music: 0.60, drone: 0.30 }, // 10 accumulation
    { wind: 0.00, rumble: 0.30, rustle: 0.10, trickle: 0.00, cicada: 0.00, pulse: 0.30, chirp: false, drop: false, music: 0.55, drone: 0.45 }, // 11 worker recoils
    { wind: 0.00, rumble: 0.35, rustle: 0.20, trickle: 0.05, cicada: 0.00, pulse: 0.10, chirp: false, drop: true, music: 0.60, drone: 0.25 }, // 12 brood care
    { wind: 0.00, rumble: 0.40, rustle: 0.05, trickle: 0.00, cicada: 0.00, pulse: 0.15, chirp: false, drop: false, music: 0.45, drone: 0.50 }, // 13 deepest lost
    { wind: 0.02, rumble: 0.30, rustle: 0.15, trickle: 0.00, cicada: 0.00, pulse: 0.20, chirp: false, drop: false, music: 0.50, drone: 0.40 }, // 14 irregular
    { wind: 0.02, rumble: 0.25, rustle: 0.05, trickle: 0.00, cicada: 0.00, pulse: 0.20, chirp: false, drop: false, music: 0.40, drone: 0.45 }, // 15 passes bodies
    { wind: 0.10, rumble: 0.00, rustle: 0.25, trickle: 0.00, cicada: 0.10, pulse: 0.00, chirp: true, drop: false, music: 0.85, drone: 0.00 }, // 16 outside unchanged
    { wind: 0.06, rumble: 0.15, rustle: 0.30, trickle: 0.00, cicada: 0.00, pulse: 0.35, chirp: false, drop: false, music: 0.70, drone: 0.15 }, // 17 patrol signals
    { wind: 0.00, rumble: 0.35, rustle: 0.10, trickle: 0.00, cicada: 0.00, pulse: 0.25, chirp: false, drop: false, music: 0.65, drone: 0.25 }, // 18 queen report
    { wind: 0.00, rumble: 0.30, rustle: 0.05, trickle: 0.00, cicada: 0.00, pulse: 0.15, chirp: false, drop: false, music: 0.55, drone: 0.35 }, // 19 queen still
    { wind: 0.04, rumble: 0.20, rustle: 0.05, trickle: 0.00, cicada: 0.00, pulse: 0.10, chirp: false, drop: false, music: 0.45, drone: 0.40 }, // 20 empty tunnels
    { wind: 0.06, rumble: 0.15, rustle: 0.20, trickle: 0.00, cicada: 0.00, pulse: 0.20, chirp: false, drop: false, music: 0.45, drone: 0.40 }, // 21 exodus
    { wind: 0.02, rumble: 0.10, rustle: 0.00, trickle: 0.00, cicada: 0.00, pulse: 0.00, chirp: false, drop: false, music: 0.30, drone: 0.35 }, // 22 absence
    { wind: 0.06, rumble: 0.10, rustle: 0.30, trickle: 0.00, cicada: 0.05, pulse: 0.10, chirp: true, drop: false, music: 0.80, drone: 0.10 }, // 23 patrol returns
    { wind: 0.04, rumble: 0.15, rustle: 0.10, trickle: 0.00, cicada: 0.00, pulse: 0.45, chirp: false, drop: false, music: 0.50, drone: 0.40 }, // 24 at the edge
    { wind: 0.00, rumble: 0.30, rustle: 0.30, trickle: 0.30, cicada: 0.00, pulse: 0.00, chirp: false, drop: false, music: 0.90, drone: 0.00 }, // 25 seed store
    { wind: 0.08, rumble: 0.05, rustle: 0.20, trickle: 0.00, cicada: 0.05, pulse: 0.10, chirp: false, drop: false, music: 0.60, drone: 0.35 }, // 26 threads creep
    { wind: 0.05, rumble: 0.05, rustle: 0.08, trickle: 0.00, cicada: 0.00, pulse: 0.00, chirp: false, drop: false, music: 0.75, drone: 0.20 }, // 27 evening window
    { wind: 0.03, rumble: 0.10, rustle: 0.05, trickle: 0.00, cicada: 0.00, pulse: 0.00, chirp: false, drop: false, music: 0.80, drone: 0.15 }, // 28 ending
];

export const EP1_SOUND: SoundConfig = {
    beds: EP1_BEDS,
    tense: [13],
    effects: { 6: 'riser', 13: 'alarm', 14: 'bell' },
};

export const EP2_SOUND: SoundConfig = {
    beds: EP2_BEDS,
    tense: [16, 17, 18, 23],
    effects: { 3: 'alarm', 6: 'riser', 27: 'bell' },
};

// D harmonic-minor color (maqam-like flavor)
const SCALE = [146.83, 155.56, 185.00, 196.00, 220.00, 233.08, 261.63, 293.66]; // D3 Eb3 F#3 G3 A3 Bb3 C4 D4
const CHORDS: number[][] = [
    [146.83, 220.00, 293.66], // D A D
    [233.08, 293.66, 349.23], // Bb D F
    [174.61, 220.00, 261.63], // F A C
    [220.00, 277.18, 329.63], // A C# E
];
const TENSE_CHORDS: number[][] = [
    [146.83, 220.00, 293.66],
    [138.59, 220.00, 293.66], // C# A D tension
    [233.08, 293.66, 349.23],
    [220.00, 277.18, 329.63],
];

export class SoundEngine {
    private ctx: AudioContext | null = null;
    private master: GainNode | null = null;
    private musicBus: GainNode | null = null;
    private sfxBus: GainNode | null = null;
    private padFilter: BiquadFilterNode | null = null;
    private padGain: GainNode | null = null;
    private padOscs: OscillatorNode[] = [];
    private noiseBuf: AudioBuffer | null = null;
    private windGain: GainNode | null = null;
    private rumbleGain: GainNode | null = null;
    private cicadaGain: GainNode | null = null;
    private droneGain: GainNode | null = null;
    private timer: number | null = null;
    private beds: Beds;
    private scene = 0;
    private chordIdx = 0;
    private lastChordAt = 0;
    private lastPulseAt = 0;
    private lastPluckAt = 0;
    private musicWanted = true;
    private sfxWanted = true;
    private running = false;

    constructor(private config: SoundConfig) {
        this.beds = config.beds[0];
    }

    start() {
        if (!this.ctx) this.build();
        const ctx = this.ctx!;
        if (ctx.state === 'suspended') void ctx.resume();
        if (this.running) return;
        this.running = true;
        this.lastChordAt = ctx.currentTime;
        this.scheduleChord(true);
        this.timer = window.setInterval(() => this.tick(), 140);
    }

    pause() {
        if (!this.ctx || !this.master) return;
        this.master.gain.setTargetAtTime(0, this.ctx.currentTime, 0.15);
        const c = this.ctx;
        window.setTimeout(() => { if (c.state === 'running' && this.master && this.master.gain.value < 0.05) void c.suspend(); }, 700);
    }

    resume() {
        if (!this.ctx || !this.master) return;
        if (this.ctx.state === 'suspended') void this.ctx.resume();
        this.master.gain.setTargetAtTime(1, this.ctx.currentTime, 0.2);
    }

    stop() {
        if (this.timer !== null) { window.clearInterval(this.timer); this.timer = null; }
        if (this.ctx && this.master) this.master.gain.setTargetAtTime(0, this.ctx.currentTime, 0.4);
        this.running = false;
    }

    setScene(i: number) {
        this.scene = i;
        this.beds = this.config.beds[Math.min(i, this.config.beds.length - 1)];
        if (!this.ctx) return;
        const t = this.ctx.currentTime;
        const b = this.beds;
        if (this.windGain) this.windGain.gain.setTargetAtTime(b.wind * 0.5, t, 1.2);
        if (this.rumbleGain) this.rumbleGain.gain.setTargetAtTime(b.rumble * 0.9, t, 1.2);
        if (this.cicadaGain) this.cicadaGain.gain.setTargetAtTime(b.cicada * 0.05, t, 1.5);
        if (this.droneGain) this.droneGain.gain.setTargetAtTime(b.drone * 0.09, t, 2.0);
        this.applyMusicLevel();
        const fx = this.config.effects?.[i];
        if (fx === 'riser') this.riser();
        if (fx === 'alarm') this.alarmMotif();
        if (fx === 'bell') this.bell();
    }

    setMusic(on: boolean) { this.musicWanted = on; this.applyMusicLevel(); }

    setSfx(on: boolean) {
        this.sfxWanted = on;
        if (!this.ctx || !this.sfxBus) return;
        this.sfxBus.gain.setTargetAtTime(on ? 1 : 0, this.ctx.currentTime, 0.1);
    }

    private applyMusicLevel() {
        if (!this.ctx || !this.musicBus) return;
        const level = this.musicWanted ? 0.9 * this.beds.music : 0;
        this.musicBus.gain.setTargetAtTime(level, this.ctx.currentTime, 0.4);
    }

    private build() {
        const AC: typeof AudioContext = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        const ctx = new AC();
        this.ctx = ctx;

        const master = ctx.createGain();
        const comp = ctx.createDynamicsCompressor();
        master.connect(comp);
        comp.connect(ctx.destination);
        this.master = master;

        this.musicBus = ctx.createGain();
        this.musicBus.gain.value = 0;
        this.musicBus.connect(master);
        this.sfxBus = ctx.createGain();
        this.sfxBus.gain.value = this.sfxWanted ? 1 : 0;
        this.sfxBus.connect(master);

        // shared noise buffer
        const len = ctx.sampleRate * 2;
        const buf = ctx.createBuffer(1, len, ctx.sampleRate);
        const data = buf.getChannelData(0);
        let brown = 0;
        for (let i = 0; i < len; i++) {
            const white = Math.random() * 2 - 1;
            brown = (brown + 0.02 * white) / 1.02;
            data[i] = white * 0.5 + brown * 2.5;
        }
        this.noiseBuf = buf;

        // wind: looping noise through swept bandpass
        const windSrc = ctx.createBufferSource();
        windSrc.buffer = buf; windSrc.loop = true;
        const windFilter = ctx.createBiquadFilter();
        windFilter.type = 'bandpass'; windFilter.frequency.value = 420; windFilter.Q.value = 0.6;
        this.windGain = ctx.createGain(); this.windGain.gain.value = 0;
        windSrc.connect(windFilter); windFilter.connect(this.windGain); this.windGain.connect(this.sfxBus);
        const windLfo = ctx.createOscillator();
        windLfo.frequency.value = 0.07;
        const windLfoGain = ctx.createGain(); windLfoGain.gain.value = 220;
        windLfo.connect(windLfoGain); windLfoGain.connect(windFilter.frequency);
        windSrc.start(); windLfo.start();

        // rumble: brown-ish noise through lowpass + sub sine
        const rumbleSrc = ctx.createBufferSource();
        rumbleSrc.buffer = buf; rumbleSrc.loop = true; rumbleSrc.playbackRate.value = 0.35;
        const rumbleFilter = ctx.createBiquadFilter();
        rumbleFilter.type = 'lowpass'; rumbleFilter.frequency.value = 90;
        this.rumbleGain = ctx.createGain(); this.rumbleGain.gain.value = 0;
        rumbleSrc.connect(rumbleFilter); rumbleFilter.connect(this.rumbleGain); this.rumbleGain.connect(this.sfxBus);
        const sub = ctx.createOscillator();
        sub.type = 'sine'; sub.frequency.value = 42;
        const subGain = ctx.createGain(); subGain.gain.value = 0.35;
        sub.connect(subGain); subGain.connect(this.rumbleGain);
        rumbleSrc.start(); sub.start();

        // cicada shimmer: noise through high bandpass with amplitude modulation
        const cicSrc = ctx.createBufferSource();
        cicSrc.buffer = buf; cicSrc.loop = true; cicSrc.playbackRate.value = 1.6;
        const cicFilter = ctx.createBiquadFilter();
        cicFilter.type = 'bandpass'; cicFilter.frequency.value = 6300; cicFilter.Q.value = 6;
        const cicAM = ctx.createGain(); cicAM.gain.value = 0;
        const cicLfo = ctx.createOscillator(); cicLfo.frequency.value = 27;
        const cicLfoGain = ctx.createGain(); cicLfoGain.gain.value = 0.5;
        cicLfo.connect(cicLfoGain); cicLfoGain.connect(cicAM.gain);
        this.cicadaGain = ctx.createGain(); this.cicadaGain.gain.value = 0;
        cicSrc.connect(cicFilter); cicFilter.connect(cicAM); cicAM.connect(this.cicadaGain); this.cicadaGain.connect(this.sfxBus);
        cicSrc.start(); cicLfo.start();

        // dread drone: two detuned low sines beating against each other
        const droneFilter = ctx.createBiquadFilter();
        droneFilter.type = 'lowpass'; droneFilter.frequency.value = 220;
        this.droneGain = ctx.createGain(); this.droneGain.gain.value = 0;
        droneFilter.connect(this.droneGain); this.droneGain.connect(this.sfxBus);
        for (const f of [55, 58.27]) {
            const osc = ctx.createOscillator();
            osc.type = 'sine'; osc.frequency.value = f;
            const g = ctx.createGain(); g.gain.value = 0.5;
            osc.connect(g); g.connect(droneFilter);
            osc.start();
        }
        const droneLfo = ctx.createOscillator(); droneLfo.frequency.value = 0.06;
        const droneLfoGain = ctx.createGain(); droneLfoGain.gain.value = 60;
        droneLfo.connect(droneLfoGain); droneLfoGain.connect(droneFilter.frequency);
        droneLfo.start();

        // music pad: three oscillators through a slow lowpass
        this.padFilter = ctx.createBiquadFilter();
        this.padFilter.type = 'lowpass'; this.padFilter.frequency.value = 620; this.padFilter.Q.value = 0.4;
        this.padGain = ctx.createGain(); this.padGain.gain.value = 0;
        this.padFilter.connect(this.padGain); this.padGain.connect(this.musicBus);
        for (let i = 0; i < 3; i++) {
            const osc = ctx.createOscillator();
            osc.type = i === 2 ? 'sine' : 'triangle';
            const g = ctx.createGain(); g.gain.value = 0.05;
            osc.connect(g); g.connect(this.padFilter);
            osc.start();
            this.padOscs.push(osc);
        }
        const padLfo = ctx.createOscillator(); padLfo.frequency.value = 0.05;
        const padLfoGain = ctx.createGain(); padLfoGain.gain.value = 180;
        padLfo.connect(padLfoGain); padLfoGain.connect(this.padFilter.frequency);
        padLfo.start();

        // gentle echo for plucks and bells
        const delay = ctx.createDelay(1); delay.delayTime.value = 0.34;
        const fb = ctx.createGain(); fb.gain.value = 0.32;
        delay.connect(fb); fb.connect(delay);
        delay.connect(this.musicBus);
        (this as { echo?: DelayNode }).echo = delay;
    }

    private scheduleChord(immediate = false) {
        if (!this.ctx || this.padOscs.length < 3) return;
        const ctx = this.ctx;
        const tense = this.config.tense ?? [];
        const set = tense.includes(this.scene) ? TENSE_CHORDS : CHORDS;
        const chord = set[this.chordIdx % set.length];
        this.chordIdx += 1;
        const t = ctx.currentTime;
        this.padOscs.forEach((osc, i) => {
            osc.frequency.setTargetAtTime(chord[i % chord.length], t, immediate ? 0.01 : 2.5);
        });
        if (this.padGain) this.padGain.gain.setTargetAtTime(0.5, t, immediate ? 0.5 : 2.0);
    }

    private tick() {
        if (!this.ctx || !this.running) return;
        const ctx = this.ctx;
        const t = ctx.currentTime;
        const b = this.beds;

        if (t - this.lastChordAt > 13) { this.lastChordAt = t; this.scheduleChord(); }

        if (Math.random() < b.rustle) this.burst(1800 + Math.random() * 2800, 0.03 + Math.random() * 0.06, 0.05);
        if (Math.random() < b.trickle * 1.6) this.burst(5200 + Math.random() * 3200, 0.008 + Math.random() * 0.02, 0.035);
        if (b.pulse > 0 && t - this.lastPulseAt > 1.1 / Math.max(b.pulse * 2, 0.4)) { this.lastPulseAt = t; this.thump(0.10 * b.pulse * 2); }
        if (b.chirp && Math.random() < 0.012) this.chirp();
        if (b.drop && Math.random() < 0.015) this.droplet();
        if (this.musicWanted && t - this.lastPluckAt > 2.2 + Math.random() * 3.5) { this.lastPluckAt = t; this.pluck(); }
    }

    private burst(freq: number, dur: number, gain: number) {
        const ctx = this.ctx!; const t = ctx.currentTime;
        const src = ctx.createBufferSource(); src.buffer = this.noiseBuf;
        src.playbackRate.value = 0.8 + Math.random() * 0.6;
        const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = freq; f.Q.value = 1.1;
        const g = ctx.createGain();
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(gain, t + 0.008);
        g.gain.exponentialRampToValueAtTime(0.0005, t + dur + 0.03);
        src.connect(f); f.connect(g); g.connect(this.sfxBus!);
        src.start(t); src.stop(t + dur + 0.08);
    }

    private thump(gain: number) {
        const ctx = this.ctx!; const t = ctx.currentTime;
        const osc = ctx.createOscillator(); osc.type = 'sine';
        osc.frequency.setValueAtTime(78, t);
        osc.frequency.exponentialRampToValueAtTime(40, t + 0.22);
        const g = ctx.createGain();
        g.gain.setValueAtTime(gain, t);
        g.gain.exponentialRampToValueAtTime(0.0005, t + 0.26);
        osc.connect(g); g.connect(this.sfxBus!);
        osc.start(t); osc.stop(t + 0.3);
    }

    private chirp() {
        const ctx = this.ctx!; const t = ctx.currentTime;
        for (let i = 0; i < 2 + Math.floor(Math.random() * 3); i++) {
            const at = t + i * (0.12 + Math.random() * 0.05);
            const osc = ctx.createOscillator(); osc.type = 'sine';
            const base = 2500 + Math.random() * 900;
            osc.frequency.setValueAtTime(base, at);
            osc.frequency.exponentialRampToValueAtTime(base * 1.4, at + 0.07);
            const g = ctx.createGain();
            g.gain.setValueAtTime(0, at);
            g.gain.linearRampToValueAtTime(0.025, at + 0.02);
            g.gain.exponentialRampToValueAtTime(0.0005, at + 0.1);
            osc.connect(g); g.connect(this.sfxBus!);
            osc.start(at); osc.stop(at + 0.14);
        }
    }

    private droplet() {
        const ctx = this.ctx!; const t = ctx.currentTime;
        const osc = ctx.createOscillator(); osc.type = 'sine';
        osc.frequency.setValueAtTime(980, t);
        osc.frequency.exponentialRampToValueAtTime(420, t + 0.12);
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.05, t);
        g.gain.exponentialRampToValueAtTime(0.0005, t + 0.18);
        osc.connect(g); g.connect(this.sfxBus!);
        osc.start(t); osc.stop(t + 0.22);
    }

    private pluck() {
        const ctx = this.ctx!; const t = ctx.currentTime;
        const freq = SCALE[Math.floor(Math.random() * SCALE.length)] * (Math.random() < 0.3 ? 2 : 1);
        const osc = ctx.createOscillator(); osc.type = 'triangle'; osc.frequency.value = freq;
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.055, t);
        g.gain.exponentialRampToValueAtTime(0.0005, t + 1.4);
        osc.connect(g);
        g.connect(this.musicBus!);
        const echo = (this as { echo?: DelayNode }).echo;
        if (echo) g.connect(echo);
        osc.start(t); osc.stop(t + 1.5);
    }

    private riser() {
        const ctx = this.ctx!; const t = ctx.currentTime;
        const osc = ctx.createOscillator(); osc.type = 'sine';
        osc.frequency.setValueAtTime(220, t);
        osc.frequency.exponentialRampToValueAtTime(880, t + 2.4);
        const g = ctx.createGain();
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(0.05, t + 1.8);
        g.gain.exponentialRampToValueAtTime(0.0005, t + 2.6);
        osc.connect(g); g.connect(this.sfxBus!);
        osc.start(t); osc.stop(t + 2.8);
    }

    private alarmMotif() {
        const ctx = this.ctx!; const t = ctx.currentTime;
        for (let i = 0; i < 3; i++) {
            const at = t + i * 0.42;
            const osc = ctx.createOscillator(); osc.type = 'square';
            osc.frequency.setValueAtTime(i % 2 === 0 ? 392 : 311, at);
            const g = ctx.createGain();
            g.gain.setValueAtTime(0, at);
            g.gain.linearRampToValueAtTime(0.018, at + 0.02);
            g.gain.exponentialRampToValueAtTime(0.0005, at + 0.3);
            osc.connect(g); g.connect(this.sfxBus!);
            osc.start(at); osc.stop(at + 0.34);
        }
    }

    private bell() {
        const ctx = this.ctx!; const t = ctx.currentTime;
        const carrier = ctx.createOscillator(); carrier.frequency.value = 587.33;
        const mod = ctx.createOscillator(); mod.frequency.value = 587.33 * 2.76;
        const modGain = ctx.createGain(); modGain.gain.setValueAtTime(220, t);
        modGain.gain.exponentialRampToValueAtTime(1, t + 2.5);
        mod.connect(modGain); modGain.connect(carrier.frequency);
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.07, t);
        g.gain.exponentialRampToValueAtTime(0.0004, t + 3.5);
        carrier.connect(g);
        g.connect(this.musicBus!);
        const echo = (this as { echo?: DelayNode }).echo;
        if (echo) g.connect(echo);
        carrier.start(t); mod.start(t);
        carrier.stop(t + 3.8); mod.stop(t + 3.8);
    }
}
