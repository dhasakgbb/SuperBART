import { TILE_SIZE } from '../core/constants';
import type {
  ChunkFamily,
  ChunkTemplateType,
  ChunkType,
  EntityType,
  GeneratedLevel,
  LevelEntity,
  LevelGenerationInput,
} from '../types/levelgen';
import { createRng } from './rng';
import { getWorldRules } from './worldRules';
import { campaignOrdinal } from '../systems/progression';

const CHUNK_WIDTH = 24;
const LEVEL_HEIGHT = 34;
const BASE_GROUND = 26;

const FAMILY_TEMPLATES: Record<ChunkFamily, ChunkTemplateType[]> = {
  server_room: ['mid_flat', 'mid_flat', 'coin_arc'],
  training_run: ['coin_arc', 'vertical_climb', 'enemy_gauntlet'],
  rag_pipeline: ['moving_platform', 'vertical_climb', 'enemy_gauntlet'],
  rate_limiter: ['moving_platform', 'enemy_gauntlet', 'coin_arc'],
};

function makeGrid(width: number, height: number): number[][] {
  return Array.from({ length: height }, () => Array.from({ length: width }, () => 0));
}

function makeGridFillGround(grid: number[][], x0: number, x1: number, y: number): void {
  for (let x = x0; x <= x1; x += 1) {
    for (let yy = y; yy < grid.length; yy += 1) {
      grid[yy]![x] = 1;
    }
  }
}

function addEntity(
  entities: LevelEntity[],
  type: EntityType,
  xTile: number,
  yTile: number,
  data?: Record<string, number | string | boolean>,
): void {
  entities.push({
    id: `${type}_${entities.length + 1}`,
    type,
    x: xTile * TILE_SIZE + TILE_SIZE / 2,
    y: yTile * TILE_SIZE + TILE_SIZE / 2,
    data,
  });
}

function pickChunkTemplate(
  rng: ReturnType<typeof createRng>,
  allowedFamilies: ChunkFamily[],
  world: number,
  levelIndex: number,
  chunkIndex: number,
): { family: ChunkFamily; template: ChunkTemplateType } {
  const family = allowedFamilies.length === 1 ? allowedFamilies[0]! : rng.pick(allowedFamilies);
  const familyPool = FAMILY_TEMPLATES[family] as ChunkTemplateType[];

  const pool = [...familyPool];
  if (levelIndex >= 3 && chunkIndex >= 4 && world + levelIndex > 2) {
    pool.push('moving_platform');
  }
  if (world >= 4) {
    pool.push('enemy_gauntlet', 'enemy_gauntlet');
  }

  return { family, template: rng.pick(pool) };
}

