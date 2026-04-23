const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const comboEl = document.getElementById('combo');
const levelEl = document.getElementById('level');
const msgEl = document.getElementById('msg');
const mainMenuEl = document.getElementById('main-menu');
const leaderboardEl = document.getElementById('leaderboard');
const instrBtn = document.getElementById('instr-btn');
const instrOverlay = document.getElementById('instr-overlay');
const closeInstr = document.getElementById('close-instr');
const uiEl = document.getElementById('ui');
const toastContainer = document.getElementById('toast-container');

function celebrateHighScore() {
    showToast('🎉 NEW HIGH SCORE!', `You reached ${score} points!`);
    for (let i = 0; i < 100; i++) {
        emitParticle(
            player.x, 
            player.y, 
            '#ff0', 
            (random() - 0.5) * 20, 
            (random() - 0.5) * 20, 
            1.0, 
            random() * 0.02 + 0.01
        );
    }
    // Add a quick flash effect
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.fillRect(0, 0, width, height);
}

function showToast(title, message) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `<strong>${title}</strong>${message}`;
    toastContainer.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

var lastTime = 0, fps = 60, safeMode = false, fpsHistory = [];
let speed = 5;
let isDailyChallenge = false;
let dailyRng = null;

class SeededRandom {
    constructor(seed) {
        this.seed = seed;
    }
    next() {
        this.seed = (this.seed * 16807) % 2147483647;
        return (this.seed - 1) / 2147483646;
    }
}

function random() {
    return (isDailyChallenge && dailyRng) ? dailyRng.next() : Math.random();
}

let gamePaused = false;
let gameActive = false;
let score = 0;
let obstacles = [];
let gems = [];
let powerups = [];
let particles = [];
let bgPulse = 0;
let lastClickTime = 0;
let stressMode = false;
let solarFlareActive = false, solarFlareTimer = 0, solarFlareWarningTimer = 0;
let voidStormActive = false, voidStormTimer = 0, voidStormWarningTimer = 0, voidStormDirection = 0;
let level = 1, gemsCollected = 0;
let currentSector = 0;
let combo = 1, comboTimer = 0;
let boss = null;
var lastBossScore = 0;
const sectorConfig = [
    { bg: [10, 10, 30] },    // Deep Void
    { bg: [30, 10, 30] },    // Neon Nebula
    { bg: [10, 30, 30] },    // Cyber Grid
    { bg: [40, 40, 10] },    // Data Stream
    { bg: [20, 20, 20] }     // The Core
];
let highScore = localStorage.getItem('voidRunnerHighScore') || 0;
const highScoreEl = document.getElementById('high-score');

if (highScoreEl) {
    highScoreEl.innerText = `HIGH SCORE: ${highScore}`;
}

function updateLeaderboard() {
    const scores = JSON.parse(localStorage.getItem('voidRunnerLeaderboard') || '[]');
    leaderboardEl.innerHTML = 'TOP RUNS<br>' + 
        (scores.length ? scores.map((s, i) => `${i+1}. ${s}`).join('<br>') : 'NO DATA');
}

updateLeaderboard();

class SoundManager {
    constructor() {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        this.masterGain = this.ctx.createGain();
        this.masterGain.connect(this.ctx.destination);
        this.masterGain.gain.value = 0.5;
    }

    setVolume(val) {
        this.masterGain.gain.setTargetAtTime(val, this.ctx.currentTime, 0.05);
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
        gain.connect(this.masterGain);
        osc.stop(this.ctx.currentTime + duration);
    }
}

class MusicManager {
    constructor(audioCtx) {
        this.ctx = audioCtx;
        this.bpm = 120;
        this.nextBeatTime = 0;
        this.beatCount = 0;
        this.isPlaying = false;
        this.sectorProfiles = [
            { baseBpm: 120, pitch: 1.0 }, // Deep Void
            { baseBpm: 130, pitch: 1.2 }, // Neon Nebula
            { baseBpm: 140, pitch: 0.8 }, // Cyber Grid
            { baseBpm: 150, pitch: 1.5 }, // Data Stream
            { baseBpm: 160, pitch: 1.1 }, // The Core
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
            this.playBeat(this.beatCount % 4 === 0, score, profile.pitch);
            this.nextBeatTime += beatDuration;
            this.beatCount++;
        }
    }

    playBeat(isDownbeat, score, pitch = 1.0) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        if (isDownbeat) {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(60 * pitch, this.ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);
            gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);
        } else {
            osc.type = 'square';
            osc.frequency.setValueAtTime(120 * pitch, this.ctx.currentTime);
            gain.gain.setValueAtTime(0.05, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.05);
        }

        osc.connect(gain);
        gain.connect(sound.masterGain);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.1);
    }
}

