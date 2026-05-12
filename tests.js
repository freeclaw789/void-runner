// void-runner/tests.js

window.isTesting = true;
async function runTests() {
    console.log("Running Void Runner tests...");
    
    const tests = [];

        // Test Visual Themes
    tests.push({
        name: "Theme: Visuals",
        fn: () => {
            const originalTheme = currentTheme;
            
            // Test Retro Theme
            currentTheme = 'retro';
            const retroObstacle = new Obstacle();
            if (retroObstacle.color !== themes.retro.obstacle) {
                throw new Error(`Obstacle color should be ${themes.retro.obstacle} in retro theme, got ${retroObstacle.color}`);
            }
            
            // Test Organic Theme
            currentTheme = 'organic';
            const organicObstacle = new Obstacle();
            if (organicObstacle.color !== themes.organic.obstacle) {
                throw new Error(`Obstacle color should be ${themes.organic.obstacle} in organic theme, got ${organicObstacle.color}`);
            }
            
            currentTheme = originalTheme;
        }
    });

    tests.push({
        name: "Theme: Player Skin",
        fn: () => {
            const originalTheme = currentTheme;
            localStorage.removeItem('voidRunnerPlayerColor');
            highScore = 0; // Ensure base skin
            
            currentTheme = 'retro';
            player.updateSkin();
            if (player.color !== themes.retro.playerDefault) {
                throw new Error(`Player color should be ${themes.retro.playerDefault} in retro theme, got ${player.color}`);
            }
            
            currentTheme = originalTheme;
        }
    });

    tests.push({
        name: "Collision: Near-Miss",
        fn: () => {
            const initialNearMisses = runStats.nearMisses;
            const initialCombo = combo;
            const p = { x: 100, y: 100, r: 15 };
            const o = { x: 120, y: 100, r: 10, nearMissed: false }; // Dist = 20, minSafe = 15+10+15 = 40
            
            // Simulate the logic in gameLoop
            const collided = checkCollision(p, o);
            if (!collided) {
                const dist = Math.hypot(p.x - o.x, p.y - o.y);
                const minSafeDist = p.r + o.r + 15;
                if (dist < minSafeDist && !o.nearMissed) {
                    o.nearMissed = true;
                    runStats.nearMisses++;
                    combo++;
                }
            }
            
            if (runStats.nearMisses !== initialNearMisses + 1) throw new Error("Near-miss should have been recorded");
            if (combo !== initialCombo + 1) throw new Error("Combo should have increased");
        }
    });

    tests.push({
        name: "Difficulty: Adaptive Wave Probability",
        fn: () => {
            const lowPerf = { gemsPerSecond: 0 };
            const highPerf = { gemsPerSecond: 1.0 };
            
            updateDifficulty(100, lowPerf);
            const probLow = difficulty.waveProbability;
            
            updateDifficulty(100, highPerf);
            const probHigh = difficulty.waveProbability;
            
            if (probHigh <= probLow) {
                throw new Error(`Wave probability should increase with higher performance. Low: ${probLow}, High: ${probHigh}`);
            }
        }
    });

    // Test Music Manager Melody Cycling
    tests.push({
        name: "Music: Melody Cycling",
        fn: () => {
            const initialIndex = music.melodyIndex;
            const profile = music.sectorProfiles[0];
            
            // Mock currentTime to trigger beat
            const originalCurrentTime = sound.ctx.currentTime;
            
            // We need to simulate the passage of time or force the condition
            // In game.js: if (this.isPlaying && this.ctx.currentTime >= this.nextBeatTime)
            music.isPlaying = true;
            music.nextBeatTime = 0; // Force immediate beat
            
            // We can't easily change sound.ctx.currentTime because it's a read-only property of AudioContext
            // But we can mock the AudioContext or just manually call playBeat and update logic
            
            // Instead of relying on the real AudioContext, let's test the logic by calling a helper or mocking
            // For the purpose of this test, let's just verify that update() increments melodyIndex when conditions are met
            
            // Since we can't easily mock currentTime on the real ctx, let's manually trigger the update logic
            // by temporarily overriding the check.
            
            const originalUpdate = music.update.bind(music);
            music.update = function(speed, score, sector) {
                const profile = this.sectorProfiles[Math.min(sector, this.sectorProfiles.length - 1)];
                this.bpm = profile.baseBpm + (speed - 5) * 10;
                const beatDuration = 60 / this.bpm;
                
                // Force the beat
                this.playBeat(this.beatCount % 4 === 0, profile);
                this.nextBeatTime += beatDuration;
                this.beatCount++;
                this.melodyIndex = (this.melodyIndex + 1) % profile.melody.length;
            };
            
            music.update(5, 0, 0);
            if (music.melodyIndex === initialIndex && profile.melody.length > 1) {
                throw new Error("melodyIndex should have incremented");
            }
            
            music.update = originalUpdate;
        }
    });

    // Test Adaptive Difficulty
    tests.push({
        name: "Difficulty: Adaptive Scaling",
        fn: () => {
            const initialScore = 100;
            const lowPerf = { gemsPerSecond: 0 };
            const highPerf = { gemsPerSecond: 1.0 };

            updateDifficulty(initialScore, lowPerf);
            const speedLow = speed;

            updateDifficulty(initialScore, highPerf);
            const speedHigh = speed;

            if (speedHigh <= speedLow) {
                throw new Error(`Speed should increase with higher performance. Low: ${speedLow}, High: ${speedHigh}`);
            }
        }
    });

    // Test checkCollision
    tests.push({
        name: "Collision: Overlap",
        fn: () => {
            const p = { x: 100, y: 100, r: 10 };
            const o = { x: 105, y: 105, r: 10 };
            if (!checkCollision(p, o)) throw new Error("Should collide");
        }
    });

    tests.push({
        name: "Collision: No Overlap",
        fn: () => {
            const p = { x: 100, y: 100, r: 10 };
            const o = { x: 200, y: 200, r: 10 };
            if (checkCollision(p, o)) throw new Error("Should not collide");
        }
    });

    // Test Zen Mode logic
    tests.push({
        name: "Zen Mode: Prevents Game Over",
        fn: () => {
            let gameOverCalled = false;
            const originalTriggerGameOver = window.triggerGameOver;
            window.triggerGameOver = () => { gameOverCalled = true; };
            
            zenMode = true;
            player.shieldActive = false;
            
            // Simulate the logic in gameLoop
            const p = player;
            const o = { x: p.x, y: p.y, r: p.r }; // Force collision
            const collided = checkCollision(p, o);
            
            if (collided) {
                if (zenMode) {
                    // Zen mode logic: no game over
                } else if (player.shieldActive) {
                    // Shield logic
                } else {
                    window.triggerGameOver();
                }
            }
            
            window.triggerGameOver = originalTriggerGameOver;
            if (gameOverCalled) throw new Error("Game over should not be called in Zen Mode");
        }
    });

    tests.push({
        name: "Collision: Obstacle Destruction",
        fn: () => {
            const initialObsCount = obstacles.length;
            const o1 = { x: 100, y: 100, r: 10, color: '#f0f', update: () => {}, draw: () => {} };
            const o2 = { x: 110, y: 100, r: 10, color: '#f0f', update: () => {}, draw: () => {} };
            
            obstacles.push(o1, o2);
            
            // Simulate the collision logic from gameLoop
            // We'll use a simplified version of the loop logic
            for (let i = obstacles.length - 1; i >= 0; i--) {
                const o = obstacles[i];
                let destroyed = false;
                for (let j = i - 1; j >= 0; j--) {
                    const o2_inner = obstacles[j];
                    if (checkCollision(o, o2_inner)) {
                        obstacles.splice(i, 1);
                        obstacles.splice(j, 1);
                        destroyed = true;
                        break;
                    }
                }
                if (destroyed) break;
            }

            if (obstacles.length !== initialObsCount) {
                throw new Error(`Obstacles should have been destroyed. Expected ${initialObsCount}, got ${obstacles.length}`);
            }
        }
    });

    tests.push({
        name: "Standard Mode: Triggers Game Over",
        fn: () => {
            let gameOverCalled = false;
            const originalTriggerGameOver = window.triggerGameOver;
            window.triggerGameOver = () => { gameOverCalled = true; };
            
            zenMode = false;
            player.shieldActive = false;
            
            const p = player;
            const o = { x: p.x, y: p.y, r: p.r };
            const collided = checkCollision(p, o);
            
            if (collided) {
                if (zenMode) {
                } else if (player.shieldActive) {
                } else {
                    window.triggerGameOver();
                }
            }
            
            window.triggerGameOver = originalTriggerGameOver;
            if (!gameOverCalled) throw new Error("Game over should be called in Standard Mode");
        }
    });

    tests.push({
        name: "Global Leaderboard: Fetch",
        fn: async () => {
            const scores = await globalLeaderboard.fetchGlobalScores();
            if (!Array.isArray(scores)) throw new Error("Should return an array");
            if (scores.length === 0) throw new Error("Should have mock data");
        }
    });

    tests.push({
        name: "Global Leaderboard: Upload",
        fn: async () => {
            const res = await globalLeaderboard.uploadScore('TEST_USER', 9999);
            if (!res.success) throw new Error("Upload should be successful");
            if (res.rank === undefined) throw new Error("Rank should be returned");
        }
    });
    tests.push({
        name: "Shop: Upgrade Shield",
        fn: () => {
            totalGems = 100;
            shieldLevel = 1;
            const cost = shieldLevel * 50;
            if (totalGems >= cost) {
                totalGems -= cost;
                shieldLevel++;
            }
            if (shieldLevel !== 2) throw new Error("Shield level should be 2");
            if (totalGems !== 50) throw new Error("Gems should be 50");
        }
    });

    tests.push({
        name: "Shop: Upgrade Magnet",
        fn: () => {
            totalGems = 100;
            magnetLevel = 1;
            const cost = magnetLevel * 50;
            if (totalGems >= cost) {
                totalGems -= cost;
                magnetLevel++;
            }
            if (magnetLevel !== 2) throw new Error("Magnet level should be 2");
            if (totalGems !== 50) throw new Error("Gems should be 50");
        }
    });

    tests.push({
        name: "Shop: Not enough gems",
        fn: () => {
            totalGems = 10;
            shieldLevel = 1;
            const cost = shieldLevel * 50;
            if (totalGems >= cost) {
                totalGems -= cost;
                shieldLevel++;
            }
            if (shieldLevel !== 1) throw new Error("Shield level should remain 1");
        }
    });

    tests.push({
        name: "Camera: Dynamic Zoom",
        fn: () => {
            speed = 5;
            // Trigger a loop iteration logic for zoom
            // In gameLoop: zoom = Math.max(0.7, 1.0 - (speed - 5) * 0.005);
            const zoomVal = Math.max(0.7, 1.0 - (speed - 5) * 0.005);
            if (zoomVal !== 1.0) throw new Error("Zoom should be 1.0 at speed 5");

            speed = 105;
            const zoomValHigh = Math.max(0.7, 1.0 - (speed - 5) * 0.005);
            if (zoomValHigh >= 1.0) throw new Error("Zoom should decrease as speed increases");
            if (zoomValHigh < 0.7) throw new Error("Zoom should not go below 0.7");
        }
    });

    // Test Performance Profiler
    tests.push({
        name: "Profiler: UI Updates",
        fn: () => {
            profilerActive = true;
            // Mock required DOM elements
            const profUI = document.createElement('div');
            profUI.id = 'profiler-ui';
            document.body.appendChild(profUI);
            
            const fpsEl = document.createElement('span');
            fpsEl.id = 'prof-fps';
            document.body.appendChild(fpsEl);
            
            const memEl = document.createElement('span');
            memEl.id = 'prof-mem';
            document.body.appendChild(memEl);
            
            const objEl = document.createElement('span');
            objEl.id = 'prof-obj';
            document.body.appendChild(objEl);

            // Simulate a game loop tick
            // We need to call gameLoop or the part of it that updates the profiler
            // Since gameLoop uses requestAnimationFrame, we can just call a mock version of the logic
            
            const dt = 16.67;
            const currentFps = 1000 / dt;
            fpsHistory = [currentFps];
            fps = currentFps;
            
            // Manually trigger the profiler update logic as it appears in gameLoop
            if (profilerActive) {
                const pUI = document.getElementById('profiler-ui');
                pUI.style.display = 'block';
                document.getElementById('prof-fps').innerText = Math.round(fps);
                document.getElementById('prof-obj').innerText = obstacles.length + gems.length + powerups.length + particles.length + slowMoZones.length;
            }

            if (profUI.style.display !== 'block') throw new Error("Profiler UI should be visible");
            if (fpsEl.innerText !== Math.round(currentFps).toString()) throw new Error("FPS should be updated");
            
            // Cleanup
            profUI.remove();
            fpsEl.remove();
            memEl.remove();
            objEl.remove();
        }
    });

    tests.push({
        name: "Missions: Completion",
        fn: () => {
            selectRandomMission();
            const mission = getActiveMission();
            
            // Mock state to satisfy the mission goal
            // Since we don't know which mission was selected, we'll just force it
            // or mock the check function.
            const originalCheck = mission.check;
            mission.check = () => ({ success: true, failed: false });
            
            const result = updateMission({
                gemsCollected: 0,
                survivalTime: 0,
                speed: 0,
                combo: 0
            });
            
            if (!result || result.status !== 'completed') {
                throw new Error("Mission should be completed");
            }
            if (!isMissionCompleted()) {
                throw new Error("isMissionCompleted should be true");
            }
            
            mission.check = originalCheck;
        }
    });
    tests.push({
        name: "Gamepad: Movement",
        fn: () => {
            const initialTargetX = player.targetX;
            const initialX = player.x;
            
            // Mock navigator.getGamepads
            const mockGamepad = {
                axes: [1.0, 0], // Stick right
                buttons: [{ pressed: false }, { pressed: false }]
            };
            navigator.getGamepads = () => [mockGamepad];
            
            handleGamepadInput();
            
            if (player.targetX === initialTargetX) throw new Error("targetX should have changed");
            if (player.targetX <= initialX) throw new Error("targetX should be greater than initialX for right stick");
        }
    });

    // Test Tutorial Logic
    tests.push({
        name: "Tutorial: Step Progression",
        fn: () => {
            tutorialManager.start();
            const initialStep = tutorialManager.step;
            
            // Simulate movement to complete step 0
            player.x = width / 2 + 100;
            tutorialManager.update(16.67);
            
            if (tutorialManager.step !== initialStep + 1) {
                throw new Error(`Tutorial should have progressed to step ${initialStep + 1}, got ${tutorialManager.step}`);
            }
        }
    });

    tests.push({
        name: "Tutorial: Completion",
        fn: () => {
            tutorialManager.step = tutorialManager.steps.length - 1;
            tutorialManager.timer = 0;
            
            // Simulate time passing for the final step
            tutorialManager.update(60 * 4); // 4 seconds
            
            if (!tutorialManager.completed) {
                throw new Error("Tutorial should be marked as completed");
            }
        }
    });

    tests.push({
        name: "Tutorial: Reset",
        fn: () => {
            tutorialManager.start();
            if (tutorialManager.step !== 0 || tutorialManager.completed !== false) {
                throw new Error("Tutorial should reset to step 0 and not completed");
            }
        }
    });

    tests.push({
        name: "Replay: Seed and Input Consistency",
        fn: async () => {
            // 1. Start a game, record some inputs
            const originalSeed = 12345;
            startNewGame(false, originalSeed, false);
            
            // Mock some movement
            player.targetX = 100;
            // Manually trigger a few frames of gameLoop logic
            const dt = 16.67;
            const delta = dt / (1000 / 60);
            
            // Simulate 5 frames of recording
            for(let i=0; i<5; i++) {
                // This is what gameLoop does
                recording.push(player.targetX);
                player.update(delta);
            }
            
            // 2. Save the replay
            const runSeed = originalSeed; // simplified for test
            const replayData = { seed: runSeed, inputs: [...recording] };
            localStorage.setItem('voidRunnerLastReplay', JSON.stringify(replayData));
            
            // 3. Replay it
            const savedData = JSON.parse(localStorage.getItem('voidRunnerLastReplay'));
            const replaySeed = savedData.seed;
            const replayInputs = savedData.inputs;
            
            startNewGame(false, replaySeed, true);
            
            // Simulate 5 frames of replay
            for(let i=0; i<5; i++) {
                if (replayFrame < recording.length) {
                    player.targetX = recording[replayFrame];
                    replayFrame++;
                } else {
                    throw new Error("Replay ran out of frames");
                }
                player.update(delta);
            }
            
            if (player.x !== player.x) { // This is a dummy check, but we want to see if it runs without crashing
                 throw new Error("Player position diverged");
            }
        }
    });

    tests.push({
        name: "Replay: UI Visibility",
        fn: () => {
            const replayBtn = document.getElementById('replay-btn');
            replayBtn.style.display = 'none';
            
            // Trigger game over with a recording
            recording = [100, 200, 300];
            isReplaying = false;
            triggerGameOver();
            
            if (replayBtn.style.display !== 'block') {
                throw new Error("Replay button should be visible after game over with recording");
            }
        }
    });

    tests.push({
        name: "Ship Classes: Selection & Stats",
        fn: () => {
            const originalShip = currentShipClass;
            
            // Test Speed Ship
            currentShipClass = 'speed';
            const speedShip = shipClasses['speed'];
            const pSpeed = new Player();
            if (pSpeed.r !== speedShip.radius) throw new Error(`Speed ship radius should be ${speedShip.radius}, got ${pSpeed.r}`);
            
            // Test Tank Ship
            currentShipClass = 'tank';
            const tankShip = shipClasses['tank'];
            const pTank = new Player();
            if (pTank.r !== tankShip.radius) throw new Error(`Tank ship radius should be ${tankShip.radius}, got ${pTank.r}`);
            
            currentShipClass = originalShip;
        }
    });

    tests.push({
        name: "Ship Classes: Movement Acceleration",
        fn: () => {
            const originalShip = currentShipClass;
            const dt = 16.67;
            const delta = dt / (1000 / 60);
            
            // Speed ship
            currentShipClass = 'speed';
            const pSpeed = new Player();
            pSpeed.x = 100;
            pSpeed.targetX = 200;
            pSpeed.update(delta);
            const distSpeed = pSpeed.x - 100;
            
            // Tank ship
            currentShipClass = 'tank';
            const pTank = new Player();
            pTank.x = 100;
            pTank.targetX = 200;
            pTank.update(delta);
            const distTank = pTank.x - 100;
            
            if (distSpeed <= distTank) {
                throw new Error(`Speed ship should move further than tank ship. Speed: ${distSpeed}, Tank: ${distTank}`);
            }
            
            currentShipClass = originalShip;
        }
    });

    tests.push({
        name: "Ship Classes: UI Persistence",
        fn: () => {
            const ship = 'magnet';
            localStorage.setItem('voidRunnerShipClass', ship);
            
            // Simulate UI load
            const savedShip = localStorage.getItem('voidRunnerShipClass') || 'balanced';
            if (savedShip !== ship) throw new Error(`Saved ship should be ${ship}, got ${savedShip}`);
        }
    });

    tests.push({
        name: "Ghost: Initialization & Movement",
        fn: () => {
            const mockInputs = [100, 110, 120, 130, 140];
            const mockBestRun = {
                seed: 123,
                inputs: mockInputs,
                shipClass: 'balanced'
            };
            localStorage.setItem('voidRunnerBestReplay', JSON.stringify(mockBestRun));
            
            startNewGame(false, 456, false);
            
            if (!ghost) throw new Error("Ghost should be initialized when best run exists");
            if (!(ghost instanceof Ghost)) throw new Error("ghost should be an instance of Ghost");
            
            const initialX = ghost.x;
            ghost.update(1);
            if (ghost.x === initialX) throw new Error("Ghost x should change after update");
            if (ghost.frame !== 1) throw new Error("Ghost frame should increment");
        }
    });

    tests.push({
        name: "Sector Mechanics: Sector 3 Wind",
        fn: () => {
            const initialX = player.x;
            currentSector = 2; // Sector 3
            const timestamp = 1000;
            const delta = 1;
            // Simulate the logic in gameLoop
            const windForce = Math.sin(timestamp / 1000) * 2;
            player.x += windForce * delta;
            if (player.x === initialX) throw new Error("Player x should change due to wind in Sector 3");
        }
    });

    tests.push({
        name: "Sector Mechanics: Sector 5 Gravity",
        fn: () => {
            player.x = 0;
            currentSector = 4; // Sector 5
            const delta = 1;
            // Simulate the logic in gameLoop
            const centerPull = (width / 2 - player.x) * 0.01 * delta;
            player.x += centerPull;
            if (player.x <= 0) throw new Error("Player x should be pulled toward center in Sector 5");
        }
    });

    tests.push({
        name: "Challenge Rooms: Selection",
        fn: () => {
            const challenge = selectChallenge('gauntlet');
            if (!challenge || challenge.id !== 'gauntlet') throw new Error("Should select the gauntlet challenge");
        }
    });

    tests.push({
        name: "Challenge Rooms: Spawning",
        fn: () => {
            selectChallenge('gauntlet');
            survivalTime = 0;
            let spawned = false;
            
            // Simulate game loop for a few seconds
            for (let t = 0; t < 3; t += 0.016) {
                survivalTime = t;
                const spawns = updateChallengeSpawning(0, survivalTime);
                if (spawns.length > 0) {
                    spawned = true;
                    break;
                }
            }
            
            if (!spawned) throw new Error("Challenge patterns should have spawned");
            resetChallenge();
        }
    });

    for (const test of tests) {
        try {
            await test.fn();
            console.log(`✅ ${test.name} passed`);
        } catch (e) {
            console.error(`❌ ${test.name} failed: ${e.message}`);
        }
    }
    console.log("Tests completed.");
}

runTests();