// void-runner/state.js

// Game State
let gamePaused = false;
let gameActive = false;
let score = 0;
let speed = 5;
let zoom = 1.0;
let level = 1;
let gemsCollected = 0;
let gemsInWindow = 0;
let lastDifficultyUpdate = 0;
let currentSector = 0;
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
let particles = [];

// Hazards
let solarFlareActive = false, solarFlareTimer = 0, solarFlareWarningTimer = 0;
let voidStormActive = false, voidStormTimer = 0, voidStormWarningTimer = 0, voidStormDirection = 0;

// System/Settings
let safeMode = false;
let zenMode = false;
let profilerActive = false;
let stressMode = false;
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

// Global Objects
let player = null;
let sound = null;
let music = null;
let achievements = null;
let background = null;