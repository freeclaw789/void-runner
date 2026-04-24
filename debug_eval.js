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

// Execute game.js line by line to find the crash
const lines = gameJs.split('\n');
let currentCode = '';

try {
    for (let i = 0; i < lines.length; i++) {
        currentCode += lines[i] + '\n';
        window.eval(currentCode);
    }
    console.log("✅ All lines executed successfully");
} catch (e) {
    console.error(`❌ Crash at line ${lines.length}:`);
    console.error(e);
    // This is a bit naive because of multi-line statements, but it helps find the area
    process.exit(1);
}
