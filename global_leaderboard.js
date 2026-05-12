class GlobalLeaderboard {
    constructor() {
        this.apiEndpoint = 'https://api.voidrunner.mock/leaderboard';
        this.mockData = [
            { name: 'VOID_MASTER', score: 5000 },
            { name: 'NEON_GHOST', score: 4200 },
            { name: 'CYBER_PUNK', score: 3500 },
            { name: 'NULL_POINTER', score: 2800 },
            { name: 'BIT_CRUSHER', score: 2100 },
        ];
    }

    async fetchGlobalScores() {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Simulate a successful response
        return [...this.mockData].sort((a, b) => b.score - a.score).slice(0, 10);
    }

    async uploadScore(name, score) {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Simulate adding to mock data (in-memory for this session)
        this.mockData.push({ name, score });
        this.mockData.sort((a, b) => b.score - a.score);
        
        return { success: true, rank: this.mockData.findIndex(i => i.name === name && i.score === score) + 1 };
    }
}

const globalLeaderboard = new GlobalLeaderboard();