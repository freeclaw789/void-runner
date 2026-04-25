const missions = [
    {
        id: 'pacifist',
        name: 'Pacifist',
        description: 'Survive 30 seconds without collecting any gems',
        goal: 30,
        check: (state) => {
            if (state.gemsCollected > 0) return { success: false, failed: true };
            return { success: state.survivalTime >= 30, failed: false };
        }
    },
    {
        id: 'collector',
        name: 'Collector',
        description: 'Collect 20 gems in a single run',
        goal: 20,
        check: (state) => {
            return { success: state.gemsCollected >= 20, failed: false };
        }
    },
    {
        id: 'speed_demon',
        name: 'Speed Demon',
        description: 'Reach a speed of 15',
        goal: 15,
        check: (state) => {
            return { success: state.speed >= 15, failed: false };
        }
    },
    {
        id: 'survivor',
        name: 'Survivor',
        description: 'Survive for 60 seconds',
        goal: 60,
        check: (state) => {
            return { success: state.survivalTime >= 60, failed: false };
        }
    },
    {
        id: 'combo_king',
        name: 'Combo King',
        description: 'Reach a combo of 10',
        goal: 10,
        check: (state) => {
            return { success: state.combo >= 10, failed: false };
        }
    }
];

let activeMission = null;
let missionCompleted = false;

function selectRandomMission() {
    const idx = Math.floor(Math.random() * missions.length);
    activeMission = missions[idx];
    missionCompleted = false;
    return activeMission;
}

function updateMission(state) {
    if (!activeMission || missionCompleted) return null;

    const result = activeMission.check(state);
    if (result.success) {
        missionCompleted = true;
        return { status: 'completed', mission: activeMission };
    } else if (result.failed) {
        activeMission = null;
        return { status: 'failed', mission: activeMission };
    }
    return null;
}

function getActiveMission() {
    return activeMission;
}

function isMissionCompleted() {
    return missionCompleted;
}
