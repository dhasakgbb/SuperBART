import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import * as ts from 'typescript';
import { describe, expect, test } from 'vitest';
import {
  APPROVED_UI_TEXT,
  COLLECTIBLE_IDENTIFIER_SET,
  CONTENT_WORLD_CHUNK_FAMILIES,
  WORLD_CHUNK_FAMILY_NAMES,
  CONTENT_WORLD_MAP,
  ENEMY_IDENTIFIER_SET,
} from '../src/content/contentManifest';

const REPO_ROOT = path.resolve(__dirname, '..');

function runContentValidate(extraEnv: NodeJS.ProcessEnv = {}): ReturnType<typeof spawnSync> {
  const binary = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  return spawnSync(
    binary,
    ['run', 'lint:content'],
    {
      cwd: REPO_ROOT,
      encoding: 'utf-8',
      env: {
        ...process.env,
        ...extraEnv,
      },
    },
  );
}

function extractAddEntityKeys(file: string): string[] {
  const sourceText = fs.readFileSync(file, 'utf-8');
  const source = ts.createSourceFile(file, sourceText, ts.ScriptTarget.ES2022, true);
  const values: string[] = [];

  const visit = (node: ts.Node): void => {
    if (
      ts.isCallExpression(node)
      && (ts.isIdentifier(node.expression) || ts.isPropertyAccessExpression(node.expression))
      && node.expression.getText(source) === 'addEntity'
      && node.arguments.length >= 1
    ) {
      const first = node.arguments[0];
      if (ts.isStringLiteral(first)) {
        values.push(first.text);
      }
    }
    ts.forEachChild(node, visit);
  };

  ts.forEachChild(source, visit);
  return values;
}

function extractSpawnEnemyKinds(file: string): string[] {
  const sourceText = fs.readFileSync(file, 'utf-8');
  const source = ts.createSourceFile(file, sourceText, ts.ScriptTarget.ES2022, true);
  const values: string[] = [];

  const visit = (node: ts.Node): void => {
    if (
      ts.isCallExpression(node)
      && ts.isIdentifier(node.expression)
      && node.expression.text === 'spawnEnemy'
      && node.arguments.length >= 1
    ) {
      const first = node.arguments[0];
      if (ts.isStringLiteral(first)) {
        values.push(first.text);
      }
    }
    ts.forEachChild(node, visit);
  };

  ts.forEachChild(source, visit);
  return values;
}

function extractGeneratorChunkFamilies(): string[] {
  const file = path.resolve(REPO_ROOT, 'src/levelgen/generator.ts');
  const text = fs.readFileSync(file, 'utf-8');
  const source = ts.createSourceFile(file, text, ts.ScriptTarget.ES2022, true);
  const families: string[] = [];

  const visit = (node: ts.Node): void => {
    if (ts.isVariableDeclaration(node) && node.name.getText(source) === 'FAMILY_TEMPLATES' && node.initializer) {
      if (ts.isObjectLiteralExpression(node.initializer)) {
        for (const property of node.initializer.properties) {
          if (ts.isPropertyAssignment(property) && ts.isIdentifier(property.name)) {
            families.push(property.name.text);
          }
        }
      }
    }
    ts.forEachChild(node, visit);
  };

  ts.forEachChild(source, visit);
  return families;
}

