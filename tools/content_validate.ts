#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as ts from 'typescript';
import {
  ASSET_POLICY,
  APPROVED_UI_TEXT,
  COLLECTIBLE_IDENTIFIER_SET,
  WORLD_CHUNK_FAMILY_NAMES,
  ENEMY_IDENTIFIER_SET,
  HUD_CONTRACT,
} from '../src/content/contentManifest';
import { ASSET_MANIFEST } from '../src/core/assetManifest';
import styleConfig from '../src/style/styleConfig';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..');
const DEFAULT_TARGET_TEXT_FILES = [
  'src/content/contentManifest.ts',
  'src/style/styleConfig.ts',
  'src/scenes/BootScene.ts',
  'src/scenes/TitleScene.ts',
  'src/scenes/LevelCompleteScene.ts',
  'src/scenes/GameOverScene.ts',
  'src/scenes/FinalVictoryScene.ts',
  'src/scenes/PauseScene.ts',
  'src/scenes/WorldMapScene.ts',
  'src/scenes/SettingsScene.ts',
  'src/scenes/PlayScene.ts',
];
const TARGET_TEXT_FILES = resolveTargetTextFiles(process.env.CONTENT_VALIDATOR_TARGET_PATHS);

function resolveTargetTextFiles(envPaths: string | undefined): string[] {
  if (!envPaths) {
    return DEFAULT_TARGET_TEXT_FILES;
  }

  const raw = envPaths.trim();
  if (!raw) {
    return DEFAULT_TARGET_TEXT_FILES;
  }

  if (raw.startsWith('[')) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((entry) => String(entry)).filter(Boolean);
      }
    } catch {
      // Fall through to comma-separated parsing.
    }
  }

  return raw
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
}

type Failure = {
  id: string;
  file: string;
  line: number;
  message: string;
  hint?: string;
};

type LabeledText = {
  file: string;
  line: number;
  text: string;
  source: string;
};

const FORBIDDEN_HUD_WORDS = /\b(LIVES|STAR|COIN)\b/;

const failures: Failure[] = [];
const isProduction = process.env.CONTENT_MODE === 'production' || process.env.NODE_ENV === 'production';

function addFailure(f: Failure): void {
  failures.push(f);
}

function toLine(text: string, index: number): number {
  return text.slice(0, index).split('\n').length;
}

function rel(file: string): string {
  return path.relative(REPO_ROOT, file);
}

function readSource(filePath: string): ts.SourceFile {
  const text = fs.readFileSync(filePath, 'utf-8');
  return ts.createSourceFile(filePath, text, ts.ScriptTarget.ES2022, true);
}

function getSourceText(filePath: string): string {
  return fs.readFileSync(filePath, 'utf-8');
}

function extractUiTextLiterals(filePath: string): LabeledText[] {
  const source = readSource(filePath);
  const entries: LabeledText[] = [];

  const isTextPropertyName = (name: ts.PropertyName): boolean => {
    return (
      (ts.isIdentifier(name) && name.text === 'text') ||
      (ts.isStringLiteral(name) && name.text === 'text') ||
      (ts.isNumericLiteral(name) && name.text === 'text')
    );
  };

  const textCallArgIndex = (name: string): number | null => {
    if (name === 'setText') return 0;
    if (name === 'text' || name === 'bitmapText') return 2;
    return null;
  };

  const visit = (node: ts.Node): void => {
    if (ts.isPropertyAssignment(node) && isTextPropertyName(node.name) && ts.isStringLiteral(node.initializer)) {
      entries.push({
        file: filePath,
        line: source.getLineAndCharacterOfPosition(node.initializer.getStart()).line + 1,
        text: node.initializer.text,
        source: 'property.text',
      });
    }

    if (ts.isCallExpression(node)) {
      const calleeName =
        ts.isPropertyAccessExpression(node.expression) ? node.expression.name.getText(source) : null;
      if (calleeName) {
        const argIndex = textCallArgIndex(calleeName);
        if (argIndex != null && node.arguments.length > argIndex) {
          const arg = node.arguments[argIndex];
          if (ts.isStringLiteral(arg)) {
            entries.push({
              file: filePath,
              line: source.getLineAndCharacterOfPosition(arg.getStart()).line + 1,
              text: arg.text,
              source: `call:${calleeName}`,
            });
          }
        }
      }
    }

    ts.forEachChild(node, visit);
  };

  ts.forEachChild(source, visit);
  return entries;
}

