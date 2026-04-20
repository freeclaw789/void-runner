const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const msgEl = document.getElementById('msg');
const mainMenuEl = document.getElementById('main-menu');
const leaderboardEl = document.getElementById('leaderboard');
const instrBtn = document.getElementById('instr-btn');
const instrOverlay = document.getElementById('instr-overlay');
const closeInstr = document.getElementById('close-instr');
const uiEl = document.getElementById('ui');

let width, height, player, obstacles, gems, powerups, score, gameActive = false, speed = 5;
let currentSector = 0;
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
        gain.connect(this.ctx.destination);

        osc.start();
        osc.stop(this.ctx.currentTime + duration);
    }
}

const sound = new SoundManager();

function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
}

window.addEventListener('resize', resize);
resize();

class Background {
    constructor() {
        this.stars = Array.from({ length: 100 }, () => ({
            x: Math.random() * window.innerWidth,
            y: Math.random() * window.innerHeight,
            s: Math.random() * 2
        }));
    }
    update(speed) {
        this.stars.forEach(s => {
            s.y += speed * 0.5;
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
        this.trail = [];
    }
    update() {
        this.x += (this.targetX - this.x) * 0.2;
        
        // Update trail
        this.trail.push({x: this.x, y: this.y});
        const maxTrail = Math.floor(10 + speed);
        if (this.trail.length > maxTrail) this.trail.shift();

        if (this.magnetActive) {
            this.magnetTimer--;
            if (this.magnetTimer <= 0) this.magnetActive = false;
        }
    }
    draw() {
        // Draw trail
        if (this.trail.length > 1) {
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
        ctx.fillStyle = this.magnetActive ? '#ff0' : '#0ff';
        ctx.shadowBlur = this.magnetActive ? 25 : 15;
        ctx.shadowColor = this.magnetActive ? '#ff0' : '#0ff';
        ctx.fill();
        ctx.closePath();

        if (this.magnetActive) {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.r + 50, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(255, 255, 0, 0.3)';
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.closePath();
        }
    }
}

class Obstacle {
    constructor() {
        this.r = Math.random() * 20 + 10;
        this.x = Math.random() * width;
        this.y = -this.r;
    }
    update() {
        this.y += speed;
    }
    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
        ctx.fillStyle = '#f0f';
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#f0f';
        ctx.fill();
        ctx.closePath();
    }
}

class HomingMissile extends Obstacle {
    constructor(x = Math.random() * width, y = -20) {
        super(x, y, 12);
        this.color = '#f00';
    }
    update() {
        this.y += speed * 1.2;
        const dx = player.x - this.x;
        this.x += Math.sign(dx) * (speed * 0.5);
    }
    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.shadowBlur = 15;
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

class Gem {
    constructor() {
        this.r = 8;
        this.x = Math.random() * width;
        this.y = -this.r;
        this.value = 5;
    }
    update() {
        if (player.magnetActive) {
            const dx = player.x - this.x;
            const dy = player.y - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 150) {
                this.x += dx * 0.1;
                this.y += dy * 0.1;
            }
        }
        this.y += speed * 0.8;
    }
    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
        ctx.fillStyle = '#ff0';
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#ff0';
        ctx.fill();
        ctx.closePath();
    }
}

class PowerUp {
    constructor() {
        this.r = 12;
        this.x = Math.random() * width;
        this.y = -this.r;
        this.type = 'magnet';
    }
    update() {
        this.y += speed * 0.9;
    }
    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
        ctx.fillStyle = '#0f0';
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#0f0';
        ctx.fill();
        ctx.closePath();
        ctx.fillStyle = '#000';
        ctx.font = 'bold 10px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('M', this.x, this.y + 4);
    }
}

class Wave {
    static patterns = {
        wall: (speed) => {
            const gapX = Math.random() * width;
            const gapSize = 100 + Math.random() * 50;
            const obstacles = [];
            for (let x = 0; x < width; x += 40) {
                if (x < gapX - gapSize/2 || x > gapX + gapSize/2) {
                    obstacles.push(new Obstacle(x, -20, 15));
                }
            }
            return obstacles;
        },
        v_shape: (speed) => {
            const centerX = Math.random() * width;
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
                obstacles.push(new Obstacle(Math.random() * width, -20 - Math.random() * 100, 15));
            }
            return obstacles;
        },
        tunnel: (speed) => {
            const obstacles = [];
            const gap = 150;
            const centerX = Math.random() * (width - gap) + gap/2;
            for (let y = 0; y < 400; y += 60) {
                obstacles.push(new Obstacle(centerX - gap/2, -20 + y, 20));
                obstacles.push(new Obstacle(centerX + gap/2, -20 + y, 20));
            }
            return obstacles;
        }
    };

    static triggerRandomWave() {
        const keys = Object.keys(this.patterns);
        const pattern = keys[Math.floor(Math.random() * keys.length)];
        return this.patterns[pattern](speed);
    }
}

