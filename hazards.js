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