function validateApprovedUiText(): void {
  const allowedExact = new Set(APPROVED_UI_TEXT.exact);
  const approvedPattern = APPROVED_UI_TEXT.patterns.map((entry) => ({
    id: entry.id,
    re: new RegExp(entry.regex),
  }));

  for (const file of TARGET_TEXT_FILES) {
    const abs = path.resolve(REPO_ROOT, file);
    if (!fs.existsSync(abs)) {
      addFailure({
        id: 'content.ui.fileMissing',
        file: rel(abs),
        line: 1,
        message: `Expected file is missing: ${file}`,
        hint: 'Restore or point the content validator to valid scene/style source paths.',
      });
      continue;
    }

    for (const token of extractUiTextLiterals(abs)) {
      const value = token.text.trim();
      if (!value) {
        continue;
      }

      const exactMatch = allowedExact.has(value);
      const patternMatch = approvedPattern.some(({ id, re }) => re.test(value));
      if (!exactMatch && !patternMatch) {
        addFailure({
          id: 'content.ui.unapprovedString',
          file: rel(token.file),
          line: token.line,
          message: `User-facing string is not approved (${token.source}): "${value}"`,
          hint: 'Add this exact string to APPROVED_UI_TEXT.exact or define a regex in APPROVED_UI_TEXT.patterns.',
        });
      }
    }
  }
}

function validateForbiddenHudWords(): void {
  const hudEntries = [
    HUD_CONTRACT.leftBlock.line1TextFormat,
    HUD_CONTRACT.rightBlock.line1TextFormat,
    styleConfig.hudLayout.leftGroup.textFormat,
    styleConfig.hudLayout.rightGroup.textFormat,
  ];

  for (const [index, value] of hudEntries.entries()) {
    const match = value.match(FORBIDDEN_HUD_WORDS);
    if (match) {
      addFailure({
        id: 'content.hud.forbiddenWord',
        file: rel(path.resolve(REPO_ROOT, 'src/style/styleConfig.ts')),
        line: 1,
        message: `HUD label text contains forbidden word "${match[0]}" at field ${index}`,
        hint: 'Switch HUD labels to icon-driven format (e.g. BART xNN, ✦eval, ◎token).',
      });
    }
  }
}

function validateAssetManifestImagesForProduction(): void {
  if (!ASSET_POLICY.disallowSvgInProduction || !isProduction) {
    return;
  }

  const manifestText = getSourceText(path.resolve(REPO_ROOT, 'src/core/assetManifest.ts'));
  const allowed = new Set(ASSET_POLICY.allowedSvgAssetKeysInProduction);
  const imageEntries = Object.entries(ASSET_MANIFEST.images);

  for (const [key, entry] of imageEntries) {
    if (allowed.has(key)) {
      continue;
    }

    const descriptor = typeof entry === 'string' ? { path: entry } : entry;
    if (!descriptor.path.toLowerCase().endsWith('.svg')) {
      continue;
    }

    const needle = `${key}:`;
    const line = manifestText.includes(needle)
      ? toLine(manifestText, manifestText.indexOf(needle))
      : 1;
    addFailure({
      id: 'content.assets.svgInProduction',
      file: rel(path.resolve(REPO_ROOT, 'src/core/assetManifest.ts')),
      line,
      message: `Production check: image key "${key}" resolves to ${descriptor.path}`,
      hint: `Either rasterize ${key} to PNG/JPG or add it to ASSET_POLICY.allowedSvgAssetKeysInProduction when migration-ready.`,
    });
  }
}

function validateChunkFamiliesInGenerator(): void {
  const filePath = path.resolve(REPO_ROOT, 'src/levelgen/generator.ts');
  const source = readSource(filePath);
  const allowedFamilies = new Set(WORLD_CHUNK_FAMILY_NAMES);
  const emitted = new Map<string, number>();

  const visit = (node: ts.Node): void => {
    if (ts.isVariableDeclaration(node) && node.name.getText(source) === 'FAMILY_TEMPLATES' && node.initializer) {
      if (ts.isObjectLiteralExpression(node.initializer)) {
        for (const prop of node.initializer.properties) {
          if (ts.isPropertyAssignment(prop) && ts.isIdentifier(prop.name)) {
            emitted.set(prop.name.text, source.getLineAndCharacterOfPosition(prop.name.getStart()).line + 1);
            continue;
          }
          if (ts.isPropertyAssignment(prop) && ts.isStringLiteral(prop.name)) {
            emitted.set(prop.name.text, source.getLineAndCharacterOfPosition(prop.name.getStart()).line + 1);
          }
        }
      }
    }
    ts.forEachChild(node, visit);
  };

  ts.forEachChild(source, visit);

  for (const [family, line] of emitted.entries()) {
    if (!allowedFamilies.has(family)) {
      addFailure({
        id: 'content.chunkFamily.unknown',
        file: rel(filePath),
        line,
        message: `Generator chunk family "${family}" is not in manifest allowlist.`,
        hint: 'Use only chunk families declared in CONTENT_WORLD_CHUNK_FAMILIES.',
      });
    }
  }
}

