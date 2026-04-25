class Player {
    constructor() {
        this.x = width / 2;
        this.y = height * 0.8;
        this.r = 15;
        this.targetX = this.x;
        this.magnetActive = false;
        this.magnetTimer = 0;
        this.magnetRange = this.getMagnetRange();
        this.wrapActive = false;
        this.wrapTimer = 0;
        this.slowmoActive = false;
        this.slowmoTimer = 0;
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
        } else {
            const theme = themes[currentTheme];
            if (highScore < 100) {
                this.color = theme.playerDefault;
                this.glow = theme.playerDefault;
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

        if (this.phaseActive) {
            this.phaseTimer -= delta;
            if (this.phaseTimer <= 0) this.phaseActive = false;
        }

        if (this.phaseCooldown > 0) {
            this.phaseCooldown -= delta;
        }

        if (this.phaseActive) {
            this.phaseTimer -= delta;
            if (this.phaseTimer <= 0) this.phaseActive = false;
        }

        if (this.phaseCooldown > 0) {
            this.phaseCooldown -= delta;
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
        if (this.slowmoActive) {
            this.slowmoTimer -= delta;
            if (this.slowmoTimer <= 0) this.slowmoActive = false;
        }
        if (this.shieldActive) {
            this.shieldTimer -= delta;
            if (this.shieldTimer <= 0) this.shieldActive = false;
        }
    }

    getMagnetRange() {
        return 150 + (magnetLevel - 1) * 50;
    }

    getPowerupDuration() {
        return 600 + (shieldLevel - 1) * 100;
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