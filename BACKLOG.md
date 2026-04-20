# BACKLOG - Improvements

- [x] Add particle effects when obstacles are passed or when player dies
- [x] Add particle effects when obstacles are passed or when player dies
- [x] Implement a 'Combo' system for near-misses
- [x] Add sound effects (SFX) for start, collision, and score
- [x] Create a main menu with a high-score display
- [x] Implement 'Power-up' spawning (e.g., a shield)
- [x] Add screen shake effect on game over
- [x] Implement different obstacle types (e.g., wide beams, fast small shards)
- [x] Add a background starfield/grid for a better sense of speed
- [x] Optimize touch response for low-latency movement

## New Phase: Depth & Variety
- [x] Implement 'Score Gems' (collectible bonus points)
- [x] Add 'Slow-mo' power-up (time dilation effect)
- [x] Add 'Magnet' power-up (pulls gems toward player)
- [x] Implement 'Homing Missiles' (obstacles that track player x-position)
- [x] Create 'Sector Transitions' (change visuals/patterns every 50 points)
- [x] Add visual player trails (dynamic based on speed)
- [x] Implement 'Rotating Walls' (wide obstacles with moving gaps)
- [x] Add a Local Top 5 Leaderboard (persistence via localStorage)
- [x] Implement dynamic parallax background that reacts to speed

## Stability & Testing
- [ ] Implement automated syntax validation in pre-commit hook
- [x] Expand `tests.js` to include DOM integration tests (Verify buttons trigger state changes)
- [x] Create a 'Smoke Test' suite for the critical path (Menu -> Start -> Game Loop -> Game Over)
- [ ] Implement a headless browser test (e.g., Playwright/Puppeteer) to detect blank screens/rendering crashes
- [ ] Add regression tests for the 'How to Play' and 'Start' button functionality
- [x] Implement E2E Input tests (Verify mouse/touch moves the player)
- [x] Implement E2E Collision tests (Simulate hit -> Verify Game Over)
- [x] Implement E2E Scoring tests (Simulate gem collection -> Verify score increase)
- [x] Implement Persistence tests (Verify localStorage high score save/load)
- [ ] Establish "Test-First" protocol: All new features must include a `tests.js` update
- [x] Implement Error Boundary in Game Loop (Prevent single-object crashes from blanking the screen)
- [x] Create Health Check utility for critical game objects (Verify initialization of Player, Sound, Background)
- [ ] Integrate `tests.js` into a CI-like check for every push