function validateRuntimeIdentifiers(): void {
  const generatorPath = path.resolve(REPO_ROOT, 'src/levelgen/generator.ts');
  const playPath = path.resolve(REPO_ROOT, 'src/scenes/PlayScene.ts');

  const collectableAndEnemyAllowed = new Set([...COLLECTIBLE_IDENTIFIER_SET, ...ENEMY_IDENTIFIER_SET]);
  const entityCoreAllowed = new Set(['spawn', 'goal', 'question_block', 'checkpoint', 'spring', 'spike', 'thwomp', 'moving_platform']);

  const validateCallArgument = (file: string, callName: string, allowed: Set<string>, checkSet: Set<string>): void => {
    const source = readSource(file);
    const visit = (node: ts.Node): void => {
      if (!ts.isCallExpression(node)) {
        ts.forEachChild(node, visit);
        return;
      }

      const calleeName =
        ts.isIdentifier(node.expression)
          ? node.expression.text
          : ts.isPropertyAccessExpression(node.expression)
            ? node.expression.name.text
            : null;
      if (calleeName !== callName || node.arguments.length === 0) {
        ts.forEachChild(node, visit);
        return;
      }

      const first = node.arguments[0];
      if (ts.isStringLiteral(first)) {
        const value = first.text;
        if (!allowed.has(value)) {
          const allowedList = [...checkSet].sort();
          addFailure({
            id: 'content.runtime.identifierUnknown',
            file: rel(file),
            line: source.getLineAndCharacterOfPosition(first.getStart()).line + 1,
            message: `Identifier "${value}" passed to ${callName} is not an allowed runtime identifier.`,
            hint: `Add identifier to manifest aliases if new, or remove this runtime reference. Allowed set includes: ${allowedList.join(', ')}.`,
          });
        }
      }

      ts.forEachChild(node, visit);
    };

    ts.forEachChild(source, visit);
  };

  validateCallArgument(generatorPath, 'addEntity', new Set([...collectableAndEnemyAllowed, ...entityCoreAllowed]), collectableAndEnemyAllowed);
  validateCallArgument(playPath, 'spawnEnemy', new Set(ENEMY_IDENTIFIER_SET), new Set(ENEMY_IDENTIFIER_SET));
}

function validateHudFormattingRules(): void {
  if (!/WORLD \{world\}-\{level\}/.test(styleConfig.hudLayout.rightGroup.textFormat)) {
    addFailure({
      id: 'content.hud.formatMissingWorldLevel',
      file: rel(path.resolve(REPO_ROOT, 'src/style/styleConfig.ts')),
      line: 1,
      message: 'HUD right group format should include WORLD W-L pattern contract.',
      hint: 'Use `WORLD {world}-{level}` in the format string.',
    });
  }

  if (!/TIME \{time\}/.test(styleConfig.hudLayout.rightGroup.textFormat)) {
    addFailure({
      id: 'content.hud.formatMissingTime',
      file: rel(path.resolve(REPO_ROOT, 'src/style/styleConfig.ts')),
      line: 1,
      message: 'HUD right group format should include TIME token contract.',
      hint: 'Use `TIME {time}` in the format string.',
    });
  }

  if (!/BART x\{instances\}/.test(styleConfig.hudLayout.leftGroup.textFormat)) {
    addFailure({
      id: 'content.hud.formatMissingLives',
      file: rel(path.resolve(REPO_ROOT, 'src/style/styleConfig.ts')),
      line: 1,
      message: 'HUD left group format should include `BART x{instances}` token contract.',
      hint: 'Use `BART x{instances}` to preserve icon-driven left HUD format.',
    });
  }

}

function main(): number {
  validateApprovedUiText();
  validateForbiddenHudWords();
  validateAssetManifestImagesForProduction();
  validateChunkFamiliesInGenerator();
  validateRuntimeIdentifiers();
  validateHudFormattingRules();

  if (failures.length === 0) {
    console.log('Content validation passed.');
    return 0;
  }

  console.error('Content validation failed:');
  for (const failure of failures) {
    const lineHint = `${failure.file}:${failure.line}`;
    console.error(`[${failure.id}] ${lineHint} ${failure.message}`);
    if (failure.hint) {
      console.error(`  hint: ${failure.hint}`);
    }
  }
  return 1;
}

process.exitCode = main();
