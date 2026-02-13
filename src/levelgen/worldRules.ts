import type { WorldRuleset } from '../types/levelgen';
import { CONTENT_WORLD_MAP } from '../content/contentManifest';

const WORLD_RULES: Record<number, WorldRuleset> = Object.fromEntries(
  CONTENT_WORLD_MAP.map((world) => [
    world.index,
    {
      theme: world.theme,
      multipliers: world.physicsMultipliers,
      groundVariance: world.generation.groundVariance,
      gapFrequency: world.generation.gapFrequency,
      enemyDensity: world.generation.enemyDensity,
      projectileCadenceMs: world.generation.projectileCadenceMs,
      movingPlatformFrequency: world.generation.movingPlatformFrequency,
      checkpointSpacingChunks: world.generation.checkpointSpacingChunks,
      coinDensity: world.generation.coinDensity,
      starTarget: world.generation.starTarget,
      palette: world.generation.palette,
      audio: world.generation.audio,
      allowedChunkFamilies: world.allowedChunkFamilies,
      modifiers: {
        frictionMultiplier: world.physicsMultipliers.frictionMultiplier,
        gravityMultiplier: world.physicsMultipliers.gravityMultiplier,
        speedMultiplier: world.physicsMultipliers.speedMultiplier,
        tokenBurnRate: world.physicsMultipliers.tokenBurnRate
      }
    } as WorldRuleset,
  ]),
) as Record<number, WorldRuleset>;

export const WORLD_NAMES: Record<number, string> = Object.fromEntries(
  CONTENT_WORLD_MAP.map((world) => [world.index, world.displayName]),
);

export function getWorldRules(world: number): WorldRuleset {
  const maxWorld = CONTENT_WORLD_MAP.length;
  const safeWorld = Math.min(maxWorld, Math.max(1, world));
  return WORLD_RULES[safeWorld] ?? WORLD_RULES[1];
}
