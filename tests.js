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

    } catch (e) {
        console.error("Unexpected error during tests:", e);
        failed++;
    }

    console.log(`\n--- Test Results ---\nPassed: ${passed}\nFailed: ${failed}`);
    if (failed > 0) throw new Error("Tests failed");
}

window.addEventListener('load', () => {
    runTests().catch(e => console.error(e));
});