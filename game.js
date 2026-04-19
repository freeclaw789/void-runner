const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const msgEl = document.getElementById('msg');
const mainMenuEl = document.getElementById('main-menu');
const uiEl = document.getElementById('ui');

let width, height, player, obstacles, gems, powerups, score, gameActive = false, speed = 5;
let highScore = localStorage.getItem('voidRunnerHighScore') || 0;
const highScoreEl = document.getElementById('high-score');

if (highScoreEl) {
    highScoreEl.innerText = `HIGH SCORE: ${highScore}`;
}

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

class Player {
    constructor() {
        this.x = width / 2;
        this.y = height * 0.8;
        this.r = 15;
        this.targetX = this.x;
        this.magnetActive = false;
        this.magnetTimer = 0;
    }
    update() {
        this.x += (this.targetX - this.x) * 0.2;
        if (this.magnetActive) {
            this.magnetTimer--;
            if (this.magnetTimer <= 0) this.magnetActive = false;
        }
    }
    draw() {
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

function spawnObstacle() {
    if (gameActive) {
        obstacles.push(new Obstacle());
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
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.fillRect(0, 0, width, height);

    if (gameActive) {
        player.update();
        player.draw();

        obstacles.forEach((o, i) => {
            o.update();
            o.draw();
            if (checkCollision(player, o)) {
                gameActive = false;
                sound.playCollision();
                if (score > highScore) {
                    highScore = score;
                    localStorage.setItem('voidRunnerHighScore', highScore);
                    highScoreEl.innerText = `HIGH SCORE: ${highScore}`;
                }
                msgEl.innerText = 'GAME OVER';
                msgEl.style.display = 'block';
                setTimeout(() => {
                    mainMenuEl.style.display = 'flex';
                    uiEl.style.display = 'none';
                    msgEl.style.display = 'none';
                }, 1500);
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
            p.update();
            p.draw();
            if (checkCollision(player, p)) {
                powerups.splice(i, 1);
                sound.playPowerUp();
                if (p.type === 'magnet') {
                    player.magnetActive = true;
                    player.magnetTimer = 600; // ~10 seconds at 60fps
                }
            }
            if (p.y > height + p.r) powerups.splice(i, 1);
        });

    } else {
        player.draw();
    }
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

player = new Player();
obstacles = [];
gems = [];
powerups = [];
gameLoop();
