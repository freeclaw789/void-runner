class SoundManager {
    constructor() {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        this.masterGain = this.ctx.createGain();
        this.musicGain = this.ctx.createGain();
        this.sfxGain = this.ctx.createGain();

        this.musicGain.connect(this.masterGain);
        this.sfxGain.connect(this.masterGain);
        this.masterGain.connect(this.ctx.destination);

        this.masterGain.gain.value = 0.5;
        this.musicGain.gain.value = 0.5;
        this.sfxGain.gain.value = 0.5;
    }

    setMasterVolume(val) {
        this.masterGain.gain.setTargetAtTime(val, this.ctx.currentTime, 0.05);
    }

    setMusicVolume(val) {
        this.musicGain.gain.setTargetAtTime(val, this.ctx.currentTime, 0.05);
    }

    setSfxVolume(val) {
        this.sfxGain.gain.setTargetAtTime(val, this.ctx.currentTime, 0.05);
    }

    playStart() {
        if (this.ctx.state === 'suspended') this.ctx.resume();
        this.beep(200, 400, 0.1);
    }

    playScore() {
        this.beep(800, 1000, 0.05);
    }

    playGem() {
        this.beep(1200, 1500, 0.05);
    }

    playPowerUp() {
        this.beep(600, 1200, 0.2);
    }

    playWarning() {
        this.beep(400, 200, 0.2, 'square');
    }

    playCollision() {
        this.beep(300, 100, 0.3, 'sawtooth');
    }

    beep(startFreq, endFreq, duration, type = 'sine') {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(startFreq, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(endFreq, this.ctx.currentTime + duration);

        gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);

        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.stop(this.ctx.currentTime + duration);
    }
}

class MusicManager {
    constructor(audioCtx) {
        this.ctx = audioCtx;
        this.bpm = 120;
        this.nextBeatTime = 0;
        this.beatCount = 0;
        this.melodyIndex = 0;
        this.isPlaying = false;
        this.sectorProfiles = [
            {
                baseBpm: 120, pitch: 1.0, type: 'sine', accent: 'triangle',
                melody: [0, 3, 7, 12],
                baseFreq: 110
            },
            {
                baseBpm: 130, pitch: 1.2, type: 'square', accent: 'sine',
                melody: [0, 5, 7, 12],
                baseFreq: 220
            },
            {
                baseBpm: 140, pitch: 0.8, type: 'sawtooth', accent: 'square',
                melody: [0, 2, 5, 7],
                baseFreq: 164
            },
            {
                baseBpm: 150, pitch: 1.5, type: 'sine', accent: 'sawtooth',
                melody: [0, 7, 12, 19],
                baseFreq: 330
            },
            {
                baseBpm: 160, pitch: 1.1, type: 'square', accent: 'triangle',
                melody: [0, 1, 6, 11],
                baseFreq: 110
            },
        ];
    }

    start() {
        if (this.ctx.state === 'suspended') this.ctx.resume();
        this.isPlaying = true;
        this.nextBeatTime = this.ctx.currentTime;
    }

    stop() {
        this.isPlaying = false;
    }

    update(speed, score, sector) {
        const profile = this.sectorProfiles[Math.min(sector, this.sectorProfiles.length - 1)];
        this.bpm = profile.baseBpm + (speed - 5) * 10;
        const beatDuration = 60 / this.bpm;

        if (this.isPlaying && this.ctx.currentTime >= this.nextBeatTime) {
            this.playBeat(this.beatCount % 4 === 0, profile);
            this.nextBeatTime += beatDuration;
            this.beatCount++;
            this.melodyIndex = (this.melodyIndex + 1) % profile.melody.length;
        }
    }

    playBeat(isDownbeat, profile) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        const note = profile.melody[this.melodyIndex];
        const freq = profile.baseFreq * Math.pow(2, note / 12);

        if (isDownbeat) {
            osc.type = profile.type;
            osc.frequency.setValueAtTime(freq * 0.5, this.ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);
            gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);
        } else {
            osc.type = profile.accent;
            osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
            gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.05);
        }

        osc.connect(gain);
        gain.connect(sound.musicGain);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.1);
    }
}