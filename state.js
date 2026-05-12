// void-runner/state.js

// Game State
let gamePaused = false;
let gameActive = false;
let score = 0;
let speed = 5;
let zoom = 1.0;
let level = 1;
let gemsCollected = 0;
let survivalTime = 0;
let gemsInWindow = 0;
let lastDifficultyUpdate = 0;
let currentSector = 0;
let lastSector = 0;
let combo = 1;
let comboTimer = 0;
let runStats = { distance: 0, gems: 0, nearMisses: 0, powerups: 0 };
let boss = null;
var lastBossScore = 0;

// Entities
let obstacles = [];
let gems = [];
let powerups = [];
let slowMoZones = [];
let gravityWells = [];
let particles = [];
let recording = [];
let isReplaying = false;
let replayFrame = 0;
let currentReplaySeed = 0;
let currentReplay = null;

// Hazards
let solarFlareActive = false, solarFlareTimer = 0, solarFlareWarningTimer = 0;
let voidStormActive = false, voidStormTimer = 0, voidStormWarningTimer = 0, voidStormDirection = 0;

// System/Settings
let safeMode = false;
let zenMode = false;
let currentTheme = localStorage.getItem('voidRunnerTheme') || 'neon';

const themes = {
    neon: {
        playerDefault: '#0ff',
        obstacle: '#f0f',
        homing: '#f00',
        portal: '#00f',
        sine: '#0f0',
        pulsing: '#ff0',
        boss: '#f0f',
        bgMultiplier: 1.0,
        lineWidth: 2,
        glow: true
    },
    retro: {
        playerDefault: '#0f0',
        obstacle: '#0f0',
        homing: '#0f0',
        portal: '#0f0',
        sine: '#0f0',
        pulsing: '#0f0',
        boss: '#0f0',
        bgMultiplier: 0.3,
        lineWidth: 1,
        glow: false
    },
    organic: {
        playerDefault: '#aaffff',
        obstacle: '#ffaaee',
        homing: '#ffccaa',
        portal: '#aaeeff',
        sine: '#ccffaa',
        pulsing: '#ffffaa',
        boss: '#ff88ee',
        bgMultiplier: 0.7,
        lineWidth: 3,
        glow: true
    }
};

let profilerActive = false;
let bgPulse = 0;
let lastClickTime = 0;
let lastTime = 0;
let fpsHistory = [];
let fps = 60;

// Dimensions
let width = window.innerWidth;
let height = window.innerHeight;

// Config
const sectorConfig = [
    { bg: [10, 10, 30] },    // Deep Void
    { bg: [30, 10, 30] },    // Neon Nebula
    { bg: [10, 30, 30] },    // Cyber Grid
    { bg: [40, 40, 10] },    // Data Stream
    { bg: [20, 20, 20] }     // The Core
];

// Persistence
let highScore = localStorage.getItem('voidRunnerHighScore') || 0;
let totalGems = parseInt(localStorage.getItem('voidRunnerTotalGems')) || 0;
let shieldLevel = parseInt(localStorage.getItem('voidRunnerShieldLvl')) || 1;
let magnetLevel = parseInt(localStorage.getItem('voidRunnerMagnetLvl')) || 1;
let currentShipClass = localStorage.getItem('voidRunnerShipClass') || 'balanced';

const shipClasses = {
    balanced: { name: 'Balanced', accel: 0.2, radius: 15, magnetMod: 1.0, shieldMod: 1.0, color: '#0ff' },
    speed: { name: 'Speed', accel: 0.35, radius: 12, magnetMod: 0.8, shieldMod: 0.8, color: '#ff0' },
    tank: { name: 'Tank', accel: 0.1, radius: 20, magnetMod: 0.9, shieldMod: 1.5, color: '#f0f' },
    magnet: { name: 'Magnet', accel: 0.15, radius: 15, magnetMod: 1.5, shieldMod: 0.9, color: '#0f0' }
};

// Global Objects
let player = null;
let sound = null;
let music = null;
let achievements = null;
let background = null;