describe('content bible manifest contract', () => {
  test('manifest exports required world and chunk invariants', () => {
    expect(CONTENT_WORLD_MAP).toHaveLength(7);
    for (const world of CONTENT_WORLD_MAP) {
      expect(world.physicsMultipliers).toHaveProperty('frictionMultiplier');
      expect(world.allowedChunkFamilies.length).toBeGreaterThan(0);
      expect(world.index).toBeGreaterThanOrEqual(1);
      expect(world.index).toBeLessThanOrEqual(7);
    }

    const manifestWorldKeys = CONTENT_WORLD_CHUNK_FAMILIES
      .map((entry) => entry.world)
      .sort((a, b) => a - b);
    expect(manifestWorldKeys).toEqual([1, 2, 3, 4, 5, 6, 7]);
    expect(WORLD_CHUNK_FAMILY_NAMES).toContain('azure_walkway');
    expect(WORLD_CHUNK_FAMILY_NAMES.sort()).toContain('server_room');
    expect(WORLD_CHUNK_FAMILY_NAMES).toContain('benchmark_sprint');
    expect(CONTENT_WORLD_MAP[6].allowedChunkFamilies).toContain('benchmark_sprint');
  });

  test('approved UI text includes canonical labels and regex patterns', () => {
    expect(APPROVED_UI_TEXT.exact).toContain('SYSTEM FAILURE');
    expect(APPROVED_UI_TEXT.exact).toContain('GLOBAL CLOUD NETWORK');
    expect(APPROVED_UI_TEXT.exact).toContain('7 REGIONS • 28 STAGES • HUMAN COST');
    expect(APPROVED_UI_TEXT.patterns.map((entry) => entry.id)).toEqual(expect.arrayContaining([
      'HUD_BART',
      'HUD_COUNTER_EVAL',
      'HUD_COUNTER_TOKEN',
      'LEVEL_COMPLETE_STATS',
      'FINAL_VICTORY_STATS',
    ]));
  });

  test('mapping consistency with runtime generation/enemy identifiers', () => {
    const generatorPath = path.resolve(REPO_ROOT, 'src/levelgen/generator.ts');
    const playScenePath = path.resolve(REPO_ROOT, 'src/scenes/PlayScene.ts');
    const manifestChunkFamilies = new Set(WORLD_CHUNK_FAMILY_NAMES);

    const structuralChunkNames = new Set(['start', 'end', 'checkpoint']);
    for (const family of extractGeneratorChunkFamilies()) {
      if (structuralChunkNames.has(family)) {
        continue;
      }
      expect(manifestChunkFamilies.has(family as any)).toBe(true);
    }

    const addEntityIds = new Set([
      ...COLLECTIBLE_IDENTIFIER_SET,
      ...ENEMY_IDENTIFIER_SET,
      'spawn',
      'goal',
      'question_block',
      'checkpoint',
      'spring',
      'spike',
      'thwomp',
      'moving_platform',
    ]);

    for (const entry of extractAddEntityKeys(generatorPath)) {
      expect(addEntityIds.has(entry)).toBe(true);
    }

    const spawnKinds = new Set(extractSpawnEnemyKinds(playScenePath));
    for (const kind of spawnKinds) {
      expect(ENEMY_IDENTIFIER_SET.has(kind)).toBe(true);
    }
  });
});

describe('content validator behavior', () => {
  test('content validator succeeds in non-production mode', () => {
    const result = runContentValidate({ CONTENT_MODE: 'development', NODE_ENV: 'test' });
    expect(result.status).toBe(0);
  });

  test('content validator flags unapproved scene strings (fixture)', () => {
    const fixtureDir = fs.mkdtempSync(path.join(os.tmpdir(), 'superbart-content-validator-'));
    const fixturePath = path.join(fixtureDir, 'InvalidFixtureScene.ts');
    fs.writeFileSync(
      fixturePath,
      [
        'export class InvalidFixtureScene {',
        '  create(): void {',
        "    const scene = { add: { text: (_x: number, _y: number, _value: string) => null } } as const;",
        '    scene.add.text(0, 0, "LIVES");',
        '  }',
        '}',
      ].join('\n'),
    );

    try {
      const result = runContentValidate({
        CONTENT_MODE: 'development',
        NODE_ENV: 'test',
        CONTENT_VALIDATOR_TARGET_PATHS: fixturePath,
      });
      expect(result.status).toBe(1);
      const output = `${result.stdout ?? ''}${result.stderr ?? ''}`;
      expect(output).toContain('content.ui.unapprovedString');
    } finally {
      fs.rmSync(fixtureDir, { recursive: true, force: true });
    }
  });

  test('production mode rejects disallowed .svg assets without migration allowlist', () => {
    const result = runContentValidate({ CONTENT_MODE: 'production', NODE_ENV: 'production' });
    expect(result.status).toBe(0);
    const output = `${result.stdout ?? ''}${result.stderr ?? ''}`;
    expect(output).toContain('Content validation passed.');
  });
});