const sound = new SoundManager();
const music = new MusicManager(sound.ctx);
const achievements = new AchievementsManager();

function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
}

window.addEventListener('resize', resize);
resize();

class Background {
    constructor() {
        this.stars = Array.from({ length: 100 }, () => ({
            x: random() * window.innerWidth,
            y: random() * window.innerHeight,
            s: random() * 2
        }));
    }
    update(speed, delta = 1) {
        this.stars.forEach(s => {
            s.y += speed * 0.5 * delta;
            if (s.y > window.innerHeight) s.y = 0;
        });
    }
    draw(ctx, sector) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        this.stars.forEach(s => {
            ctx.beginPath();
            ctx.arc(s.x, s.y, s.s, 0, Math.PI * 2);
            ctx.fill();
        });
    }
}

const background = new Background();

class Player {
    constructor() {
        this.x = width / 2;
        this.y = height * 0.8;
        this.r = 15;
        this.targetX = this.x;
        this.magnetActive = false;
        this.magnetTimer = 0;
        this.magnetRange = 150;
        this.wrapActive = false;
        this.wrapTimer = 0;
        this.trail = [];
        this.dashActive = false;
        this.dashTimer = 0;
        this.customColor = localStorage.getItem('voidRunnerPlayerColor') || '#0ff';
        this.updateSkin();
    }

    updateSkin() {
        if (localStorage.getItem('voidRunnerPlayerColor')) {
            this.color = localStorage.getItem('voidRunnerPlayerColor');
            this.glow = this.color;
        } else if (highScore < 100) {
            this.color = '#0ff'; // Cyan
            this.glow = '#0ff';
        } else if (highScore < 500) {
            this.color = '#0f0'; // Green
            this.glow = '#0f0';
        } else if (highScore < 1000) {
            this.color = '#ff0'; // Yellow
            this.glow = '#ff0';
        } else if (highScore < 5000) {
            this.color = '#f0f'; // Magenta
            this.glow = '#f0f';
        } else {
            this.color = '#fff'; // White
            this.glow = '#fff';
        }
    }

