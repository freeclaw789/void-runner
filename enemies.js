class Obstacle {
    constructor() {
        this.r = random() * 20 + 10;
        this.x = random() * width;
        this.y = -this.r;
        this.trail = [];
        this.color = themes[currentTheme].obstacle;
    }
    updateTrail() {
        this.trail.push({x: this.x, y: this.y});
        if (this.trail.length > 10) this.trail.shift();
    }

    update(delta) {
        this.updateTrail();
        this.y += speed * delta;
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

    drawTrail() {}
}

class HomingMissile extends Obstacle {
    constructor(x = random() * width, y = -20) {
        super();
        this.x = x;
        this.y = y;
        this.r = 12;
        this.color = themes[currentTheme].homing;
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
        this.color = themes[currentTheme].portal;
        this.r = 20;
    }
    update(delta) {
        this.updateTrail();
        this.y += speed * delta;
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
            return false;
        }
        return false;
    }
}

class SineWaveObstacle extends Obstacle {
    constructor() {
        super();
        this.color = themes[currentTheme].sine;
        this.amplitude = 50 + random() * 50;
        this.frequency = 0.01 + random() * 0.01;
        this.phase = random() * Math.PI * 2;
    }
    update(delta) {
        this.updateTrail();
        this.y += speed * delta;
        this.x += Math.sin(this.y * this.frequency + this.phase) * 2 * delta;
    }
    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.shadowBlur = safeMode ? 0 : 15;
        ctx.shadowColor = this.color;
        ctx.fill();
        ctx.closePath();
    }
}

class PulsingObstacle extends Obstacle {
    constructor() {
        super();
        this.color = themes[currentTheme].pulsing;
        this.baseR = this.r;
        this.pulseSpeed = 0.05 + random() * 0.05;
        this.pulseAmount = 5 + random() * 10;
    }
    update(delta) {
        this.updateTrail();
        this.y += speed * delta;
        this.r = this.baseR + Math.sin(Date.now() * this.pulseSpeed) * this.pulseAmount;
    }
    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.shadowBlur = safeMode ? 0 : 15;
        ctx.shadowColor = this.color;
        ctx.fill();
        ctx.closePath();
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
        this.color = themes[currentTheme].boss;
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

function spawnObstacle() {
    if (gameActive) {
        if (random() < difficulty.waveProbability && score > 50) {
            const waveObstacles = Wave.triggerRandomWave(currentSector);
            obstacles.push(...waveObstacles);
        } else {
            const isHoming = random() < 0.15 && score > 20;
            const isPortal = random() < 0.05 && score > 50;
            const isSine = random() < 0.1 && score > 100;
            const isPulsing = random() < 0.1 && score > 150;
            if (isPortal) {
                obstacles.push(new PortalObstacle());
            } else if (isSine) {
                obstacles.push(new SineWaveObstacle());
            } else if (isPulsing) {
                obstacles.push(new PulsingObstacle());
            } else if (isHoming) {
                obstacles.push(new HomingMissile());
            } else {
                obstacles.push(new Obstacle());
            }
        }
        setTimeout(spawnObstacle, difficulty.spawnRate);
    }
}