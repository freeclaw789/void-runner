const scoreEl = document.getElementById('score');
const comboEl = document.getElementById('combo');
const levelEl = document.getElementById('level');
const missionEl = document.getElementById('mission');
const msgEl = document.getElementById('msg');
const mainMenuEl = document.getElementById('main-menu');
const leaderboardEl = document.getElementById('leaderboard');
const instrBtn = document.getElementById('instr-btn');
const instrOverlay = document.getElementById('instr-overlay');
const closeInstr = document.getElementById('close-instr');
const uiEl = document.getElementById('ui');
const toastContainer = document.getElementById('toast-container');
const highScoreEl = document.getElementById('high-score');
const pauseBtn = document.getElementById('pause-btn');
const pauseMenu = document.getElementById('pause-menu');
const resumeBtn = document.getElementById('resume-btn');
const muteBtn = document.getElementById('mute-btn');
const replayBtn = document.getElementById('replay-btn');
const challengeBtn = document.getElementById('challenge-btn');
const shareBtn = document.getElementById('share-btn');
const tutorialBtn = document.getElementById('tutorial-btn');

function replayLastRun() {
    const data = localStorage.getItem('voidRunnerLastReplay');
    if (!data) return;
    
    const replay = JSON.parse(data);
    const seed = replay.seed;
    const inputs = replay.inputs;
    
    recording = inputs;
    isReplaying = true;
    replayFrame = 0;
    
    startNewGame(false, seed, true);
    showToast('REPLAY', 'Replaying last run...');
}
const restartBtn = document.getElementById('restart-btn');
const settingsBtn = document.getElementById('settings-btn');
const settingsMenu = document.getElementById('settings-menu');
const closeSettings = document.getElementById('close-settings');
const volumeSlider = document.getElementById('volume-slider');
const musicVolumeSlider = document.getElementById('music-volume-slider');
const sfxVolumeSlider = document.getElementById('sfx-volume-slider');
const safeModeToggle = document.getElementById('safemode-toggle');
const zenModeToggle = document.getElementById('zenmode-toggle');
const profilerToggle = document.getElementById('profiler-toggle');
const themeSelect = document.getElementById('theme-select');

function shareScore() {
    const text = `🚀 VOID RUNNER\nScore: ${score}\nLevel: ${level}\nGems: ${gemsCollected}\nSector: ${currentSector + 1}/5\n\nCan you beat my run? #VoidRunner`;
    navigator.clipboard.writeText(text).then(() => {
        showToast('SHARED!', 'Score copied to clipboard!');
    }).catch(err => {
        console.error('Could not copy text: ', err);
    });
}

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

function updateLeaderboard() {
    const scores = JSON.parse(localStorage.getItem('voidRunnerLeaderboard') || '[]');
    leaderboardEl.innerHTML = 'TOP RUNS<br>' + 
        (scores.length ? scores.map((s, i) => `${i+1}. ${s}`).join('<br>') : 'NO DATA');
    
    // Async load global scores
    globalLeaderboard.fetchGlobalScores().then(globalScores => {
        const globalHtml = globalScores.map((s, i) => `${i+1}. ${s.name}: ${s.score}`).join('<br>');
        leaderboardEl.innerHTML = 'TOP RUNS<br>' + 
            (scores.length ? scores.map((s, i) => `${i+1}. ${s}`).join('<br>') : 'NO DATA') + 
            '<br><br>GLOBAL<br>' + globalHtml;
    });
}

function toggleMute() {
    isMuted = !isMuted;
    const currentVol = localStorage.getItem('voidRunnerVolume') || 0.5;
    sound.setVolume(isMuted ? 0 : parseFloat(currentVol));
    muteBtn.innerText = `SOUND: ${isMuted ? 'OFF' : 'ON'}`;
}

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

// Event Listeners
shareBtn.addEventListener('click', shareScore);
replayBtn.addEventListener('click', replayLastRun);
challengeBtn.addEventListener('click', () => {
    mainMenuEl.style.display = 'none';
    uiEl.style.display = 'flex';
    gameActive = true;
    const challenge = selectChallenge('gauntlet');
    showToast('CHALLENGE', `Entering ${challenge.name}...`);
    startNewGame(false, 12345, false);
    // We need to trigger the challenge logic, but since startNewGame resets everything, 
    // we call selectChallenge again or ensure state is preserved
    selectChallenge('gauntlet');
});
pauseBtn.addEventListener('click', togglePause);
pauseBtn.addEventListener('click', togglePause);
resumeBtn.addEventListener('click', togglePause);
muteBtn.addEventListener('click', toggleMute);
restartBtn.addEventListener('click', () => {
    gamePaused = false;
    pauseMenu.style.display = 'none';
    gameActive = false;
    mainMenuEl.style.display = 'flex';
    uiEl.style.display = 'none';
});