    dash() {
        this.dashActive = true;
        this.dashTimer = 10;
        sound.playPowerUp();
    }
    update(delta) {
        let diff = this.targetX - this.x;
        if (this.wrapActive && Math.abs(diff) > width / 2) {
            diff -= Math.sign(diff) * width;
        }
        this.x += diff * (0.2 * delta);
        
        if (this.dashActive) {
            this.dashTimer -= delta;
            if (this.dashTimer <= 0) this.dashActive = false;
            let dashDiff = this.targetX - this.x;
            if (this.wrapActive && Math.abs(dashDiff) > width / 2) {
                dashDiff -= Math.sign(dashDiff) * width;
            }
            this.x += dashDiff * (0.8 * delta);
        }

        if (this.wrapActive) {
            this.wrapTimer -= delta;
            if (this.wrapTimer <= 0) this.wrapActive = false;
            if (this.x < 0) this.x = width;
            if (this.x > width) this.x = 0;
        }

        // Update trail
        this.trail.push({x: this.x, y: this.y});
        const maxTrail = Math.floor(10 + speed);
        if (this.trail.length > maxTrail) this.trail.shift();

        if (this.magnetActive) {
            this.magnetTimer -= delta;
            if (this.magnetTimer <= 0) this.magnetActive = false;
        }
        if (this.shieldActive) {
            this.shieldTimer -= delta;
            if (this.shieldTimer <= 0) this.shieldActive = false;
        }
    }
    draw() {
        // Draw trail
        if (!safeMode && this.trail.length > 1) {
            ctx.beginPath();
            ctx.lineWidth = this.r * 0.8;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            for (let i = 0; i < this.trail.length - 1; i++) {
                const alpha = i / this.trail.length;
                ctx.strokeStyle = this.magnetActive 
                    ? `rgba(255, 255, 0, ${alpha * 0.5})` 
                    : `rgba(0, 255, 255, ${alpha * 0.5})`;
                ctx.beginPath();
                ctx.moveTo(this.trail[i].x, this.trail[i].y);
                ctx.lineTo(this.trail[i+1].x, this.trail[i+1].y);
                ctx.stroke();
            }
        }

        ctx.beginPath();
        ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
        ctx.fillStyle = this.magnetActive ? '#ff0' : this.color;
        if (!safeMode) {
            ctx.shadowBlur = this.magnetActive ? 25 : 15;
            ctx.shadowColor = this.magnetActive ? '#ff0' : this.glow;
        } else {
            ctx.shadowBlur = 0;
        }
        ctx.fill();
        ctx.closePath();

        if (this.shieldActive) {
            const pulse = Math.sin(Date.now() / 150) * 3;
            const alpha = Math.max(0.2, this.shieldTimer / 600);
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.r * 1.6 + pulse, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(0, 255, 255, ${alpha})`;
            ctx.lineWidth = 3;
            if (!safeMode) {
                ctx.shadowBlur = 10;
                ctx.shadowColor = '#0ff';
            }
            ctx.stroke();
            ctx.closePath();
            if (!safeMode) ctx.shadowBlur = 0;
        }

        if (this.magnetActive) {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.r + this.magnetRange, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(255, 255, 0, 0.3)';
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.closePath();
        }
    }
}

class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.r = random() * 3 + 1;
        this.vx = (random() - 0.5) * 10;
        this.vy = (random() - 0.5) * 10;
        this.life = 1.0;
        this.decay = random() * 0.02 + 0.01;
    }
    update(delta) {
        this.x += this.vx * delta;
        this.y += this.vy * delta;
        this.life -= this.decay * delta;
    }
    draw(ctx) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
        ctx.fillStyle = this.color.replace(')', `, ${this.life})`).replace('rgb', 'rgba');
        // If color is hex, we need a different approach. Player.color is hex.
        // Let's just use a simple alpha if it's hex.
        ctx.globalAlpha = this.life;
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.closePath();
        ctx.globalAlpha = 1.0;
    }
}
class Obstacle {
    constructor() {
        this.r = random() * 20 + 10;
        this.x = random() * width;
        this.y = -this.r;
        this.trail = [];
        this.color = '#f0f';
    }
    updateTrail() {
        this.trail.push({x: this.x, y: this.y});
        if (this.trail.length > 10) this.trail.shift();
    }

    update() {
        this.updateTrail();
        this.y += speed;
    }
    draw() {
        this.drawTrail();
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.shadowBlur = safeMode ? 0 : 15;
        ctx.shadowColor = this.color;
        ctx.fill();
        ctx.closePath();
    }

    hexToRgba(hex, alpha) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }

    // drawTrail deprecated
}

class HomingMissile extends Obstacle {
    constructor(x = random() * width, y = -20) {
        super(x, y, 12);
        this.color = '#f00';
    }
    update(delta) {
        this.updateTrail();
        this.y += speed * 1.2 * delta;
        const dx = player.x - this.x;
        this.x += Math.sign(dx) * (speed * 0.5 * delta);
    }
    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.shadowBlur = safeMode ? 0 : 15;
        ctx.shadowColor = this.color;
        ctx.fill();
        ctx.closePath();
        // Missile tip
        ctx.beginPath();
        ctx.moveTo(this.x, this.y + this.r);
        ctx.lineTo(this.x - 5, this.y + this.r + 10);
        ctx.lineTo(this.x + 5, this.y + this.r + 10);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.closePath();
    }
}

class PortalObstacle extends Obstacle {
    constructor() {
        super();
        this.color = '#00f';
        this.r = 20;
    }
    update() {
        this.updateTrail();
        this.y += speed;
    }
    draw() {
        this.drawTrail();
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.shadowBlur = safeMode ? 0 : 15;
        ctx.shadowColor = this.color;
        ctx.fill();
        ctx.closePath();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();
    }
    collidesWith(player) {
        if (checkCollision(player, this)) {
            player.x = random() * width;
            player.targetX = player.x;
            sound.playPowerUp();
            return false; // Don't kill player
        }
        return false;
    }
}

class Boss extends Obstacle {
    constructor() {
        super();
        this.r = 60;
        this.x = width / 2;
        this.y = -this.r;
        this.health = 10;
        this.maxHealth = 10;
        this.dir = 1;
        this.color = '#f0f';
        this.moveSpeed = 2;
    }
    update(delta) {
        if (!safeMode) {
            emitParticle(this.x, this.y + this.r, this.color, (random() - 0.5) * 1, 1, 0.5, 0.05);
        }
        if (this.y < 100) {
            this.y += speed * 0.5 * delta;
        } else {
            this.x += this.dir * this.moveSpeed * delta;
            if (this.x > width - this.r || this.x < this.r) {
                this.dir *= -1;
            }
        }
        if (random() < 0.02) {
            const minion = new Obstacle();
            minion.x = this.x;
            minion.y = this.y + this.r;
            obstacles.push(minion);
        }
    }
    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.shadowBlur = safeMode ? 0 : 30;
        ctx.shadowColor = this.color;
        ctx.fill();
        ctx.closePath();
        const barW = 100;
        const barH = 10;
        ctx.fillStyle = '#333';
        ctx.fillRect(this.x - barW/2, this.y - this.r - 20, barW, barH);
        ctx.fillStyle = '#f0f';
        ctx.fillRect(this.x - barW/2, this.y - this.r - 20, (this.health / this.maxHealth) * barW, barH);
    }
}

class Gem {
    constructor() {
        this.r = 8;
        this.x = random() * width;
        this.y = -this.r;
        this.value = 5;
    }
    update(delta) {
        if (player.magnetActive) {
            const dx = player.x - this.x;
            const dy = player.y - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < this.magnetRange) {
                this.x += dx * 0.1 * delta;
                this.y += dy * 0.1 * delta;
            }
        }
        this.y += speed * 0.8 * delta;
    }
    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
        ctx.fillStyle = '#ff0';
        ctx.shadowBlur = safeMode ? 0 : 10;
        ctx.shadowColor = '#ff0';
        ctx.fill();
        ctx.closePath();
    }
}

class PowerUp {
    constructor() {
        this.r = 12;
        this.x = random() * width;
        this.y = -this.r;
        const types = ['magnet', 'shield', 'wrap'];
        this.type = types[Math.floor(random() * types.length)];
    }
    update(delta) {
        this.y += speed * 0.9 * delta;
    }
    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
        ctx.fillStyle = this.type === 'magnet' ? '#0f0' : (this.type === 'shield' ? '#0ff' : '#f0f');
        ctx.shadowBlur = safeMode ? 0 : 15;
        ctx.shadowColor = ctx.fillStyle;
        ctx.fill();
        ctx.closePath();
        ctx.fillStyle = '#000';
        ctx.font = 'bold 10px Arial';
        ctx.textAlign = 'center';
        const label = this.type === 'magnet' ? 'M' : (this.type === 'shield' ? 'S' : 'W');
        ctx.fillText(label, this.x, this.y + 4);
    }
}

class Wave {
    static patterns = {
        wall: (speed) => {
            const gapX = random() * width;
            const gapSize = 100 + random() * 50;
            const obstacles = [];
            for (let x = 0; x < width; x += 40) {
                if (x < gapX - gapSize/2 || x > gapX + gapSize/2) {
                    obstacles.push(new Obstacle(x, -20, 15));
                }
            }
            return obstacles;
        },
        v_shape: (speed) => {
            const centerX = random() * width;
            const obstacles = [];
            for (let i = 0; i < 10; i++) {
                const offset = i * 20;
                obstacles.push(new Obstacle(centerX - offset, -20 - i*10, 12));
                obstacles.push(new Obstacle(centerX + offset, -20 - i*10, 12));
            }
            return obstacles;
        },
        burst: (speed) => {
            const obstacles = [];
            for (let i = 0; i < 5; i++) {
                obstacles.push(new Obstacle(random() * width, -20 - random() * 100, 15));
            }
            return obstacles;
        },
        tunnel: (speed) => {
            const obstacles = [];
            const gap = 150;
            const centerX = random() * (width - gap) + gap/2;
            for (let y = 0; y < 400; y += 60) {
                obstacles.push(new Obstacle(centerX - gap/2, -20 + y, 20));
                obstacles.push(new Obstacle(centerX + gap/2, -20 + y, 20));
            }
            return obstacles;
        },
        shards: (speed) => {
            const obstacles = [];
            for (let i = 0; i < 8; i++) {
                const o = new Obstacle();
                o.r = 5 + random() * 5;
                o.x = random() * width;
                o.y = -20 - random() * 200;
                obstacles.push(o);
            }
            return obstacles;
        },
        zigzag: (speed) => {
            const obstacles = [];
            const startX = random() * width;
            for (let i = 0; i < 10; i++) {
                const x = startX + (i % 2 === 0 ? 40 : -40);
                obstacles.push(new Obstacle(x, -20 - i * 30, 12));
            }
            return obstacles;
        }
    };

    static sectorPatterns = {
        0: ['burst', 'shards'],
        1: ['v_shape', 'zigzag'],
        2: ['wall', 'tunnel'],
        3: ['tunnel', 'zigzag', 'shards'],
        4: ['wall', 'v_shape', 'burst', 'tunnel', 'zigzag', 'shards']
    };

    static triggerRandomWave(sector) {
        const available = this.sectorPatterns[sector] || Object.keys(this.patterns);
        const patternKey = available[Math.floor(random() * available.length)];
        return this.patterns[patternKey](speed);
    }
}

function emitParticle(x, y, color, vx = (random() - 0.5) * 2, vy = (random() - 0.5) * 2, life = 1.0, decay = random() * 0.02 + 0.01) {
    const p = new Particle(x, y, color);
    p.vx = vx;
    p.vy = vy;
    p.life = life;
    p.decay = decay;
    particles.push(p);
}

function shatterPlayer(x, y, color) {
    for (let i = 0; i < 20; i++) {
        emitParticle(x, y, color, (random() - 0.5) * 10, (random() - 0.5) * 10);
    }
}

function updateParticles(ctx) {
    if (safeMode) return;
    
    if (particles.length > 5000) {
        console.warn(`Particle memory warning: ${particles.length} particles active`);
    }

    for (let i = particles.length - 1; i >= 0; i--) {
        particles[i].update();
        particles[i].draw(ctx);
        if (particles[i].life <= 0) particles.splice(i, 1);
    }
}


function spawnObstacle() {
    if (gameActive) {
        // 10% chance to trigger a structured wave instead of a single obstacle
        if (random() < 0.10 && score > 50) {
            const waveObstacles = Wave.triggerRandomWave(currentSector);
            obstacles.push(...waveObstacles);
        } else {
            const isHoming = random() < 0.15 && score > 20;
            const isPortal = random() < 0.05 && score > 50;
            const isSine = random() < 0.1 && score > 100;
            if (isPortal) {
                obstacles.push(new PortalObstacle());
            } else if (isSine) {
                obstacles.push(new SineWaveObstacle());
            } else if (isHoming) {
                obstacles.push(new HomingMissile());
            } else {
                obstacles.push(new Obstacle());
            }
        }
        setTimeout(spawnObstacle, difficulty.spawnRate);
    }
}

function spawnGem() {
    if (gameActive) {
        gems.push(new Gem());
        setTimeout(spawnGem, 2000 + random() * 3000);
    }
}

function spawnPowerUp() {
    if (gameActive) {
        powerups.push(new PowerUp());
        setTimeout(spawnPowerUp, 10000 + random() * 15000);
    }
}

function spawnSolarFlare() {
    if (gameActive) {
        setTimeout(() => {
            triggerSolarFlare();
            spawnSolarFlare();
        }, 30000 + random() * 30000); // Every 30-60 seconds
    }
}

function spawnVoidStorm() {
    if (gameActive) {
        setTimeout(() => {
            triggerVoidStorm();
            spawnVoidStorm();
        }, 40000 + random() * 40000); // Every 40-80 seconds
    }
}

function checkCollision(p, o) {
    const dx = p.x - o.x;
    const dy = p.y - o.y;
    return Math.sqrt(dx * dx + dy * dy) < p.r + o.r;
}

function drawBloom() {
    if (safeMode) return;
    ctx.save();
    ctx.filter = 'blur(12px) brightness(1.2)';
    ctx.globalCompositeOperation = 'screen';
    
    // Redraw player
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.r, 0, Math.PI * 2);
    ctx.fillStyle = player.color;
    ctx.fill();
    
    // Redraw obstacles
    obstacles.forEach(o => {
        ctx.beginPath();
        ctx.arc(o.x, o.y, o.r, 0, Math.PI * 2);
        ctx.fillStyle = o.color;
        ctx.fill();
    });
    
    // Redraw gems
    gems.forEach(g => {
        ctx.beginPath();
        ctx.arc(g.x, g.y, g.r, 0, Math.PI * 2);
        ctx.fillStyle = '#ff0';
        ctx.fill();
    });
    
    // Redraw powerups
    powerups.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.type === 'magnet' ? '#0f0' : (p.type === 'shield' ? '#0ff' : '#f0f');
        ctx.fill();
    });
    
    ctx.restore();
}

function gameLoop(timestamp) {
    if (!lastTime) lastTime = timestamp;
    const dt = timestamp - lastTime;
    lastTime = timestamp;
    const delta = dt / (1000 / 60);

    const currentFps = dt > 0 ? 1000 / dt : 60;
    fpsHistory.push(currentFps);
    if (fpsHistory.length > 60) fpsHistory.shift();
    fps = fpsHistory.reduce((a, b) => a + b, 0) / fpsHistory.length;

    if (fps < 30) {
        safeMode = true;
    } else if (fps > 45) {
        safeMode = false;
    }

    if (gamePaused) return;

    // Hazard Logic
    if (solarFlareWarningTimer > 0) {
        solarFlareWarningTimer -= delta;
        if (solarFlareWarningTimer <= 0) {
            solarFlareWarningTimer = 0;
            solarFlareActive = true;
            solarFlareTimer = 300;
        }
    }
    if (solarFlareActive) {
        solarFlareTimer -= delta;
        if (solarFlareTimer <= 0) solarFlareActive = false;
    }

    if (voidStormWarningTimer > 0) {
        voidStormWarningTimer -= delta;
        if (voidStormWarningTimer <= 0) {
            voidStormWarningTimer = 0;
            voidStormActive = true;
            voidStormTimer = 300;
        }
    }
    if (voidStormActive) {
        voidStormTimer -= delta;
        if (voidStormTimer <= 0) voidStormActive = false;
        // Push player
        player.targetX += voidStormDirection * 5 * delta;
    }

    const sectorIdx = Math.min(currentSector, sectorConfig.length - 1);
    const nextSectorIdx = Math.min(sectorIdx + 1, sectorConfig.length - 1);
    const sector = sectorConfig[sectorIdx];
    const nextSector = sectorConfig[nextSectorIdx];

    // Smoothly interpolate background color based on progress to next sector
    const progress = (score % 50) / 50;
    const r = Math.round(sector.bg[0] + (nextSector.bg[0] - sector.bg[0]) * progress);
    const g = Math.round(sector.bg[1] + (nextSector.bg[1] - sector.bg[1]) * progress);
    const b = Math.round(sector.bg[2] + (nextSector.bg[2] - sector.bg[2]) * progress);

    if (boss) {
        bgPulse += 0.1;
    } else {
        bgPulse = 0;
    }
    const pulseOffset = boss ? Math.sin(bgPulse) * 30 : 0;
    const r_p = Math.max(0, Math.min(255, r + pulseOffset));
    const g_p = Math.max(0, Math.min(255, g + pulseOffset));
    const b_p = Math.max(0, Math.min(255, b + pulseOffset));

    ctx.fillStyle = `rgba(${r_p}, ${g_p}, ${b_p}, 0.2)`;
    ctx.fillRect(0, 0, width, height);
    background.update(speed, delta);
    background.draw(ctx, sector);

    player.update(delta);
    if (gameActive) {
        currentSector = Math.floor(score / 50);
        
        // Update Dynamic Music
        music.update(speed, score, currentSector);

        // Combo logic
        if (comboTimer > 0) {
            comboTimer--;
            if (comboTimer <= 0) combo = 1;
        }
        comboEl.innerText = combo > 1 ? `COMBO x${combo}` : '';

        // Update and draw particles
        if (!safeMode) {
            ctx.globalCompositeOperation = 'lighter';
            for (let i = particles.length - 1; i >= 0; i--) {
                particles[i].update(delta);
                particles[i].draw(ctx);
                if (particles[i].life <= 0) particles.splice(i, 1);
            }
            ctx.globalCompositeOperation = 'source-over';
        }

        // Boss logic
        if (score > 0 && score % 250 === 0 && lastBossScore !== score) {
            boss = new Boss();
            lastBossScore = score;
            sound.playPowerUp();
        }

        if (boss) {
            boss.update(delta);
            boss.draw();
            if (checkCollision(player, boss)) {
                gameActive = false;
                sound.playCollision();
                if (score > highScore) {
                    celebrateHighScore();
                    highScore = score;
                    localStorage.setItem('voidRunnerHighScore', highScore);
                    highScoreEl.innerText = `HIGH SCORE: ${highScore}`;
                    player.updateSkin();
                    const scores = JSON.parse(localStorage.getItem('voidRunnerLeaderboard') || '[]');
                    scores.push(score);
                    scores.sort((a, b) => b - a);
                    const top5 = scores.slice(0, 5);
                    localStorage.setItem('voidRunnerLeaderboard', JSON.stringify(top5));
                    updateLeaderboard();
                }
                msgEl.innerText = 'GAME OVER';
                msgEl.style.display = 'block';
                setTimeout(() => {
                    mainMenuEl.style.display = 'flex';
                    uiEl.style.display = 'none';
                    msgEl.style.display = 'none';
                }, 1500);
            }
        }

        for (let i = obstacles.length - 1; i >= 0; i--) {
            const o = obstacles[i];
            o.update(delta);
            o.draw();
            const collided = o.collidesWith ? o.collidesWith(player) : checkCollision(player, o);
            if (collided) {
                if (player.shieldActive) {
                    player.shieldActive = false;
                    player.shieldTimer = 0;
                    obstacles.splice(i, 1);
                    sound.playPowerUp();
                } else {
                    gameActive = false;
                    shatterPlayer(player.x, player.y, player.color);
                    sound.playCollision();

                    const unlocked = achievements.check(score, gemsCollected);
                    if (unlocked.length > 0) {
                        unlocked.forEach(a => showToast('ACHIEVEMENT UNLOCKED', a.name));
                    }

                    if (score > highScore) {
                        celebrateHighScore();
                        highScore = score;
                        localStorage.setItem('voidRunnerHighScore', highScore);
                        highScoreEl.innerText = `HIGH SCORE: ${highScore}`;
                        player.updateSkin();

                        const scores = JSON.parse(localStorage.getItem('voidRunnerLeaderboard') || '[]');
                        scores.push(score);
                        scores.sort((a, b) => b - a);
                        const top5 = scores.slice(0, 5);
                        localStorage.setItem('voidRunnerLeaderboard', JSON.stringify(top5));
                        updateLeaderboard();
                    }
                    msgEl.innerText = 'GAME OVER';
                    msgEl.style.display = 'block';
                    setTimeout(() => {
                        mainMenuEl.style.display = 'flex';
                        uiEl.style.display = 'none';
                        msgEl.style.display = 'none';
                    }, 1500);
                }
            }
            if (o && o.y > height + o.r) {
                obstacles.splice(i, 1);
                score++;
                sound.playScore();
                scoreEl.innerText = score;
                speed += 0.01;
            }
        }

        gems.forEach((g, i) => {
            g.update(delta);
            g.draw();
            if (checkCollision(player, g)) {
                gems.splice(i, 1);
                score += g.value * combo;
                combo++;
                comboTimer = 120;
                sound.playGem();
                scoreEl.innerText = score;
                
                gemsCollected++;
                const newLevel = Math.floor(gemsCollected / 10) + 1;
                if (newLevel > level) {
                    level = newLevel;
                    player.magnetRange += 50;
                    levelEl.innerText = `LEVEL ${level}`;
                    sound.playPowerUp();
                }
            }
            if (g.y > height + g.r) gems.splice(i, 1);
        });

        powerups.forEach((p, i) => {
            try {
                p.update(delta);
                p.draw();
                if (checkCollision(player, p)) {
                    powerups.splice(i, 1);
                    sound.playPowerUp();
                    if (p.type === 'magnet') {
                        player.magnetActive = true;
                        player.magnetTimer = 600; // ~10 seconds at 60fps
                    } else if (p.type === 'shield') {
                        player.shieldActive = true;
                        player.shieldTimer = 600;
                    } else if (p.type === 'wrap') {
                        player.wrapActive = true;
                        player.wrapTimer = 600;
                    }
                }
                if (p.y > height + p.r) powerups.splice(i, 1);
            } catch (e) {
                console.error(`Error updating powerup ${i}:`, e);
            }
        });

    } else {
        player.draw();
    }
    drawBloom();
    ctx.setTransform(1, 0, 0, 1, 0, 0);

    if (solarFlareActive) {
        ctx.fillStyle = `rgba(255, ${200 + random() * 55}, ${150 + random() * 100}, ${0.3 + random() * 0.2})`;
        ctx.fillRect(0, 0, width, height);
    }

    requestAnimationFrame(gameLoop);
}

window.addEventListener('touchstart', (e) => {
    if (!gameActive) {
        isDailyChallenge = false;
        dailyRng = null;
        gameActive = true;
        score = 0;
        speed = 5;
        obstacles = [];
        gems = [];
        powerups = [];
        scoreEl.innerText = score;
        msgEl.style.display = 'none';
        mainMenuEl.style.display = 'none';
        uiEl.style.display = 'flex';
        spawnObstacle();
        spawnGem();
        spawnPowerUp();
        spawnSolarFlare();
        spawnVoidStorm();
        music.start();
        player.targetX = e.touches[0].clientX;
    }
});

window.addEventListener('touchmove', (e) => {
    if (gameActive) {
        player.targetX = e.touches[0].clientX;
        e.preventDefault();
    }
}, { passive: false });

const dailyBtn = document.getElementById('daily-btn');
dailyBtn.addEventListener('click', () => {
    isDailyChallenge = true;
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    dailyRng = new SeededRandom(parseInt(today));
    
    gameActive = true;
    sound.playStart();
    score = 0;
    speed = 5;
    obstacles = [];
    gems = [];
    powerups = [];
    boss = null;
    lastBossScore = 0;
    scoreEl.innerText = score;
    msgEl.style.display = 'none';
    
    mainMenuEl.classList.add('fade-out');
    setTimeout(() => {
        mainMenuEl.style.display = 'none';
        mainMenuEl.classList.remove('fade-out');
    }, 500);
    
    uiEl.style.display = 'flex';
    spawnObstacle();
    spawnGem();
    spawnPowerUp();
    spawnSolarFlare();
    spawnVoidStorm();
    music.start();
    player.targetX = width / 2;
});

window.addEventListener('mousedown', (e) => {
    if (!gameActive) {
        isDailyChallenge = false;
        dailyRng = null;
        gameActive = true;
        gameActive = true;
        sound.playStart();
        score = 0;
        speed = 5;
        obstacles = [];
        gems = [];
        powerups = [];
        boss = null;
        lastBossScore = 0;
        scoreEl.innerText = score;
        msgEl.style.display = 'none';
        
        mainMenuEl.classList.add('fade-out');
        setTimeout(() => {
            mainMenuEl.style.display = 'none';
            mainMenuEl.classList.remove('fade-out');
        }, 500);

        uiEl.style.display = 'flex';
        spawnObstacle();
        spawnGem();
        spawnPowerUp();
        spawnSolarFlare();
        spawnVoidStorm();
        music.start();
        const now = Date.now();
        if (now - lastClickTime < 250) {
            player.dash();
        }
        lastClickTime = now;
        player.targetX = e.clientX;
    }
});

window.addEventListener('mousemove', (e) => {
    if (gameActive) {
        player.targetX = e.clientX;
    }
});

const pauseBtn = document.getElementById('pause-btn');
const pauseMenu = document.getElementById('pause-menu');
const resumeBtn = document.getElementById('resume-btn');
const restartBtn = document.getElementById('restart-btn');

function togglePause() {
    if (!gameActive) return;
    gamePaused = !gamePaused;
    pauseMenu.style.display = gamePaused ? 'flex' : 'none';
    if (gamePaused) {
        music.stop();
    } else {
        music.start();
    }
}

pauseBtn.addEventListener('click', togglePause);
resumeBtn.addEventListener('click', togglePause);
restartBtn.addEventListener('click', () => {
    gamePaused = false;
    pauseMenu.style.display = 'none';
    gameActive = false;
    mainMenuEl.style.display = 'flex';
    uiEl.style.display = 'none';
});

window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') togglePause();
});

instrBtn.addEventListener('click', () => {
    instrOverlay.style.display = 'flex';
});

closeInstr.addEventListener('click', () => {
    instrOverlay.style.display = 'none';
});

const stressBtn = document.getElementById('stress-btn');
stressBtn.addEventListener('click', () => {
    stressMode = !stressMode;
    stressBtn.innerText = `STRESS TEST: ${stressMode ? 'ON' : 'OFF'}`;
    stressBtn.style.backgroundColor = stressMode ? '#f0f' : 'transparent';
    stressBtn.style.color = stressMode ? '#000' : '#f0f';
});

const colorOptions = document.querySelectorAll('.color-option');
colorOptions.forEach(opt => {
    opt.addEventListener('click', () => {
        colorOptions.forEach(o => o.classList.remove('selected'));
        opt.classList.add('selected');
        const color = opt.getAttribute('data-color');
        localStorage.setItem('voidRunnerPlayerColor', color);
        if (player) player.updateSkin();
    });
});

const settingsBtn = document.getElementById('settings-btn');
const settingsMenu = document.getElementById('settings-menu');
const closeSettings = document.getElementById('close-settings');
const volumeSlider = document.getElementById('volume-slider');
const safeModeToggle = document.getElementById('safemode-toggle');

settingsBtn.addEventListener('click', () => {
    settingsMenu.style.display = 'flex';
});

closeSettings.addEventListener('click', () => {
    settingsMenu.style.display = 'none';
});

volumeSlider.addEventListener('input', (e) => {
    const vol = parseFloat(e.target.value);
    sound.setVolume(vol);
    localStorage.setItem('voidRunnerVolume', vol);
});

safeModeToggle.addEventListener('change', (e) => {
    safeMode = e.target.checked;
    localStorage.setItem('voidRunnerSafeMode', safeMode);
});

// Load settings
const savedVol = localStorage.getItem('voidRunnerVolume');
if (savedVol !== null) {
    const vol = parseFloat(savedVol);
    volumeSlider.value = vol;
    sound.setVolume(vol);
}

const savedSafeMode = localStorage.getItem('voidRunnerSafeMode');
if (savedSafeMode !== null) {
    safeMode = savedSafeMode === 'true';
    safeModeToggle.checked = safeMode;
}

player = new Player();
obstacles = [];
gems = [];
powerups = [];
particles = [];
gameLoop();
