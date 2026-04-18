const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const msgEl = document.getElementById('msg');

let width, height, player, obstacles, score, gameActive = false, speed = 5;

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
                msgEl.innerText = 'GAME OVER\nTAP TO RESTART';
                msgEl.style.display = 'block';
            }
            if (o.y > height + o.r) {
                obstacles.splice(i, 1);
                score++;
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
        spawnObstacle();
    } else {
        player.targetX = e.touches[0].clientX;
    }
});

window.addEventListener('mousedown', (e) => {
    if (!gameActive) {
        gameActive = true;
        score = 0;
        speed = 5;
        obstacles = [];
        scoreEl.innerText = score;
        msgEl.style.display = 'none';
        spawnObstacle();
    } else {
        player.targetX = e.clientX;
    }
});

player = new Player();
obstacles = [];
gameLoop();