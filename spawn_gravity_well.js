function spawnGravityWell() {
    if (gameActive) {
        gravityWells.push(new GravityWell());
        setTimeout(spawnGravityWell, 15000 + random() * 20000);
    }
}