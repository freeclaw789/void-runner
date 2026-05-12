class TutorialManager {
    constructor() {
        this.step = 0;
        this.completed = false;
        this.objectiveMet = false;
        this.tutorialActive = false;
        this.timer = 0;
        this.steps = [
            {
                text: "MOVE YOUR SHIP WITH MOUSE OR TOUCH",
                check: () => Math.abs(player.x - width / 2) > 50,
                onStart: () => {}
            },
            {
                text: "AVOID THE VOID OBSTACLES!",
                check: () => {
                    // Check if all spawned obstacles have passed the player
                    return obstacles.length === 0 && this.timer > 2;
                },
                onStart: () => {
                    this.spawnTutorialObstacle();
                }
            },
            {
                text: "COLLECT DATA GEMS FOR POINTS",
                check: () => gemsCollected > 0,
                onStart: () => {
                    this.spawnTutorialGem();
                }
            },
            {
                text: "DASH TO MOVE QUICKLY!",
                check: () => player.dashActive,
                onStart: () => {}
            },
            {
                text: "CONGRATS! YOU ARE READY FOR THE VOID.",
                check: () => this.timer > 3,
                onStart: () => {}
            }
        ];
    }

    start() {
        this.tutorialActive = true;
        this.step = 0;
        this.completed = false;
        this.timer = 0;
        gemsCollected = 0;
        score = 0;
        obstacles = [];
        gems = [];
        powerups = [];
        player.x = width / 2;
        player.targetX = width / 2;
        this.initStep();
        showToast('TUTORIAL', 'Welcome, Runner.');
    }

    initStep() {
        const step = this.steps[this.step];
        missionEl.innerText = `TUTORIAL: ${step.text}`;
        missionEl.style.color = '#0ff';
        step.onStart();
    }

    update(dt) {
        this.timer += dt / 60;
        const step = this.steps[this.step];

        if (step.check()) {
            this.step++;
            if (this.step >= this.steps.length) {
                this.complete();
            } else {
                this.initStep();
            }
        }
    }

    complete() {
        this.tutorialActive = false;
        this.completed = true;
        missionEl.innerText = '';
        showToast('TUTORIAL', 'Tutorial Complete!');
        setTimeout(() => {
            gameActive = false;
            mainMenuEl.style.display = 'flex';
            uiEl.style.display = 'none';
        }, 2000);
    }

    spawnTutorialObstacle() {
        const o = new Obstacle();
        o.x = player.x;
        o.y = -50;
        o.r = 30;
        obstacles.push(o);
    }

    spawnTutorialGem() {
        const g = new Gem();
        g.x = player.x + 50;
        g.y = -50;
        gems.push(g);
    }
}

const tutorialManager = new TutorialManager();