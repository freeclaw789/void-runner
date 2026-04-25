const canvas = document.getElementById('gameCanvas');
let ctx = canvas.getContext('2d');

// Initial setup
resize(canvas);
window.addEventListener('resize', () => resize(canvas));

// Global Objects Initialization
sound = new SoundManager();
music = new MusicManager(sound.ctx);
achievements = new AchievementsManager();
background = new Background();

// Load UI and Settings
loadUISettings();
updateLeaderboard();

function handleGamepadInput() {
    const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
    const gp = gamepads[0];
    if (!gp) return;

    const axisX = gp.axes[0];
    if (Math.abs(axisX) > 0.1) {
        player.targetX = player.x + axisX * 80;
    }

    if (gp.buttons[0] && gp.buttons[0].pressed || gp.buttons[2] && gp.buttons[2].pressed) {
        if (!player.dashActive) {
            player.dash();
        }
    }
}

function triggerGameOver() {
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
    document.getElementById('share-btn').style.display = 'block';

    const fadeOverlay = document.getElementById('fade-overlay');
    fadeOverlay.classList.add('flash');
    setTimeout(() => fadeOverlay.classList.remove('flash'), 100);

    player.slowmoActive = true;
    player.slowmoTimer = 999999;
    fadeOverlay.classList.add('active');

    setTimeout(() => {
        mainMenuEl.style.display = 'flex';
        uiEl.style.display = 'none';
        msgEl.style.display = 'none';
        fadeOverlay.classList.remove('active');
    }, 2500);
}

