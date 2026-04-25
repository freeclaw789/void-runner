# BACKLOG - Improvements

## Context & Efficiency
- [x] Modularize Game Architecture (Split `game.js` into `player.js`, `enemies.js`, `ui.js`, `main.js`)
- [ ] Implement Strategic Memory Management (Summarize lessons to `MEMORY.md` and purge raw logs)
- [ ] Adopt Atomic Tasking for very large features (Break down complex goals into smaller sub-tasks)
- [ ] Enforce Pre-Flight Validation (Mandatory `verify_syntax.sh` and test run before every push)
- [ ] Optimize Cron Job Workflow (Process one backlog item per run to avoid iteration limits)

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

## Gameplay Evolution
- [x] Implement 'Obstacle Waves' (structured patterns instead of random spawning)
- [x] Add 'Boss Encounters' (large obstacles with health/weak points every 250 points)
- [x] Implement 'Player Experience/Leveling' (gems increase level, improving magnet range)
- [x] Add 'Screen Shake' on near-misses for visceral feel
- [x] Create 'Unlockable Skins' (change player color/shape based on high score)
- [x] Implement 'Dynamic Background' (background colors shift smoothly based on score)
- [x] Add 'Combo Multiplier' (collecting gems in quick succession multiplies points)

## Stability & Testing
- [x] Implement automated syntax validation in pre-commit hook
- [x] Expand `tests.js` to include DOM integration tests (Verify buttons trigger state changes)
- [x] Create a 'Smoke Test' suite for the critical path (Menu -> Start -> Game Loop -> Game Over)
- [x] Implement a headless browser test (e.g., Playwright/Puppeteer) to detect blank screens/rendering crashes
- [x] Add regression tests for the 'How to Play' and 'Start' button functionality
- [x] Implement E2E Input tests (Verify mouse/touch moves the player)
- [x] Implement E2E Collision tests (Simulate hit -> Verify Game Over)
- [x] Implement E2E Scoring tests (Simulate gem collection -> Verify score increase)
- [x] Implement Persistence tests (Verify localStorage high score save/load)
- [x] Establish "Test-First" protocol: All new features must include a `tests.js` update
- [x] Implement Error Boundary in Game Loop (Prevent single-object crashes from blanking the screen)
- [x] Create Health Check utility for critical game objects (Verify initialization of Player, Sound, Background)
- [x] Integrate `tests.js` into a CI-like check for every push every push

## Future Horizons
- [x] Implement 'Safe Mode' that disables complex effects if FPS drops below 30
- [x] Add a 'Game Over' animation (e.g., player ship shattering)
- [x] Implement 'Difficulty Scaling' (increase speed/obstacle density based on score)
- [x] Add 'Portal Obstacles' that teleport the player to a different X position
- [x] Add a 'Pulse' effect to the background when a boss appears
- [x] Implement a 'Memory Leak' check for particle systems to ensure proper cleanup
- [x] Implement 'Achievements' (e.g., "Survive 100 points", "Collect 50 gems")
- [x] Improve the 'Main Menu' to 'Game Start' transition with a fade effect
- [x] Add a 'Short-range Dash' player ability
- [x] Implement a 'Stress Test' mode that spawns 10x obstacles to check performance limits

## Phase: Polish & Expansion
- [x] Implement a "Pause" menu (Esc key or button)
- [x] Add "Environmental Hazards" (e.g., solar flares that temporarily obscure vision)
- [x] Implement "Dynamic Music" (intensity increases with score/speed)
- [x] Add "Player Customization" (choose starting ship colors)
- [x] Implement "Daily Challenges" (fixed obstacle patterns for all players)
- [x] Add "Screen Wrap" power-up (allow player to cross screen edges)
- [x] Implement "Advanced Particle Effects" (blooms, trails for obstacles)
- [x] Add "Sector-Specific Obstacles" (unique patterns for each of the 5 sectors)
- [x] Implement "Frame-Independent Movement" (ensure game speed is consistent across different refresh rates)
- [x] Create a "Settings" menu for volume and visual quality (Safe Mode toggle)

## Phase: Expansion & Polish
- [x] Implement visual shield effect and timer decay for Shield power-up
- [x] Implement "Sine-wave" obstacles that move horizontally
- [x] Add toast notifications for unlocked achievements
- [x] Implement frame-rate independent movement for all game objects (use delta)
- [x] Add "Bloom" post-processing effect for neon visuals
- [x] Create sector-specific music variations (tempo/pitch shifts)
- [x] Add high-score celebration animation
- [x] Add a "Mute" toggle to the Pause menu
- [x] Implement a "Slow-motion" zone or power-up
- [x] Improve the Game Over sequence with slow-motion and screen fade

## Phase: Infinite Void
- [x] Implement "Pulsing Obstacles" (obstacles that oscillate in size)
- [x] Add "Chromatic Aberration" effect that intensifies at higher speeds
- [x] Implement a "Zen Mode" (infinite survival without death, just for relaxation)
- [x] Create a "Gem Upgrade Shop" (use total gems to increase starting shield duration or magnet range)
- [x] Add "Gamepad Support" using the Gamepad API for better accessibility
- [x] Implement "Dynamic Camera Zoom" (camera pulls back slightly as speed increases)
- [x] Add "Advanced Audio Settings" (separate sliders for Music, SFX, and Master volume)
- [x] Create "Shareable Score Cards" (generate a text/image summary of the run to copy to clipboard)
- [x] Implement "Sector-Specific Background Music" (each sector has its own unique loop)
- [x] Add "Performance Profiler" (internal tool to monitor FPS and memory leaks during extended sessions)

## Phase: Eternal Void
- [x] Implement "Daily Seeded Runs" (everyone plays the same obstacle pattern for a day)
- [x] Add "Adaptive Difficulty" (AI that adjusts obstacle density based on player skill in real-time)
- [x] Implement "Challenge Missions" (e.g., "Survive 30 seconds without collecting gems")
- [x] Add "Visual Themes" (switch between Neon, Retro-Wireframe, and Organic styles)
- [x] Implement "Advanced Player Movement" (e.g., a 'phase' ability to pass through one obstacle)
- [x] Add "Dynamic Obstacle Interaction" (obstacles that collide and explode)
- [ ] Implement "Replay System" (record a run and play it back)
- [ ] Add "Tutorial Levels" (short, guided segments to teach mechanics)
- [ ] Implement "Global Leaderboard" (Mock API integration for worldwide rankings)
- [x] Add "End-of-Run Statistics" (Detailed breakdown: distance, gems collected, near-misses, etc.)

**Backlog Maintenance Rule:**
If the backlog ever empties, the next backlog item is to generate 10 more items for the backlog. This can include new game features, polish for existing features, other game improvements, performance improvements, stability improvements, or tests and ops improvements. Or anything else to push the game forward.