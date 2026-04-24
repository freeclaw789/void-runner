class AchievementsManager {
    constructor() {
        this.achievements = {
            'survive_100': { name: 'Centurion', desc: 'Survive 100 points', condition: (s, g) => s >= 100, unlocked: false },
            'survive_500': { name: 'Void Walker', desc: 'Survive 500 points', condition: (s, g) => s >= 500, unlocked: false },
            'survive_1000': { name: 'Void Lord', desc: 'Survive 1000 points', condition: (s, g) => s >= 1000, unlocked: false },
            'collect_50': { name: 'Gem Hoarder', desc: 'Collect 50 gems', condition: (s, g) => g >= 50, unlocked: false },
            'collect_100': { name: 'Gem Master', desc: 'Collect 100 gems', condition: (s, g) => g >= 100, unlocked: false },
            'boss_slayer': { name: 'Titan Fall', desc: 'Reach the first boss (250 pts)', condition: (s, g) => s >= 250, unlocked: false },
        };
        this.load();
    }

    check(score, gems) {
        let newlyUnlocked = [];
        for (let id in this.achievements) {
            const a = this.achievements[id];
            if (!a.unlocked && a.condition(score, gems)) {
                a.unlocked = true;
                newlyUnlocked.push(a);
                this.save();
            }
        }
        return newlyUnlocked;
    }

    save() {
        const unlocked = Object.keys(this.achievements).filter(id => this.achievements[id].unlocked);
        localStorage.setItem('voidRunnerAchievements', JSON.stringify(unlocked));
    }

    load() {
        const unlocked = JSON.parse(localStorage.getItem('voidRunnerAchievements') || '[]');
        unlocked.forEach(id => {
            if (this.achievements[id]) this.achievements[id].unlocked = true;
        });
    }

    getUnlocked() {
        return Object.values(this.achievements).filter(a => a.unlocked);
    }
}