#!/usr/bin/env node
import { generateLevel } from '../src/levelgen/generator';

interface CliArgs {
  world: number;
  level: number;
  seed: number;
}

function parseArgs(argv: string[]): CliArgs {
  const get = (flag: string, fallback: number): number => {
    const index = argv.indexOf(flag);
    if (index === -1 || index + 1 >= argv.length) {
      return fallback;
    }
    const value = Number(argv[index + 1]);
    return Number.isFinite(value) ? value : fallback;
  };

  return {
    world: get('--world', 1),
    level: get('--level', 1),
    seed: get('--seed', 1337)
  };
}

function renderAscii(level: ReturnType<typeof generateLevel>): string {
  const world = level.tileGrid.map((row) => row.map((cell) => (cell === 1 ? '#' : cell === 2 ? '=' : '.')));
  for (const e of level.entities) {
    const tx = Math.floor(e.x / level.tileSize);
    const ty = Math.floor(e.y / level.tileSize);
    const marker = {
      spawn: 'S',
      goal: 'G',
      coin: 'o',
      star: '*',
      walker: 'w',
      shell: 'h',
      flying: 'f',
      spitter: 'p',
      spike: '^',
      thwomp: 'T',
      checkpoint: 'C',
      spring: 'R'
    }[e.type] ?? '?';
    if (world[ty]?.[tx]) {
      world[ty]![tx] = marker;
    }
  }
  return world.map((row) => row.join('')).join('\n');
}

function main(): number {
  const args = parseArgs(process.argv.slice(2));
  const level = generateLevel({ world: args.world, levelIndex: args.level, seed: args.seed });
  console.log(`Preview world=${args.world} level=${args.level} seed=${args.seed}`);
  console.log(`theme=${level.metadata.theme} difficulty=${level.metadata.difficultyTier} chunks=${level.metadata.chunksUsed.join(',')}`);
  console.log(renderAscii(level));
  return 0;
}

process.exitCode = main();
