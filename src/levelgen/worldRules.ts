import type { WorldRuleset } from '../types/levelgen';

const WORLD_RULES: Record<number, WorldRuleset> = {
  1: {
    theme: 'grass',
    groundVariance: 1,
    gapFrequency: 0.09,
    enemyDensity: 0.35,
    projectileCadenceMs: 2300,
    movingPlatformFrequency: 0.08,
    checkpointSpacingChunks: 3,
    coinDensity: 0.55,
    starTarget: 3,
    palette: { skyTop: 0x6ec6ff, skyBottom: 0xb3ecff, accent: 0x5cb85c },
    audio: { tempo: 120, scale: [0, 2, 4, 7, 9] }
  },
  2: {
    theme: 'desert',
    groundVariance: 2,
    gapFrequency: 0.14,
    enemyDensity: 0.45,
    projectileCadenceMs: 1900,
    movingPlatformFrequency: 0.13,
    checkpointSpacingChunks: 3,
    coinDensity: 0.5,
    starTarget: 3,
    palette: { skyTop: 0xf9d976, skyBottom: 0xf39f86, accent: 0xc97d10 },
    audio: { tempo: 126, scale: [0, 2, 3, 7, 10] }
  },
  3: {
    theme: 'ice',
    groundVariance: 2,
    gapFrequency: 0.17,
    enemyDensity: 0.52,
    projectileCadenceMs: 1750,
    movingPlatformFrequency: 0.17,
    checkpointSpacingChunks: 2,
    coinDensity: 0.56,
    starTarget: 3,
    palette: { skyTop: 0x89cff0, skyBottom: 0xe0f7ff, accent: 0x55c0f9 },
    audio: { tempo: 132, scale: [0, 2, 5, 7, 9] }
  },
  4: {
    theme: 'factory',
    groundVariance: 2,
    gapFrequency: 0.2,
    enemyDensity: 0.6,
    projectileCadenceMs: 1600,
    movingPlatformFrequency: 0.23,
    checkpointSpacingChunks: 2,
    coinDensity: 0.48,
    starTarget: 3,
    palette: { skyTop: 0x101423, skyBottom: 0x2b2d42, accent: 0xff8c42 },
    audio: { tempo: 138, scale: [0, 1, 5, 7, 8] }
  },
  5: {
    theme: 'castle',
    groundVariance: 3,
    gapFrequency: 0.24,
    enemyDensity: 0.68,
    projectileCadenceMs: 1450,
    movingPlatformFrequency: 0.28,
    checkpointSpacingChunks: 2,
    coinDensity: 0.45,
    starTarget: 3,
    palette: { skyTop: 0x221122, skyBottom: 0x3b1f2b, accent: 0xd7263d },
    audio: { tempo: 145, scale: [0, 3, 5, 6, 10] }
  }
};

export function getWorldRules(world: number): WorldRuleset {
  return WORLD_RULES[Math.min(5, Math.max(1, world))] ?? WORLD_RULES[1];
}
