// Reward pacing and difficulty curves
export const rewardPacing = {
  // XP requirements for each level
  xpForLevel: (level) => {
    return Math.floor(100 * Math.pow(1.15, level - 1));
  },

  // Currency rewards based on activity
  currencyRewards: {
    questComplete: (difficulty) => {
      const base = { daily: 50, weekly: 200, special: 500 };
      return base[difficulty] || 50;
    },
    bossDefeat: (difficulty) => {
      const base = { normal: 200, hard: 500, nightmare: 1000, impossible: 2000 };
      return base[difficulty] || 200;
    },
    streakMilestone: (days) => {
      if (days >= 30) return 500;
      if (days >= 14) return 200;
      if (days >= 7) return 100;
      if (days >= 3) return 50;
      return 20;
    },
    studySession: (minutes) => {
      return Math.floor(minutes * 2);
    },
  },

  // Evolution points needed for next stage
  evolutionPointsForStage: (stage) => {
    return Math.floor(50 * Math.pow(1.3, stage - 1));
  },

  // Quest difficulty scaling
  questDifficulty: {
    daily: {
      studyMinutes: (level) => Math.min(30 + level * 2, 60),
      tasksToComplete: (level) => Math.min(3 + Math.floor(level / 3), 10),
      questsToComplete: (level) => Math.min(2 + Math.floor(level / 5), 5),
    },
    weekly: {
      studyMinutes: (level) => Math.min(120 + level * 10, 300),
      tasksToComplete: (level) => Math.min(15 + level, 50),
      bossesToDefeat: (level) => Math.min(1 + Math.floor(level / 10), 3),
    },
  },

  // Boss difficulty scaling
  bossDifficulty: {
    normal: { hp: 100, xpReward: 200, currencyReward: 200 },
    hard: { hp: 250, xpReward: 500, currencyReward: 500 },
    nightmare: { hp: 500, xpReward: 1000, currencyReward: 1000 },
    impossible: { hp: 1000, xpReward: 2500, currencyReward: 2000 },
  },

  // Daily reward scaling
  dailyRewards: (streak) => {
    const baseXp = 50;
    const baseCurrency = 30;
    const multiplier = 1 + (streak * 0.1);
    
    return {
      xp: Math.floor(baseXp * multiplier),
      currency: Math.floor(baseCurrency * multiplier),
    };
  },
};