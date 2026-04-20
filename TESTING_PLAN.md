# Testing & Stability Plan - Void Runner

## Goal
Eliminate "Blank Screen" regressions and ensure critical game paths (Start, How to Play, Game Loop) remain functional after every update.

## 1. Static Analysis & Syntax
- **Tool**: `verify_syntax.sh` (Node.js check)
- **Action**: Run before every commit to ensure no truncated files or syntax errors prevent the script from loading.

## 2. DOM & State Integration Tests
- **Tool**: `tests.js` + `test.html`
- **Focus**: 
    - Verify `Start Button` $\rightarrow$ `gameState = 'playing'`
    - Verify `How to Play Button` $\rightarrow$ `instructionsOverlay.style.display = 'block'`
    - Verify `Game Over` $\rightarrow$ `gameState = 'menu'`
- **Metric**: Test fails if the expected DOM element is not visible or the game state does not transition.

## 3. Rendering Smoke Tests
- **Action**: Implement a check in `tests.js` that verifies the canvas is actually drawing frames during the 'playing' state.
- **Detection**: If `requestAnimationFrame` is running but the canvas content remains empty/static, flag as a "Blank Screen" breakage.

## 4. Regression Suite
- Every time a bug is fixed (e.g., the Start button fix), a corresponding test case is added to `tests.js` to ensure it never breaks again.
- **Mandatory Protocol**: No feature or fix is considered "Done" until a corresponding test case is added to the regression suite.

## 5. End-to-End (E2E) Game Loop Validation
- **Input Verification**: Tests to ensure player input (touch/mouse) actually modifies the player's X-position.
- **Collision Logic**: Automated tests that simulate a collision and verify the state transitions to 'game over'.
- **Score Progression**: Verify that collecting a gem increments the score variable.
- **Persistence**: Verify that high scores are correctly read from and written to `localStorage`.

## 6. Automation (Future)
- Move from `test.html` (manual/semi-manual) to a headless environment (Playwright/Puppeteer) to allow for fully automated CI checks on GitHub Actions.