export function generateLevel(input: LevelGenerationInput): GeneratedLevel {
  const rules = getWorldRules(input.world);
  const rng = createRng(input.seed ^ (input.world << 7) ^ (input.levelIndex << 13));
  const finalCastle = !input.bonus && input.world === 5 && input.levelIndex === 1;
  const chunkCount = input.bonus ? 6 : finalCastle ? 16 : Math.min(14, 8 + input.world + input.levelIndex);
  const width = chunkCount * CHUNK_WIDTH;
  const grid = makeGrid(width, LEVEL_HEIGHT);
  const entities: LevelEntity[] = [];
  const oneWayPlatforms: Array<{ x: number; y: number; w: number }> = [];
  const movingPlatforms: Array<{ id: string; x: number; y: number; minX: number; maxX: number; speed: number }> = [];
  const checkpoints: Array<{ id: string; x: number; y: number }> = [];
  const chunksUsed: ChunkType[] = ['start'];

  let groundY = BASE_GROUND;

  for (let chunk = 0; chunk < chunkCount; chunk += 1) {
    const x0 = chunk * CHUNK_WIDTH;
    const x1 = x0 + CHUNK_WIDTH - 1;

    if (chunk === 0) {
      makeGridFillGround(grid, x0, x1, groundY);
      addEntity(entities, 'spawn', x0 + 2, groundY - 2);
      continue;
    }

    if (chunk === chunkCount - 1) {
      makeGridFillGround(grid, x0, x1, groundY);
      addEntity(entities, 'goal', x1 - 2, groundY - 3);
      chunksUsed.push('end');
      continue;
    }

    const { family, template } = pickChunkTemplate(
      rng,
      rules.allowedChunkFamilies,
      input.world,
      input.levelIndex,
      chunk,
    );
    chunksUsed.push(family);

    const variance = rng.nextInt(-rules.groundVariance, rules.groundVariance);
    groundY = Math.max(21, Math.min(28, groundY + variance));

    const gapStart = x0 + rng.nextInt(6, 13);
    const gapWidth = rng.chance(finalCastle ? rules.gapFrequency + 0.08 : rules.gapFrequency)
      ? rng.nextInt(2, finalCastle ? 5 : 4)
      : 0;

    makeGridFillGround(grid, x0, x1, groundY);
    if (gapWidth > 0) {
      for (let x = gapStart; x < gapStart + gapWidth; x += 1) {
        for (let y = 0; y < LEVEL_HEIGHT; y += 1) {
          grid[y]![x] = 0;
        }
      }
      addEntity(entities, 'spring', gapStart - 1, groundY - 1);
    }

    const hasCheckpoint = chunk % rules.checkpointSpacingChunks === 0 && chunk > 1;
    if (hasCheckpoint) {
      chunksUsed.push('checkpoint');
      const checkpointId = `cp_${input.world}_${input.levelIndex}_${chunk}`;
      addEntity(entities, 'checkpoint', x0 + 5, groundY - 2, { checkpointId });
      checkpoints.push({
        id: checkpointId,
        x: (x0 + 5) * TILE_SIZE,
        y: (groundY - 2) * TILE_SIZE,
      });
    }

    if (template === 'coin_arc') {
      for (let i = 0; i < 5; i += 1) {
        const tx = x0 + 5 + i;
        const ty = groundY - 4 + Math.abs(2 - i);
        addEntity(entities, 'coin', tx, ty);
      }
      if (rng.chance(0.6)) {
        addEntity(entities, 'question_block', x0 + 7, groundY - 4);
      }
      if (rng.chance(0.45)) {
        addEntity(entities, 'star', x0 + 11, groundY - 6);
      }
    }

    if (template === 'enemy_gauntlet' || rng.chance(finalCastle ? rules.enemyDensity + 0.1 : rules.enemyDensity)) {
      addEntity(entities, 'walker', x0 + 8, groundY - 1, { patrol: 4 });
      if (rng.chance(finalCastle ? 0.78 : 0.5)) {
        addEntity(entities, 'shell', x0 + 14, groundY - 1, { patrol: 4 });
      }
      if (rng.chance(finalCastle ? 0.58 : 0.35)) {
        addEntity(entities, 'flying', x0 + 17, groundY - 6, { amp: 20 });
      }
      if (rng.chance((finalCastle ? 0.62 : 0.3) + input.world * 0.06)) {
        addEntity(entities, 'spitter', x0 + 20, groundY - 1, { cadenceMs: rules.projectileCadenceMs });
      }
    }

    if (template === 'vertical_climb') {
      for (let i = 0; i < 3; i += 1) {
        const px = x0 + 7 + i * 5;
        const py = groundY - 4 - i * 3;
        for (let x = px; x < px + 4; x += 1) {
          grid[py]![x] = 2;
        }
        oneWayPlatforms.push({ x: px, y: py, w: 4 });
      }
      addEntity(entities, 'spike', x0 + 5, groundY - 1);
    }

    if (template === 'moving_platform' || rng.chance(finalCastle ? rules.movingPlatformFrequency + 0.12 : rules.movingPlatformFrequency)) {
      const y = groundY - 6;
      movingPlatforms.push({
        id: `mp_${chunk}`,
        x: (x0 + 10) * TILE_SIZE,
        y: y * TILE_SIZE,
        minX: (x0 + 5) * TILE_SIZE,
        maxX: (x0 + 16) * TILE_SIZE,
        speed: 50 + input.world * 8 + (finalCastle ? 22 : 0),
      });
      addEntity(entities, 'thwomp', x0 + 18, groundY - 6, { topY: groundY - 10, bottomY: groundY - 2 });
      addEntity(entities, 'spike', x0 + 12, groundY - 1);
      if (finalCastle && rng.chance(0.5)) {
        addEntity(entities, 'spike', x0 + 8, groundY - 1);
      }
    }

    for (let tx = x0 + 2; tx < x1 - 1; tx += 3) {
      if (rng.chance(rules.coinDensity * (finalCastle ? 0.14 : 0.25))) {
        addEntity(entities, 'coin', tx, groundY - rng.nextInt(2, 3));
      }
    }

    if (template === 'mid_flat' && rng.chance(0.35)) {
      addEntity(entities, 'question_block', x0 + rng.nextInt(8, 16), groundY - 4);
    }
  }

  const goal = entities.find((e) => e.type === 'goal');
  if (!goal) {
    addEntity(entities, 'goal', width - 3, BASE_GROUND - 2);
  }

  return {
    tileSize: TILE_SIZE,
    width,
    height: LEVEL_HEIGHT,
    tileGrid: grid,
    oneWayPlatforms,
    movingPlatforms,
    entities,
    checkpoints,
    goal: {
      x: (width - 3) * TILE_SIZE,
      y: (BASE_GROUND - 2) * TILE_SIZE,
    },
    metadata: {
      world: input.world,
      levelIndex: input.levelIndex,
      theme: input.bonus ? 'bonus' : rules.theme,
      difficultyTier: campaignOrdinal(input.world, input.levelIndex),
      chunksUsed,
      seed: input.seed,
    },
  };
}

export function validateGeneratedLevel(level: GeneratedLevel): { ok: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!level.entities.some((e) => e.type === 'spawn')) errors.push('missing spawn');
  if (!level.entities.some((e) => e.type === 'goal')) errors.push('missing goal');
  if (level.tileGrid.length !== level.height) errors.push('height mismatch');
  if (level.tileGrid[0]?.length !== level.width) errors.push('width mismatch');
  if (level.metadata.chunksUsed.length < 4) errors.push('insufficient chunks');
  return { ok: errors.length === 0, errors };
}
