const difficulty = {
    speed: 5,
    spawnRate: 1000,
    update(score) {
        this.speed = 5 + (score / 50);
        this.spawnRate = Math.max(300, 1000 - (score * 2));
    }
};

function updateDifficulty() {
    difficulty.update(score);
    speed = difficulty.speed;
}