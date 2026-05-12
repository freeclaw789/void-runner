const challengeRooms = [
    {
        id: 'gauntlet',
        name: 'The Gauntlet',
        description: 'A narrow corridor of death',
        duration: 30, // seconds
        patterns: [
            { time: 0, type: 'wall', x: 0, w: 200 },
            { time: 2, type: 'wall', x: width - 200, w: 200 },
            { time: 4, type: 'wall', x: 0, w: 200 },
            { time: 6, type: 'wall', x: width - 200, w: 200 },
            { time: 8, type: 'pillar', x: width / 2, r: 50 },
            { time: 10, type: 'wall', x: 0, w: 100 },
            { time: 10.5, type: 'wall', x: width - 100, w: 100 },
        ]
    },
    {
        id: 'symmetry',
        name: 'Symmetry',
        description: 'Perfect balance, perfect chaos',
        duration: 30,
        patterns: [
            { time: 0, type: 'pair', xOffset: 100, r: 30 },
            { time: 2, type: 'pair', xOffset: 200, r: 30 },
            { time: 4, type: 'pair', xOffset: 150, r: 40 },
            { time: 6, type: 'pair', xOffset: 250, r: 30 },
        ]
    },
    {
        id: 'zig_zag',
        name: 'Zig-Zag',
        description: 'Don\'t get caught in the rhythm',
        duration: 30,
        patterns: [
            { time: 0, type: 'zig', x: 100 },
            { time: 1, type: 'zig', x: width - 100 },
            { time: 2, type: 'zig', x: 100 },
            { time: 3, type: 'zig', x: width - 100 },
        ]
    }
];

let activeChallenge = null;
let challengeTimer = 0;
let spawnedPatterns = [];

function selectChallenge(id) {
    activeChallenge = challengeRooms.find(r => r.id === id);
    spawnedPatterns = [];
    return activeChallenge;
}

function resetChallenge() {
    activeChallenge = null;
    spawnedPatterns = [];
}

function updateChallengeSpawning(timestamp, gameTime) {
    if (!activeChallenge) return [];

    const spawns = [];
    activeChallenge.patterns.forEach((p, index) => {
        if (!spawnedPatterns.includes(index) && Math.abs(p.time - gameTime) < 0.032) {
            spawns.push(p);
            spawnedPatterns.push(index);
        }
    });
    return spawns;
}
