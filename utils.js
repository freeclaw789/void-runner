class SeededRandom {
    constructor(seed) {
        this.seed = seed;
    }
    next() {
        this.seed = (this.seed * 16807) % 2147483647;
        return (this.seed - 1) / 2147483646;
    }
}

let isDailyChallenge = false;
let dailyRng = null;

function random() {
    return (isDailyChallenge && dailyRng) ? dailyRng.next() : Math.random();
}

function resize(canvas) {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
}

function checkCollision(p, o) {
    const dx = p.x - o.x;
    const dy = p.y - o.y;
    return Math.sqrt(dx * dx + dy * dy) < p.r + o.r;
}