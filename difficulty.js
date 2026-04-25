const difficulty = {
    speed: 5,
    spawnRate: 1000,
    performanceModifier: 1.0,
    
    update(score, performanceMetrics = { gemsPerSecond: 0, survivalTime: 0 }) {
        // Base difficulty scaling
        const baseSpeed = 5 + (score / 50);
        const baseSpawnRate = Math.max(300, 1000 - (score * 2));

        // Adaptive Scaling: Adjust based on performance
        // If player is collecting gems quickly, increase difficulty
        // performanceMetrics.gemsPerSecond expected range: 0 to 1.0
        this.performanceModifier = 1.0 + (performanceMetrics.gemsPerSecond * 0.5);
        
        this.speed = baseSpeed * this.performanceModifier;
        this.spawnRate = baseSpawnRate / this.performanceModifier;
    }
};

function updateDifficulty(score, metrics) {
    difficulty.update(score, metrics);
    speed = difficulty.speed;
}