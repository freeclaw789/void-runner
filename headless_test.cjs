const { JSDOM } = require('jsdom');
const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const gameJs = fs.readFileSync(path.join(__dirname, 'game.js'), 'utf8');

const dom = new JSDOM(html, {
    runScripts: "dangerously",
    resources: "usable"
});

const { window } = dom;
const { document } = window;

// Mock Canvas
const canvasMock = {
    getContext: () => ({
        fillRect: () => {},
        beginPath: () => {},
        arc: () => {},
        fill: () => {},
        stroke: () => {},
        closePath: () => {},
        moveTo: () => {},
        lineTo: () => {},
        setTransform: () => {},
        fillText: () => {},
        measureText: () => ({ width: 0 }),
        clearRect: () => {},
    }),
    width: 0,
    height: 0,
};

window.HTMLCanvasElement.prototype.getContext = function() { return canvasMock.getContext(); };

// Mock localStorage
const localStorageMock = (() => {
    let store = {};
    return {
        getItem: (key) => store[key] || null,
        setItem: (key, value) => { store[key] = value.toString(); },
        removeItem: (key) => { delete store[key]; },
        clear: () => { store = {}; },
        length: 0,
        key: (index) => Object.keys(store)[index]
    };
})();
window.localStorage = localStorageMock;


// Mock AudioContext
window.AudioContext = class {
    constructor() { this.state = 'running'; }
    resume() { return Promise.resolve(); }
    createOscillator() { return { connect: () => {}, start: () => {}, stop: () => {}, frequency: { setValueAtTime: () => {}, exponentialRampToValueAtTime: () => {} } }; }
    createGain() { return { connect: () => {}, gain: { setValueAtTime: () => {}, exponentialRampToValueAtTime: () => {} } }; }
    destination = {};
    currentTime = 0;
};
window.webkitAudioContext = window.AudioContext;

window.requestAnimationFrame = (callback) => setTimeout(callback, 16);
window.innerWidth = 800;
window.innerHeight = 600;

// Mock addEventListener to avoid DOMException with { passive: false }
const originalAddEventListener = window.addEventListener;
window.addEventListener = function(type, listener, options) {
    if (options && options.passive === false) {
        // Just ignore passive: false in jsdom
        return originalAddEventListener.call(this, type, listener);
    }
    return originalAddEventListener.call(this, type, listener, options);
};

// Make DOM globals available for eval
global.window = window;
global.document = document;
global.localStorage = localStorageMock;
global.AudioContext = window.AudioContext;
global.webkitAudioContext = window.webkitAudioContext;
global.requestAnimationFrame = window.requestAnimationFrame;

// Execute game.js via script tag to ensure top-level 'var' declarations
// become properties of the window object (simulating browser behavior).
try {
    const script = document.createElement('script');
    script.textContent = gameJs;
    document.body.appendChild(script);
    console.log("✅ game.js injected via script tag");
} catch (e) {
    console.error("❌ Error injecting game.js:", e);
    process.exit(1);
}

async function test() {
    console.log("🚀 Running Headless Stability Test...");
    
    try {
        if (!window.player) throw new Error("Player not initialized");
        console.log("✅ Player initialized");

        await new Promise(r => setTimeout(r, 100));
        console.log("✅ Game loop started without crashing");

        // Simulate Start
        const startBtn = document.getElementById('start-btn');
        if (startBtn) {
            startBtn.click();
        } else {
            window.dispatchEvent(new window.Event('mousedown'));
        }

        await new Promise(r => setTimeout(r, 50));

        if (!window.gameActive) {
             window.dispatchEvent(new window.Event('mousedown'));
             await new Promise(r => setTimeout(r, 50));
        }

        if (!window.gameActive) throw new Error("Game failed to activate");
        console.log("✅ Game activated");

        await new Promise(r => setTimeout(r, 200));
        console.log("✅ Game loop continuing after start");

        console.log("\n✨ Headless Stability Test PASSED");
        process.exit(0);
    } catch (e) {
        console.error("\n❌ Headless Stability Test FAILED");
        console.error(e);
        process.exit(1);
    }
}

test();