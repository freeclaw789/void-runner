const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const msgEl = document.getElementById('msg');
const mainMenuEl = document.getElementById('main-menu');
const uiEl = document.getElementById('ui');

let width, height, player, obstacles, score, gameActive = false, speed = 5;
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
    }
    update() {
        this.x += (this.targetX - this.x) * 0.2;
    }
    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
        ctx.fillStyle = '#0ff';
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#0ff';
        ctx.fill();
        ctx.closePath();
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

function spawnObstacle() {
    if (gameActive) {
        obstacles.push(new Obstacle());
        setTimeout(spawnObstacle, Math.max(200, 1000 - score * 2));
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
        scoreEl.innerText = score;
        msgEl.style.display = 'none';
        mainMenuEl.style.display = 'none';
        uiEl.style.display = 'flex';
        spawnObstacle();
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
        scoreEl.innerText = score;
        msgEl.style.display = 'none';
        mainMenuEl.style.display = 'none';
        uiEl.style.display = 'flex';
        spawnObstacle();
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
gameLoop();