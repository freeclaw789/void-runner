function triggerSolarFlare() {
    if (!gameActive || solarFlareActive || solarFlareWarningTimer > 0) return;
    solarFlareWarningTimer = 120; // 2 seconds warning
    sound.playWarning();
}