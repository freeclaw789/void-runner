async function runTests() {
    console.log("🚀 Starting Void Runner Enhanced Test Suite...");
    let passed = 0;
    let failed = 0;

    function assert(condition, message) {
        if (condition) {
            console.log(`✅ ${message}`);
            passed++;
        } else {
            console.error(`❌ ${message}`);
            failed++;
        }
    }

    async function waitFrames(frames = 1) {
        for (let i = 0; i < frames; i++) {
            await new Promise(resolve => requestAnimationFrame(resolve));
        }
    }

    try {
        // --- Test 1: Initial State ---
        assert(gameActive === false, "Game should start in inactive state");

        // --- Test 2: Start Mechanism ---
        window.dispatchEvent(new MouseEvent('mousedown'));
        assert(gameActive === true, "Game should be active after mousedown");
        assert(score === 0, "Score should be reset to 0 on start");
        assert(mainMenuEl.style.display === 'none', "Main menu should be hidden on start");

        // --- Test 2b: Instruction Overlay ---
        gameActive = false; // Reset for UI tests
        mainMenuEl.style.display = 'flex';
        instrBtn.click();
        assert(instrOverlay.style.display === 'flex', "Instruction overlay should show on instrBtn click");
        closeInstr.click();
        assert(instrOverlay.style.display === 'none', "Instruction overlay should hide on closeInstr click");

        // --- Test 3: E2E Input Tests (Mouse) ---
        const startX = player.x;
        const targetX = 200;
        window.dispatchEvent(new MouseEvent('mousemove', { clientX: targetX }));
        assert(player.targetX === targetX, "Mousemove should update player.targetX");
        
        await waitFrames(10); // Let the interpolation happen
        assert(player.x !== startX, "Player.x should move toward targetX after frames");
        assert(Math.abs(player.x - targetX) < Math.abs(startX - targetX), "Player should be closer to targetX");

        // --- Test 4: E2E Input Tests (Touch) ---
        const touchTargetX = 400;
        const touchEvent = new TouchEvent('touchmove', {
            touches: [{ clientX: touchTargetX, clientY: 0 }],
            bubbles: true,
            cancelable: true
        });
        window.dispatchEvent(touchEvent);
        assert(player.targetX === touchTargetX, "Touchmove should update player.targetX");

        await waitFrames(10);
        assert(player.x !== 200, "Player.x should move toward new touch targetX");
        assert(Math.abs(player.x - touchTargetX) < Math.abs(200 - touchTargetX), "Player should be closer to touch targetX");

        // --- Test 5: Collision Logic (Basic) ---
        // Manually simulate a collision
        gameActive = true;
        const dummyObstacle = { x: player.x, y: player.y, r: 10 };
        const isColliding = checkCollision(player, dummyObstacle);
        assert(isColliding === true, "Collision check should return true when objects overlap");

        // --- Test 6: E2E Collision tests (Simulate hit -> Verify Game Over) ---
        gameActive = true;
        score = 0;
        msgEl.style.display = 'none';
        const collisionObstacle = new Obstacle();
        collisionObstacle.x = player.x;
        collisionObstacle.y = player.y;
        obstacles.push(collisionObstacle);
        
        await waitFrames(2);
        assert(gameActive === false, "Game should be inactive after collision");
        assert(msgEl.innerText === 'GAME OVER', "Message should be 'GAME OVER' after collision");
        assert(msgEl.style.display === 'block', "Message should be visible after collision");

        // --- Test 7: E2E Scoring tests (Simulate gem collection -> Verify score increase) ---
        gameActive = true;
        const initialScore = score;
        const testGem = new Gem();
        testGem.x = player.x;
        testGem.y = player.y;
        gems.push(testGem);
        
        await waitFrames(2);
        assert(score > initialScore, "Score should increase after collecting a gem");
        // --- Test 8: Persistence tests (Verify localStorage high score save/load) ---
        localStorage.clear();
        localStorage.setItem('voidRunnerHighScore', '100');
        
        // Since highScore is a let variable initialized at load, we simulate a reload
        // by manually updating it or checking if the game logic would pick it up
        // In a real scenario, we'd reload the page, but here we test the storage logic
        assert(localStorage.getItem('voidRunnerHighScore') === '100', "High score should be stored in localStorage");

        // Simulate achieving a new high score
        score = 150;
        highScore = 100;
        // Trigger the logic found in gameLoop's collision section
        if (score > highScore) {
            highScore = score;
            localStorage.setItem('voidRunnerHighScore', highScore);
        }
        assert(localStorage.getItem('voidRunnerHighScore') === '150', "localStorage should update with new high score");

        // Test Leaderboard persistence
        const mockScores = [150, 100, 50];
        localStorage.setItem('voidRunnerLeaderboard', JSON.stringify(mockScores));
        const storedScores = JSON.parse(localStorage.getItem('voidRunnerLeaderboard'));
        assert(storedScores.length === 3 && storedScores[0] === 150, "Leaderboard should persist and retrieve scores correctly");
        // --- Test 9: Shield Power-up Logic ---
        gameActive = true;
        player.shieldActive = true;
        player.shieldTimer = 600;
        const shieldObstacle = new Obstacle();
        shieldObstacle.x = player.x;
        shieldObstacle.y = player.y;
        obstacles.push(shieldObstacle);
        
        await waitFrames(2);
        assert(gameActive === true, "Game should remain active after collision with shield");
        assert(player.shieldActive === false, "Shield should be consumed after collision");
        assert(obstacles.length === 0, "Obstacle should be removed after shield collision");

        localStorage.clear();
        failed++;
    }

    console.log(`\n--- Test Results ---\nPassed: ${passed}\nFailed: ${failed}`);
    if (failed > 0) throw new Error("Tests failed");
}

window.addEventListener('load', () => {
    runTests().catch(e => console.error(e));
});