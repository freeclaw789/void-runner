class Background {
    constructor() {
        this.stars = Array.from({ length: 150 }, () => ({
            x: random() * width * 1.5 - (width * 0.25),
            y: random() * height * 1.5 - (height * 0.25),
            s: random() * 2
        }));
    }
    update(speed, delta = 1) {
        this.stars.forEach(s => {
            s.y += speed * 0.5 * delta;
            if (s.y > height * 1.25) s.y = -height * 0.25;
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
        const types = ['magnet', 'shield', 'wrap', 'slowmo'];
        this.type = types[Math.floor(random() * types.length)];
    }
    update(delta) {
        this.y += speed * 0.9 * delta;
    }
    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
        ctx.fillStyle = this.type === 'magnet' ? '#0f0' : (this.type === 'shield' ? '#0ff' : (this.type === 'wrap' ? '#f0f' : '#ff0'));
        ctx.shadowBlur = safeMode ? 0 : 15;
        ctx.shadowColor = ctx.fillStyle;
        ctx.fill();
        ctx.closePath();
        ctx.fillStyle = '#000';
        ctx.font = 'bold 10px Arial';
        ctx.textAlign = 'center';
        const label = this.type === 'magnet' ? 'M' : (this.type === 'shield' ? 'S' : (this.type === 'wrap' ? 'W' : 'T'));
        ctx.fillText(label, this.x, this.y + 4);
    }
}

class SlowMoZone {
    constructor() {
        this.w = random() * 200 + 100;
        this.h = random() * 300 + 200;
        this.x = random() * (width - this.w);
        this.y = -this.h;
        this.color = 'rgba(0, 100, 255, 0.2)';
        this.glowColor = 'rgba(0, 200, 255, 0.5)';
    }
    update(delta) {
        this.y += speed * 0.7 * delta;
    }
    draw() {
        ctx.save();
        ctx.fillStyle = this.color;
        ctx.shadowBlur = safeMode ? 0 : 20;
        ctx.shadowColor = this.glowColor;
        ctx.fillRect(this.x, this.y, this.w, this.h);
        ctx.strokeStyle = this.glowColor;
        ctx.lineWidth = 2;
        ctx.strokeRect(this.x, this.y, this.w, this.h);
        ctx.restore();
    }
    contains(p) {
        return p.x > this.x && p.x < this.x + this.w && p.y > this.y && p.y < this.y + this.h;
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
        ctx.globalAlpha = this.life;
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.closePath();
        ctx.globalAlpha = 1.0;
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

function updateParticles(ctx, delta = 1) {
    if (typeof safeMode !== 'undefined' && safeMode) return;
    
    if (particles.length > 5000) {
        console.warn(`Particle memory warning: ${particles.length} particles active`);
    }
    
    for (let i = particles.length - 1; i >= 0; i--) {
        particles[i].update(delta);
        particles[i].draw(ctx);
        if (particles[i].life <= 0) particles.splice(i, 1);
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

function spawnSlowMoZone() {
    if (gameActive) {
        slowMoZones.push(new SlowMoZone());
        setTimeout(spawnSlowMoZone, 20000 + random() * 20000);
    }
}

function drawGameEntities(targetCtx, offsetX = 0, offsetY = 0) {
    targetCtx.beginPath();
    targetCtx.arc(player.x + offsetX, player.y + offsetY, player.r, 0, Math.PI * 2);
    targetCtx.fillStyle = player.color;
    targetCtx.fill();
    
    obstacles.forEach(o => {
        targetCtx.beginPath();
        targetCtx.arc(o.x + offsetX, o.y + offsetY, o.r, 0, Math.PI * 2);
        targetCtx.fillStyle = o.color;
        targetCtx.fill();
    });
    
    gems.forEach(g => {
        targetCtx.beginPath();
        targetCtx.arc(g.x + offsetX, g.y + offsetY, g.r, 0, Math.PI * 2);
        targetCtx.fillStyle = '#ff0';
        targetCtx.fill();
    });
    
    powerups.forEach(p => {
        targetCtx.beginPath();
        targetCtx.arc(p.x + offsetX, p.y + offsetY, p.r, 0, Math.PI * 2);
        targetCtx.fillStyle = p.type === 'magnet' ? '#0f0' : (p.type === 'shield' ? '#0ff' : '#f0f');
        targetCtx.fill();
    });
}

function drawBloom() {
    if (safeMode) return;
    
    const aberrationOffset = (speed - 5) * 0.8;
    
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    
    ctx.filter = 'blur(12px) brightness(1.2)';
    drawGameEntities(ctx, 0, 0);
    
    if (aberrationOffset > 0.5) {
        ctx.filter = 'blur(12px) brightness(1.2) grayscale(1) sepia(1) hue-rotate(-50deg) saturate(5)';
        drawGameEntities(ctx, aberrationOffset, 0);
        
        ctx.filter = 'blur(12px) brightness(1.2) grayscale(1) sepia(1) hue-rotate(180deg) saturate(5)';
        drawGameEntities(ctx, -aberrationOffset, 0);
    }
    
    ctx.restore();
}