function gameLoop(timestamp) {
    if (!lastTime) lastTime = timestamp;
    const dt = timestamp - lastTime;
    lastTime = timestamp;
    const delta = dt / (1000 / 60);
    handleGamepadInput();
    const timeScale = (player.slowmoActive || player.inSlowMoZone) ? 0.5 : 1.0;
    const effectiveDelta = delta * timeScale;
    const zoomVal = Math.max(0.7, 1.0 - (speed - 5) * 0.005);
    zoom = zoomVal;

    const currentFps = dt > 0 ? 1000 / dt : 60;
    fpsHistory.push(currentFps);
    if (fpsHistory.length > 60) fpsHistory.shift();
    fps = fpsHistory.reduce((a, b) => a + b, 0) / fpsHistory.length;

    if (profilerActive) {
        const profUI = document.getElementById('profiler-ui');
        if (profUI) {
            profUI.style.display = 'block';
            document.getElementById('prof-fps').innerText = Math.round(fps);
            if (window.performance && window.performance.memory) {
                document.getElementById('prof-mem').innerText = Math.round(window.performance.memory.usedJSHeapSize / 1048576) + 'MB';
            } else {
                document.getElementById('prof-mem').innerText = 'N/A';
            }
            document.getElementById('prof-obj').innerText = obstacles.length + gems.length + powerups.length + particles.length + slowMoZones.length;
        }
    } else {
        const profUI = document.getElementById('profiler-ui');
        if (profUI) profUI.style.display = 'none';
    }

    if (fps < 30) {
        safeMode = true;
    } else if (fps > 45) {
        safeMode = false;
    }

    if (gamePaused) return;

    if (solarFlareWarningTimer > 0) {
        solarFlareWarningTimer -= effectiveDelta;
        if (solarFlareWarningTimer <= 0) {
            solarFlareWarningTimer = 0;
            solarFlareActive = true;
            solarFlareTimer = 300;
        }
    }
    if (solarFlareActive) {
        solarFlareTimer -= effectiveDelta;
        if (solarFlareTimer <= 0) solarFlareActive = false;
    }

    if (voidStormWarningTimer > 0) {
        voidStormWarningTimer -= effectiveDelta;
        if (voidStormWarningTimer <= 0) {
            voidStormWarningTimer = 0;
            voidStormActive = true;
            voidStormTimer = 300;
        }
    }
    if (voidStormActive) {
        voidStormTimer -= delta;
        if (voidStormTimer <= 0) voidStormActive = false;
        player.targetX += voidStormDirection * 5 * delta;
    }

    const sectorIdx = Math.min(currentSector, sectorConfig.length - 1);
    const nextSectorIdx = Math.min(sectorIdx + 1, sectorConfig.length - 1);
    const sector = sectorConfig[sectorIdx];
    const nextSector = sectorConfig[nextSectorIdx];

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

    ctx.save();
    ctx.translate(width / 2, height / 2);
    ctx.scale(zoom, zoom);
    ctx.translate(-width / 2, -height / 2);

    background.update(speed, effectiveDelta);
    background.draw(ctx, sector);

    player.update(effectiveDelta);
    if (gameActive) {
        currentSector = Math.floor(score / 50);
        music.update(speed, score, currentSector);

        const now = Date.now();
        if (now - lastDifficultyUpdate > 1000) {
            const gemsPerSecond = gemsInWindow / 1.0;
            updateDifficulty(score, { gemsPerSecond });
            gemsInWindow = 0;
            lastDifficultyUpdate = now;
        }

        let inZone = false;
        for (const zone of slowMoZones) {
            if (zone.contains(player)) inZone = true;
        }
        player.inSlowMoZone = inZone;

        if (comboTimer > 0) {
            comboTimer--;
            if (comboTimer <= 0) combo = 1;
        }
        comboEl.innerText = combo > 1 ? `COMBO x${combo}` : '';

        if (!safeMode) {
            ctx.globalCompositeOperation = 'lighter';
            updateParticles(ctx, delta);
            ctx.globalCompositeOperation = 'source-over';
        }

        for (let i = slowMoZones.length - 1; i >= 0; i--) {
            const zone = slowMoZones[i];
            zone.update(effectiveDelta);
            zone.draw();
            if (zone.y > height + zone.h) slowMoZones.splice(i, 1);
        }

        if (score > 0 && score % 250 === 0 && lastBossScore !== score) {
            boss = new Boss();
            lastBossScore = score;
            sound.playPowerUp();
        }

        if (boss) {
            boss.update(delta);
            boss.draw();
            if (checkCollision(player, boss)) {
                triggerGameOver();
            }
        }

        for (let i = obstacles.length - 1; i >= 0; i--) {
            const o = obstacles[i];
            o.update(effectiveDelta);
            o.draw();
            const collided = o.collidesWith ? o.collidesWith(player) : checkCollision(player, o);
            if (collided) {
                if (zenMode) {
                    obstacles.splice(i, 1);
                    score++;
                    sound.playScore();
                    scoreEl.innerText = score;
                    speed += 0.01;
                } else if (player.shieldActive) {
                    player.shieldActive = false;
                    player.shieldTimer = 0;
                    obstacles.splice(i, 1);
                    sound.playPowerUp();
                } else {
                    triggerGameOver();
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
            g.update(effectiveDelta);
            g.draw();
            if (checkCollision(player, g)) {
                gems.splice(i, 1);
                score += g.value * combo;
                combo++;
                comboTimer = 120;
                sound.playGem();
                scoreEl.innerText = score;
                gemsCollected++;
                gemsInWindow++;
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
                p.update(effectiveDelta);
                p.draw();
                if (checkCollision(player, p)) {
                    powerups.splice(i, 1);
                    sound.playPowerUp();
                    if (p.type === 'magnet') {
                        player.magnetActive = true;
                        player.magnetTimer = 600;
                    } else if (p.type === 'shield') {
                        player.shieldActive = true;
                        player.shieldTimer = 600;
                    } else if (p.type === 'wrap') {
                        player.wrapActive = true;
                        player.wrapTimer = 600;
                    } else if (p.type === 'slowmo') {
                        player.slowmoActive = true;
                        player.slowmoTimer = 600;
                        showToast('POWER-UP', 'Slow Motion Active!');
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
    ctx.restore();
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
        spawnSlowMoZone();
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
    spawnSlowMoZone();
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

window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') togglePause();
});

player = new Player();
obstacles = [];
gems = [];
powerups = [];
particles = [];
gameLoop();