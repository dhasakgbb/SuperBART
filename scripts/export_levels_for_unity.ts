import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

import { generateLevel, validateGeneratedLevel } from '../src/levelgen/generator';
import { computeSeed, isBonusRouteId } from '../src/systems/progression';
import { CAMPAIGN_WORLD_LAYOUT } from '../src/core/constants';
import type { BonusRouteId } from '../src/types/game';

export interface ExportLevelsForUnityOptions {
  outDir?: string;
  world?: number;
  levels?: number[];
  bonus?: boolean;
  bonusRouteId?: BonusRouteId | null;
  all?: boolean;
}

export interface ExportedUnityLevel {
  world: number;
  levelIndex: number;
  seed: number;
  fileName: string;
  filePath: string;
}

const DEFAULT_WORLD = 1;
const DEFAULT_LEVELS = [2];
const DEFAULT_OUT_DIR = path.resolve(process.cwd(), 'artifacts', 'unity', 'levels');

function parseBooleanArg(value: string | undefined, fallback: boolean): boolean {
  if (value == null) {
    return fallback;
  }
  return value === 'true' || value === '1';
}

function parseIntArg(value: string | undefined, fallback: number): number {
  if (value == null) {
    return fallback;
  }
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    throw new Error(`Expected numeric argument, received "${value}"`);
  }
  return Math.floor(parsed);
}

function parseLevelsArg(value: string | undefined): number[] {
  if (!value) {
    return [...DEFAULT_LEVELS];
  }

  const levels = value
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => {
      const parsed = Number(entry);
      if (!Number.isFinite(parsed)) {
        throw new Error(`Invalid level index in --levels: "${entry}"`);
      }
      return Math.floor(parsed);
    });

  if (levels.length === 0) {
    throw new Error('At least one level index must be provided via --levels');
  }

  return levels;
}

function getArgValue(argv: string[], name: string): string | undefined {
  const index = argv.indexOf(`--${name}`);
  if (index < 0) {
    return undefined;
  }
  return argv[index + 1];
}

function parseBonusRoute(value: string | undefined): BonusRouteId | null {
  if (!value) {
    return null;
  }
  if (!isBonusRouteId(value)) {
    throw new Error(`Unsupported --bonusRouteId "${value}". Allowed: micro-level-1, micro-level-2, micro-level-3`);
  }
  return value;
}

function exportSingleWorld(
  world: number,
  levels: number[],
  bonus: boolean,
  bonusRouteId: BonusRouteId | null,
  outDir: string,
): ExportedUnityLevel[] {
  const exported: ExportedUnityLevel[] = [];

  for (const levelIndex of levels) {
    if (!Number.isFinite(levelIndex) || levelIndex < 1) {
      throw new Error(`Invalid levelIndex "${levelIndex}"`);
    }

    const seed = computeSeed(world, levelIndex + (bonus ? 100 : 0), bonusRouteId);
    const level = generateLevel({
      world,
      levelIndex,
      seed,
      bonus,
    });

    const validation = validateGeneratedLevel(level);
    if (!validation.ok) {
      throw new Error(`Generated invalid level w${world} l${levelIndex}: ${validation.errors.join(', ')}`);
    }

    const fileName = `w${world}_l${levelIndex}${bonus ? '_bonus' : ''}.json`;
    const filePath = path.join(outDir, fileName);
    fs.writeFileSync(filePath, `${JSON.stringify(level, null, 2)}\n`, 'utf8');

    exported.push({
      world,
      levelIndex,
      seed,
      fileName,
      filePath,
    });
  }

  return exported;
}

export function exportLevelsForUnity(options: ExportLevelsForUnityOptions = {}): ExportedUnityLevel[] {
  const bonus = options.bonus ?? false;
  const bonusRouteId = options.bonusRouteId ?? null;
  const outDir = path.resolve(options.outDir ?? DEFAULT_OUT_DIR);
  const all = options.all ?? false;

  fs.mkdirSync(outDir, { recursive: true });

  if (all) {
    const exported: ExportedUnityLevel[] = [];
    for (let w = 0; w < CAMPAIGN_WORLD_LAYOUT.length; w++) {
      const worldNum = w + 1;
      const levelsInWorld = CAMPAIGN_WORLD_LAYOUT[w];
      const levelIndices = Array.from({ length: levelsInWorld }, (_, i) => i + 1);
      exported.push(...exportSingleWorld(worldNum, levelIndices, bonus, bonusRouteId, outDir));
    }
    return exported;
  }

  const world = options.world ?? DEFAULT_WORLD;
  const levels = options.levels ?? [...DEFAULT_LEVELS];

  if (!Number.isFinite(world) || world < 1) {
    throw new Error(`Invalid world "${world}"`);
  }

  if (levels.length === 0) {
    throw new Error('No levels provided for export');
  }

  return exportSingleWorld(world, levels, bonus, bonusRouteId, outDir);
}

function parseCliArgs(argv: string[]): ExportLevelsForUnityOptions {
  const all = argv.includes('--all');
  return {
    outDir: getArgValue(argv, 'out') ?? DEFAULT_OUT_DIR,
    world: parseIntArg(getArgValue(argv, 'world'), DEFAULT_WORLD),
    levels: parseLevelsArg(getArgValue(argv, 'levels')),
    bonus: parseBooleanArg(getArgValue(argv, 'bonus'), false),
    bonusRouteId: parseBonusRoute(getArgValue(argv, 'bonusRouteId')),
    all,
  };
}

function printUsage(): void {
  process.stdout.write(
    [
      'SUPERBART -> Unity level exporter',
      '',
      'Usage:',
      '  npx tsx scripts/export_levels_for_unity.ts --all --out artifacts/unity/levels',
      '  npx tsx scripts/export_levels_for_unity.ts --out artifacts/unity/levels --world 1 --levels 2',
      '',
      'Options:',
      '  --out <dir>           Output directory (default: artifacts/unity/levels)',
      '  --all                 Export all campaign levels across all worlds',
      '  --world <number>      Campaign world (default: 1, ignored when --all)',
      '  --levels <csv>        Comma-separated level indices (default: 2, ignored when --all)',
      '  --bonus <true|false>  Bonus mode (default: false)',
      '  --bonusRouteId <id>   Optional bonus route id: micro-level-1|2|3',
      '',
    ].join('\n')
  );
}

function runCli(argv: string[]): void {
  if (argv.includes('--help') || argv.includes('-h')) {
    printUsage();
    return;
  }

  const options = parseCliArgs(argv);
  const exported = exportLevelsForUnity(options);

  for (const item of exported) {
    process.stdout.write(`Wrote ${path.relative(process.cwd(), item.filePath)} (seed=${item.seed})\n`);
  }
}

const invokedPath = process.argv[1] ? pathToFileURL(path.resolve(process.argv[1])).href : '';
if (invokedPath === import.meta.url) {
  runCli(process.argv.slice(2));
}