function spawnObstacle() {
    if (gameActive) {
        // 10% chance to trigger a structured wave instead of a single obstacle
        if (Math.random() < 0.10 && score > 50) {
            const waveObstacles = Wave.triggerRandomWave();
            obstacles.push(...waveObstacles);
        } else {
            const isHoming = Math.random() < 0.15 && score > 20;
            if (isHoming) {
                obstacles.push(new HomingMissile());
            } else {
                obstacles.push(new Obstacle());
            }
        }
        setTimeout(spawnObstacle, Math.max(200, 1000 - score * 2));
    }
}

function spawnGem() {
    if (gameActive) {
        gems.push(new Gem());
        setTimeout(spawnGem, 2000 + Math.random() * 3000);
    }
}

function spawnPowerUp() {
    if (gameActive) {
        powerups.push(new PowerUp());
        setTimeout(spawnPowerUp, 10000 + Math.random() * 15000);
    }
}

function checkCollision(p, o) {
    const dx = p.x - o.x;
    const dy = p.y - o.y;
    return Math.sqrt(dx * dx + dy * dy) < p.r + o.r;
}

function gameLoop() {
    const sectorIdx = Math.min(currentSector, sectorConfig.length - 1);
    const nextSectorIdx = Math.min(sectorIdx + 1, sectorConfig.length - 1);
    const sector = sectorConfig[sectorIdx];
    const nextSector = sectorConfig[nextSectorIdx];

    // Smoothly interpolate background color based on progress to next sector
    const progress = (score % 50) / 50;
    const r = Math.round(sector.bg[0] + (nextSector.bg[0] - sector.bg[0]) * progress);
    const g = Math.round(sector.bg[1] + (nextSector.bg[1] - sector.bg[1]) * progress);
    const b = Math.round(sector.bg[2] + (nextSector.bg[2] - sector.bg[2]) * progress);

    ctx.fillStyle = `rgba(${r}, ${g}, ${b}, 0.2)`;
    ctx.fillRect(0, 0, width, height);
    background.update(speed);
    background.draw(ctx, sector);

    if (gameActive) {
        currentSector = Math.floor(score / 50);
        player.update();
        player.draw();

        obstacles.forEach((o, i) => {
            o.update();
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
                    sound.playCollision();
                    if (score > highScore) {
                        highScore = score;
                        localStorage.setItem('voidRunnerHighScore', highScore);
                        highScoreEl.innerText = `HIGH SCORE: ${highScore}`;

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
            if (o.y > height + o.r) {
                obstacles.splice(i, 1);
                score++;
                sound.playScore();
                scoreEl.innerText = score;
                speed += 0.01;
            }
        });

        gems.forEach((g, i) => {
            g.update();
            g.draw();
            if (checkCollision(player, g)) {
                gems.splice(i, 1);
                score += g.value;
                sound.playGem();
                scoreEl.innerText = score;
            }
            if (g.y > height + g.r) gems.splice(i, 1);
        });

        powerups.forEach((p, i) => {
            try {
                p.update();
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
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    requestAnimationFrame(gameLoop);
}

window.addEventListener('touchstart', (e) => {
    if (!gameActive) {
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
    } else {
        player.targetX = e.touches[0].clientX;
    }
});

window.addEventListener('touchmove', (e) => {
    if (gameActive) {
        player.targetX = e.touches[0].clientX;
        e.preventDefault();
    }
}, { passive: false });

window.addEventListener('mousedown', (e) => {
    if (!gameActive) {
        gameActive = true;
        sound.playStart();
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
    } else {
        player.targetX = e.clientX;
    }
});

window.addEventListener('mousemove', (e) => {
    if (gameActive) {
        player.targetX = e.clientX;
    }
});

instrBtn.addEventListener('click', () => {
    instrOverlay.style.display = 'flex';
});

closeInstr.addEventListener('click', () => {
    instrOverlay.style.display = 'none';
});

player = new Player();
obstacles = [];
gems = [];
powerups = [];
gameLoop();