tutorialBtn.addEventListener('click', () => {
    mainMenuEl.style.display = 'none';
    uiEl.style.display = 'flex';
    gameActive = true;
    tutorialManager.start();
});

instrBtn.addEventListener('click', () => {
    instrOverlay.style.display = 'flex';
});

closeInstr.addEventListener('click', () => {
    instrOverlay.style.display = 'none';
});

settingsBtn.addEventListener('click', () => {
    settingsMenu.style.display = 'flex';
});

closeSettings.addEventListener('click', () => {
    settingsMenu.style.display = 'none';
});

themeSelect.addEventListener('change', (e) => {
    const theme = e.target.value;
    currentTheme = theme;
    localStorage.setItem('voidRunnerTheme', theme);
    if (player) player.updateSkin();
    // Refresh all active obstacles
    obstacles.forEach(o => {
        o.color = themes[theme].obstacle;
        if (o instanceof HomingMissile) o.color = themes[theme].homing;
        if (o instanceof PortalObstacle) o.color = themes[theme].portal;
        if (o instanceof SineWaveObstacle) o.color = themes[theme].sine;
        if (o instanceof PulsingObstacle) o.color = themes[theme].pulsing;
        if (o instanceof Boss) o.color = themes[theme].boss;
    });
});

volumeSlider.addEventListener('input', (e) => {
    const vol = parseFloat(e.target.value);
    sound.setMasterVolume(vol);
    localStorage.setItem('voidRunnerVolume', vol);
});

musicVolumeSlider.addEventListener('input', (e) => {
    const vol = parseFloat(e.target.value);
    sound.setMusicVolume(vol);
    localStorage.setItem('voidRunnerMusicVolume', vol);
});

sfxVolumeSlider.addEventListener('input', (e) => {
    const vol = parseFloat(e.target.value);
    sound.setSfxVolume(vol);
    localStorage.setItem('voidRunnerSfxVolume', vol);
});

safeModeToggle.addEventListener('change', (e) => {
    safeMode = e.target.checked;
    localStorage.setItem('voidRunnerSafeMode', safeMode);
});

zenModeToggle.addEventListener('change', (e) => {
    zenMode = e.target.checked;
    localStorage.setItem('voidRunnerZenMode', zenMode);
});

profilerToggle.addEventListener('change', (e) => {
    profilerActive = e.target.checked;
    localStorage.setItem('voidRunnerProfiler', profilerActive);
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

const shipOptions = document.querySelectorAll('.ship-option');
shipOptions.forEach(opt => {
    opt.addEventListener('click', () => {
        shipOptions.forEach(o => o.classList.remove('selected'));
        opt.classList.add('selected');
        const ship = opt.getAttribute('data-ship');
        currentShipClass = ship;
        localStorage.setItem('voidRunnerShipClass', ship);
        if (player) {
            const shipData = shipClasses[ship];
            player.r = shipData.radius;
            player.updateSkin();
        }
    });
});

// Load settings
function loadUISettings() {
    const savedTheme = localStorage.getItem('voidRunnerTheme');
    if (savedTheme !== null) {
        currentTheme = savedTheme;
        themeSelect.value = savedTheme;
    } else {
        themeSelect.value = 'neon';
    }
    const savedVol = localStorage.getItem('voidRunnerVolume');
    if (savedVol !== null) {
        const vol = parseFloat(savedVol);
        volumeSlider.value = vol;
        sound.setMasterVolume(vol);
    }
    const savedMusicVol = localStorage.getItem('voidRunnerMusicVolume');
    if (savedMusicVol !== null) {
        const vol = parseFloat(savedMusicVol);
        musicVolumeSlider.value = vol;
        sound.setMusicVolume(vol);
    }
    const savedSfxVol = localStorage.getItem('voidRunnerSfxVolume');
    if (savedSfxVol !== null) {
        const vol = parseFloat(savedSfxVol);
        sfxVolumeSlider.value = vol;
        sound.setSfxVolume(vol);
    }
    const savedSafeMode = localStorage.getItem('voidRunnerSafeMode');
    if (savedSafeMode !== null) {
        safeMode = savedSafeMode === 'true';
        safeModeToggle.checked = safeMode;
    }
    const savedZenMode = localStorage.getItem('voidRunnerZenMode');
    if (savedZenMode !== null) {
        zenMode = savedZenMode === 'true';
        zenModeToggle.checked = zenMode;
    }
    const savedProfiler = localStorage.getItem('voidRunnerProfiler');
    if (savedProfiler !== null) {
        profilerActive = savedProfiler === 'true';
        profilerToggle.checked = profilerActive;
    }

    const savedShip = localStorage.getItem('voidRunnerShipClass') || 'balanced';
    const shipOpt = document.querySelector(`.ship-option[data-ship="${savedShip}"]`);
    if (shipOpt) {
        document.querySelectorAll('.ship-option').forEach(o => o.classList.remove('selected'));
        shipOpt.classList.add('selected');
    }
}