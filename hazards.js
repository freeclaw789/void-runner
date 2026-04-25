function triggerSolarFlare() {
    if (!gameActive || solarFlareActive || solarFlareWarningTimer > 0) return;
    solarFlareWarningTimer = 120; // 2 seconds warning
    sound.playWarning();
}

function triggerVoidStorm() {
    if (!gameActive || voidStormActive || voidStormWarningTimer > 0) return;
    voidStormWarningTimer = 120; // 2 seconds warning
    voidStormDirection = random() < 0.5 ? -1 : 1;
    sound.playWarning();
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
