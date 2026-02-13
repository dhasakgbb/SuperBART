#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import styleConfig, {
  canonicalReferenceTargets,
  contractVersion,
  sceneLockScope,
  sceneStyleExceptions as CANONICAL_SCENE_EXCEPTIONS,
  type SceneStyleExceptionRationale,
} from '../src/style/styleConfig';
import { ASSET_MANIFEST } from '../src/core/assetManifest';
import { parseHex, readPng } from './lib/pixel';

type ErrorList = string[];
type WarningList = string[];

const SCENE_PATHS: Record<string, string> = {
  BootScene: 'src/scenes/BootScene.ts',
  GameOverScene: 'src/scenes/GameOverScene.ts',
  LevelCompleteScene: 'src/scenes/LevelCompleteScene.ts',
  FinalVictoryScene: 'src/scenes/FinalVictoryScene.ts',
  SettingsScene: 'src/scenes/SettingsScene.ts',
  TitleScene: 'src/scenes/TitleScene.ts',
  WorldMapScene: 'src/scenes/WorldMapScene.ts',
  PlayScene: 'src/scenes/PlayScene.ts',
};

const KNOWN_SCENE_KEYS = new Set(Object.keys(SCENE_PATHS));
const USER_FACING_SCENES: string[] = (() => {
  const scenes = new Set<string>();
  for (const target of styleConfig.referenceTargets ?? []) {
    if (!Array.isArray(target.scenes)) {
      continue;
    }
    for (const scene of target.scenes) {
      if (typeof scene === 'string' && scene.trim().length > 0) {
        scenes.add(scene);
      }
    }
  }
  return [...scenes].sort();
})();
const ALLOWED_REFERENCE_ROLES = new Set(['primary', 'secondary', 'supplemental']);
const OUTLINE_METADATA_SCHEMA_VERSION = '1.1.0';
const OUTLINE_GENERATOR_ALLOWLIST = new Set(['make_ui_assets.ts', 'make_bart_sprites.ts']);
const OUTLINE_SOURCE_DOCUMENT = 'src/style/styleConfig.ts';
const OUTLINE_SWATCH_KEY = styleConfig.outline.sourceColor ?? styleConfig.outline.color ?? 'inkDark';
const OUTLINE_ALPHA = Number.isFinite(styleConfig.outline.sourceAlpha) ? styleConfig.outline.sourceAlpha : 220;
const OUTLINE_METADATA_PATH = path.resolve('public/assets/style_outline_contract.json');
const SWATCH_BY_NAME = new Map(styleConfig.palette.swatches.map((entry) => [entry.name, entry.hex]));
const NO_EXCEPTIONS_DOC_STMT = /no approved scene exceptions are currently documented/i;
const CONTRACT_METADATA_KEYS = {
  contractVersion: 'contractversion',
  authoritativeSource: 'authoritativesource',
  referenceTargetSource: 'referencetargetsource',
  sceneLockScope: 'scenelockscope',
} as const;
const HUD_CONTRACT_GLYPHS = {
  lives: 'BART x{instances}',
  worldTime: 'WORLD {world}-{level}  TIME {time}',
} as const;
const HUD_ICON_KEYS = ['star', 'coin'];
const HUD_TEXT_FORBIDDEN_WORDS = new Set(['LIVES', 'LEVELS']);
const ADD_TEXT_CALL_REGEX = /\b(?:this\.)?add\s*\.\s*text\s*\(/;
const FONT_FAMILY_REGEX = /\bfontFamily\b/;
const BITMAP_TEXT_CALL_REGEX = /\b(?:this\.)?add\s*\.\s*bitmapText\s*\(/;

type ContractReferenceTargetDocRow = {
  name: string;
  path: string;
  role: string;
  requiredRaw: string;
  required: boolean;
  scenes: string[];
  reason: string;
  notes: string;
};

type ContractSceneExceptionDocRow = {
  scene: string;
  rationale: string;
  approvedBy: string;
  since: string;
  notes: string;
};

type ContractMetadataDoc = {
  contractVersion?: string;
  authoritativeSource?: string;
  referenceTargetSource?: string;
  sceneLockScope?: string;
};
type PlayerAnimSourceMode = 'single' | 'range';
type PlayerAnimDefinition = {
  form: 'small' | 'big';
  state: string;
  key: string;
  source: PlayerAnimSourceMode;
  frames: number[];
  sourceRaw: string;
};
type PlayerAnimDefinitionsByForm = {
  small: Record<string, PlayerAnimDefinition>;
  big: Record<string, PlayerAnimDefinition>;
};

const SCENE_EXCEPTION_RATIONALES = new Set<SceneStyleExceptionRationale>([
  'system-only',
  'transient-ui',
  'non-blocking transition',
  'legacy',
]);

function readSource(filePath: string): string {
  const abs = path.resolve(filePath);
  if (!fs.existsSync(abs)) {
    return '';
  }
  return fs.readFileSync(abs, 'utf-8');
}

function readJson(filePath: string): unknown {
  const abs = path.resolve(filePath);
  if (!fs.existsSync(abs)) {
    return undefined;
  }
  return JSON.parse(fs.readFileSync(abs, 'utf-8'));
}

function readManifestImagePath(descriptor: string | { path: string }): string {
  return typeof descriptor === 'string' ? descriptor : descriptor.path;
}

function parseDocPaletteRows(content: string): Map<string, string> {
  const entries = new Map<string, string>();
  const rows = content.split('\n');
  for (const row of rows) {
    const match = row.match(/^\|\s*([A-Za-z0-9_-]+)\s*\|\s*`(#[0-9a-fA-F]{6})`\s*\|/);
    if (match) {
      entries.set(match[1], match[2].toUpperCase());
    }
  }
  return entries;
}

function parseMarkdownSection(content: string, heading: string): string[] {
  const lines = content.split('\n');
  const targetHeading = `## ${heading}`;
  const start = lines.findIndex((line) => line.trim() === targetHeading);
  if (start < 0) {
    return [];
  }
  const section: string[] = [];
  for (let i = start + 1; i < lines.length; i += 1) {
    const line = lines[i];
    if (line.startsWith('## ') && !line.startsWith(targetHeading)) {
      break;
    }
    section.push(line);
  }
  return section;
}

function parseContractScopeScenes(content: string): string[] {
  const section = parseMarkdownSection(content, 'Contract Scope');
  if (section.length === 0) {
    return [];
  }

  const userFacingLine = section.find((line) => /user-facing scenes/i.test(line));
  if (!userFacingLine) {
    return [];
  }

  const [, scenesString] = userFacingLine.split(':', 2);
  if (!scenesString) {
    return [];
  }

  return scenesString
    .split(',')
    .map((scene) => scene.replace(/`/g, '').trim())
    .map((scene) => scene.replace(/[.;]$/, ''))
    .filter(Boolean);
}

function parsePlayerAnimationDefinitions(source: string, errors: ErrorList): PlayerAnimDefinitionsByForm {
  const definitionBlocks = source.match(/scene\.anims\.create\(\{[\s\S]*?\}\);/g) ?? [];
  const definitions: PlayerAnimDefinitionsByForm = { small: Object.create(null), big: Object.create(null) };
  const singleFramesByName = parseSingleFramesFromSource(source, errors);

  for (const block of definitionBlocks) {
    const keyMatch = block.match(/key:\s*([`'"][^`'"]*[`'"])/);
    if (!keyMatch) {
      continue;
    }

    const key = keyMatch[1].slice(1, -1);
    const forms: Array<'small' | 'big'> = [];
    let state = '';

    const literalMatch = key.match(/^bart_([sb])_(.+)$/);
    if (literalMatch) {
      forms.push(literalMatch[1] === 's' ? 'small' : 'big');
      state = literalMatch[2];
    } else {
      const templateMatch = key.match(/^\$\{prefix\}(.+)$/);
      if (templateMatch) {
        forms.push('small', 'big');
        state = templateMatch[1];
      } else {
        const templateNameMatch = key.match(/^\$\{prefix\}\$\{name\}$/);
        if (templateNameMatch) {
          forms.push('small', 'big');
          state = '${name}';
        }
      }
    }

    if (forms.length === 0 || !state) {
      errors.push(`Unexpected player animation key "${key}" in src/anim/playerAnims.ts.`);
      continue;
    }
    const isTemplateName = state === '${name}';

    if (!state || !state.trim()) {
      errors.push(`Player animation key "${key}" is missing a state suffix.`);
      continue;
    }

    const rangeMatch = block.match(/generateFrameNumbers\([^,]+,\s*\{\s*start:\s*(\d+)\s*,\s*end:\s*(\d+)\s*\}\s*\)/);
    if (rangeMatch) {
      const start = Number(rangeMatch[1]);
      const end = Number(rangeMatch[2]);
      if (!Number.isInteger(start) || !Number.isInteger(end) || start > end || start < 0 || end < 0) {
        errors.push(`Player animation "${key}" has invalid generateFrameNumbers range ${rangeMatch[1]}-${rangeMatch[2]}.`);
        continue;
      }
      const frames = new Array(end - start + 1);
      for (let i = 0; i < frames.length; i += 1) {
        frames[i] = start + i;
      }
      for (const form of forms) {
        const slot = form === 'small' ? definitions.small : definitions.big;
        if (slot[state]) {
          errors.push(`Duplicate player animation "${key}" in src/anim/playerAnims.ts.`);
        }
        slot[state] = { form, state, key, source: 'range', frames, sourceRaw: block };
      }
      continue;
    }

    const singleMatch = block.match(
      /frames:\s*\[\s*\{\s*(?:key(?:\s*:\s*[^,]+)?\s*,\s*frame:\s*(\d+)\s*}\s*\])/,
    );
    if (singleMatch) {
      const frame = Number(singleMatch[1]);
      if (!Number.isInteger(frame) || frame < 0) {
        errors.push(`Player animation "${key}" has invalid frame number ${singleMatch[1]}.`);
        continue;
      }
      for (const form of forms) {
        const slot = form === 'small' ? definitions.small : definitions.big;
        if (slot[state]) {
          errors.push(`Duplicate player animation "${key}" in src/anim/playerAnims.ts.`);
        }
        slot[state] = { form, state, key, source: 'single', frames: [frame], sourceRaw: block };
      }
      continue;
    }

    if (isTemplateName) {
      const stateEntries = Object.entries(singleFramesByName);
      if (stateEntries.length === 0) {
        errors.push(`Could not resolve "${key}" state list from src/anim/playerAnims.ts.`);
        continue;
      }
      for (const [namedState, namedFrame] of stateEntries) {
        for (const form of forms) {
          const slot = form === 'small' ? definitions.small : definitions.big;
          if (slot[namedState]) {
            errors.push(`Duplicate player animation "${key}" (${namedState}) in src/anim/playerAnims.ts.`);
          }
          slot[namedState] = { form, state: namedState, key, source: 'single', frames: [namedFrame], sourceRaw: block };
        }
      }
      continue;
    }

    errors.push(`Player animation "${key}" is missing a recognized frame expression (single frame or generateFrameNumbers).`);
  }

  return definitions;
}

function parsePlayerAnimatorStateToFrame(source: string, errors: ErrorList): Record<string, number> {
  const result: Record<string, number> = Object.create(null);
  const mapMatch = source.match(/const\s+STATE_TO_FRAME[^=]*=\s*\{([\s\S]*?)\n\};/);
  if (!mapMatch) {
    errors.push('Failed to parse PlayerAnimator STATE_TO_FRAME map from src/player/PlayerAnimator.ts.');
    return result;
  }

  const lines = mapMatch[1].split('\n');
  for (const line of lines) {
    const entryMatch = line.match(/^\s*(\w+)\s*:\s*(\d+),?\s*$/);
    if (!entryMatch) {
      continue;
    }
    const state = entryMatch[1];
    const frame = Number(entryMatch[2]);
    if (!Number.isInteger(frame) || frame < 0) {
      errors.push(`PlayerAnimator STATE_TO_FRAME has invalid frame index for "${state}": ${entryMatch[2]}.`);
      continue;
    }
    if (result[state] !== undefined) {
      errors.push(`PlayerAnimator STATE_TO_FRAME contains duplicate state "${state}".`);
      continue;
    }
    result[state] = frame;
  }

  if (Object.keys(result).length === 0) {
    errors.push('PlayerAnimator STATE_TO_FRAME map was parsed but produced no entries.');
  }
  return result;
}

function parseSingleFramesFromSource(source: string, errors: ErrorList): Record<string, number> {
  const result = Object.create(null) as Record<string, number>;
  const match = source.match(/const\s+singleFrames:\s*Array<\[[^\]]+\]>\s*=\s*\[([\s\S]*?)\];/);
  if (!match) {
    return result;
  }

  const body = match[1];
  const entryRegex = /\[\s*['"]([^'"]+)['"]\s*,\s*(\d+)\s*\]/g;
  let m;
  while ((m = entryRegex.exec(body)) !== null) {
    const state = m[1];
    const frame = Number(m[2]);
    if (!Number.isInteger(frame) || frame < 0) {
      errors.push(`Failed to parse single frame entry "${state}" from src/anim/playerAnims.ts.`);
      continue;
    }
    result[state] = frame;
  }
  return result;
}

function parseHeadOffsetCount(source: string, symbol: 'SMALL_HEAD_OFFSETS' | 'BIG_HEAD_OFFSETS', errors: ErrorList): number | null {
  const marker = `export const ${symbol}`;
  const markerIndex = source.indexOf(marker);
  if (markerIndex < 0) {
    errors.push(`Could not find ${symbol} export in src/anim/headOffsets.ts.`);
    return null;
  }
  const assignmentIndex = source.indexOf('=', markerIndex);
  if (assignmentIndex < 0) {
    errors.push(`Could not parse ${symbol} body in src/anim/headOffsets.ts.`);
    return null;
  }
  const openBracket = source.indexOf('[', assignmentIndex);
  if (openBracket < 0) {
    errors.push(`Could not parse ${symbol} body array in src/anim/headOffsets.ts.`);
    return null;
  }

  let depth = 0;
  let closeBracket = -1;
  for (let i = openBracket; i < source.length; i += 1) {
    const ch = source[i];
    if (ch === '[') {
      depth += 1;
      continue;
    }
    if (ch === ']') {
      depth -= 1;
      if (depth === 0) {
        closeBracket = i;
        break;
      }
    }
  }

  if (closeBracket < 0) {
    errors.push(`Could not locate end of ${symbol} array in src/anim/headOffsets.ts.`);
    return null;
  }

  const body = source.slice(openBracket + 1, closeBracket);
  const matches = body.match(/\{[^}]*\}/g);
  return matches ? matches.length : 0;
}

function parseManifestSpritesheetFrameCount(
  key: 'bart_body_small' | 'bart_body_big',
  errors: ErrorList,
): number | null {
  const descriptor = ASSET_MANIFEST.spritesheets[key];
  if (!descriptor) {
    errors.push(`ASSET_MANIFEST.spritesheets is missing "${key}".`);
    return null;
  }
  const absPath = path.resolve(`public/${descriptor.path.replace(/^\//, '')}`);
  if (!fs.existsSync(absPath)) {
    errors.push(`Player sprite sheet "${key}" is missing on disk: ${descriptor.path}`);
    return null;
  }

  let image;
  try {
    image = readPng(absPath);
  } catch {
    errors.push(`Failed to decode player sprite sheet "${key}" from ${descriptor.path}.`);
    return null;
  }

  if (image.width % descriptor.frameWidth !== 0 || image.height % descriptor.frameHeight !== 0) {
    errors.push(
      `Player sprite sheet "${key}" dimensions must be divisible by frame size ${descriptor.frameWidth}x${descriptor.frameHeight}, got ${image.width}x${image.height}.`,
    );
    return null;
  }
  return (image.width / descriptor.frameWidth) * (image.height / descriptor.frameHeight);
}

function validatePlayerAnimationContract(errors: ErrorList): void {
  const contract = styleConfig.playerAnimationContract;
  if (!contract || !Array.isArray(contract.states) || contract.states.length === 0) {
    errors.push('styleConfig.playerAnimationContract must define a non-empty expected state list.');
    return;
  }
  if (contract.source !== 'src/player/PlayerAnimator.ts') {
    errors.push(`styleConfig.playerAnimationContract.source must be "src/player/PlayerAnimator.ts", received "${contract.source}".`);
  }

  const contractStateSet = new Set<string>();
  for (const state of contract.states) {
    if (typeof state !== 'string' || state.trim().length === 0) {
      errors.push('styleConfig.playerAnimationContract contains an invalid state entry.');
      continue;
    }
    if (contractStateSet.has(state)) {
      errors.push(`styleConfig.playerAnimationContract contains duplicate state "${state}".`);
      continue;
    }
    contractStateSet.add(state);
  }

  const animSource = readSource('src/anim/playerAnims.ts');
  const animatorSource = readSource('src/player/PlayerAnimator.ts');
  const headOffsetSource = readSource('src/anim/headOffsets.ts');

  if (!animSource) {
    errors.push('Expected player animation source file missing: src/anim/playerAnims.ts');
    return;
  }
  if (!animatorSource) {
    errors.push('Expected player animation runtime map file missing: src/player/PlayerAnimator.ts');
    return;
  }
  if (!headOffsetSource) {
    errors.push('Expected head-offset source file missing: src/anim/headOffsets.ts');
    return;
  }

  const animations = parsePlayerAnimationDefinitions(animSource, errors);
  const stateToFrame = parsePlayerAnimatorStateToFrame(animatorSource, errors);
  const stateNames = Object.keys(stateToFrame).sort();
  const stateNameSet = new Set(stateNames);
  const contractSortedStates = [...contractStateSet].sort();

  if (contract.requireExactStates) {
    if (contractSortedStates.length !== stateNameSet.size || contractSortedStates.some((state, index) => state !== stateNames[index])) {
      errors.push(
        `Player animation state parity mismatch: styleConfig.playerAnimationContract.states (${contractSortedStates.join(', ')}) must match PlayerAnimator.STATE_TO_FRAME keys (${stateNames.join(', ')}).`,
      );
    }
  } else {
    if (contractSortedStates.length > stateNameSet.size) {
      errors.push(
        `PlayerAnimator.STATE_TO_FRAME is missing contract states from styleConfig.playerAnimationContract: ${contractSortedStates.filter((state) => !stateNameSet.has(state)).join(', ')}.`,
      );
    }
  }

  if (stateNames.length === 0) {
    errors.push('PlayerAnimator STATE_TO_FRAME is empty; cannot validate animation-frame contract.');
  }

  const smallFrameCount = parseManifestSpritesheetFrameCount('bart_body_small', errors);
  const bigFrameCount = parseManifestSpritesheetFrameCount('bart_body_big', errors);

  if (smallFrameCount == null || bigFrameCount == null) {
    return;
  }

  const smallOffsetsCount = parseHeadOffsetCount(headOffsetSource, 'SMALL_HEAD_OFFSETS', errors);
  const bigOffsetsCount = parseHeadOffsetCount(headOffsetSource, 'BIG_HEAD_OFFSETS', errors);

  if (smallOffsetsCount != null && smallOffsetsCount !== smallFrameCount) {
    errors.push(`SMALL_HEAD_OFFSETS length must equal bart_body_small frame count ${smallFrameCount}, received ${smallOffsetsCount}.`);
  }
  if (bigOffsetsCount != null && bigOffsetsCount !== bigFrameCount) {
    errors.push(`BIG_HEAD_OFFSETS length must equal bart_body_big frame count ${bigFrameCount}, received ${bigOffsetsCount}.`);
  }

  for (const frameValue of Object.values(stateToFrame)) {
    if (!Number.isInteger(frameValue) || frameValue < 0) {
      continue;
    }
    if (frameValue >= smallFrameCount) {
      errors.push(`PlayerAnimator STATE_TO_FRAME frame index ${frameValue} must be < small frame count ${smallFrameCount}.`);
    }
    if (frameValue >= bigFrameCount) {
      errors.push(`PlayerAnimator STATE_TO_FRAME frame index ${frameValue} must be < big frame count ${bigFrameCount}.`);
    }
    if (smallOffsetsCount != null && frameValue >= smallOffsetsCount) {
      errors.push(`PlayerAnimator STATE_TO_FRAME frame index ${frameValue} must be < SMALL_HEAD_OFFSETS length ${smallOffsetsCount}.`);
    }
    if (bigOffsetsCount != null && frameValue >= bigOffsetsCount) {
      errors.push(`PlayerAnimator STATE_TO_FRAME frame index ${frameValue} must be < BIG_HEAD_OFFSETS length ${bigOffsetsCount}.`);
    }
  }

  const expectedStates = new Set(stateNames);
  for (const contractState of contractStateSet) {
    if (!expectedStates.has(contractState)) {
      errors.push(`Player animation contract state "${contractState}" from styleConfig.playerAnimationContract is not present in STATE_TO_FRAME.`);
    }
  }
  for (const state of expectedStates) {
    if (!contractStateSet.has(state)) {
      errors.push(`STATE_TO_FRAME state "${state}" is not listed in styleConfig.playerAnimationContract.`);
    }
  }

  for (const form of ['small', 'big'] as const) {
    const formDefinitions = animations[form];
    const definedStates = Object.keys(formDefinitions).sort();

    if (definedStates.length !== expectedStates.size) {
      errors.push(
        `Player animation definitions for ${form} must include all states from STATE_TO_FRAME (${[...expectedStates].sort().join(', ')}), `
          + `received ${definedStates.join(', ')}.`,
      );
    }

    for (const state of expectedStates) {
      const definition = formDefinitions[state];
      if (!definition) {
        errors.push(`Player animation "${form}" form is missing state "${state}" in src/anim/playerAnims.ts.`);
        continue;
      }

      if (!definition.frames.length) {
        errors.push(`Player animation definition for ${form}/"${state}" must include at least one frame.`);
        continue;
      }

      const uniqueFrames = new Set(definition.frames);
      if (uniqueFrames.size !== definition.frames.length) {
        errors.push(`Player animation "${form}/${state}" contains duplicate frame entries.`);
      }

      const stateMapFrame = stateToFrame[state];
      if (stateMapFrame == null) {
        errors.push(`STATE_TO_FRAME is missing mapping for player animation state "${state}".`);
        continue;
      }

      if (!Number.isInteger(stateMapFrame) || stateMapFrame < 0) {
        errors.push(`STATE_TO_FRAME value for "${state}" must be a valid non-negative frame index.`);
        continue;
      }

      if (definition.source === 'single') {
        const only = definition.frames[0];
        if (only !== stateMapFrame) {
          errors.push(
            `Single-frame animation "${form}/${state}" uses frame ${only} but STATE_TO_FRAME requires frame ${stateMapFrame}.`,
          );
        }
      } else {
        if (definition.frames.length < 2) {
          errors.push(`Range animation "${form}/${state}" must include at least two frames.`);
        }
        if (!definition.frames.includes(stateMapFrame)) {
          errors.push(
            `Range animation "${form}/${state}" does not include STATE_TO_FRAME frame ${stateMapFrame}.`,
          );
        }
        if (definition.frames[0] !== stateMapFrame) {
          errors.push(`Range animation "${form}/${state}" should start at STATE_TO_FRAME frame ${stateMapFrame}.`);
        }
      }

      for (const frame of definition.frames) {
        if (!Number.isInteger(frame) || frame < 0) {
          errors.push(`Player animation "${form}/${state}" has invalid frame value ${frame}.`);
          continue;
        }
        if (frame >= smallFrameCount) {
          errors.push(`Player animation "${form}/${state}" frame ${frame} exceeds small spritesheet frames (${smallFrameCount}).`);
        }
        if (frame >= bigFrameCount) {
          errors.push(`Player animation "${form}/${state}" frame ${frame} exceeds big spritesheet frames (${bigFrameCount}).`);
        }
      }
    }

    for (const state of definedStates) {
      if (!expectedStates.has(state)) {
        errors.push(`Player animation "${form}" defines extra state "${state}" not present in STATE_TO_FRAME.`);
      }
    }
  }

  for (const state of stateNames) {
    const smallDef = animations.small[state];
    const bigDef = animations.big[state];
    if (!smallDef || !bigDef) {
      continue;
    }
    if (smallDef.source !== bigDef.source) {
      errors.push(`Player animation source mode for state "${state}" must match across small and big forms.`);
    }
    if (smallDef.frames.length !== bigDef.frames.length) {
      errors.push(`Player animation frame span for small/big form state "${state}" must match (lengths ${smallDef.frames.length} vs ${bigDef.frames.length}).`);
    }
    if (smallDef.frames.join(',') !== bigDef.frames.join(',')) {
      errors.push(`Player animation "${state}" should use the same frame sequence for small and big forms.`);
    }
  }
}

function splitTableRow(line: string): string[] {
  if (!line.includes('|')) {
    return [];
  }
  return line
    .trim()
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map((cell) => cell.trim().replace(/^`|`$/g, ''));
}

function parseMarkdownTableRows(lines: string[]): string[][] {
  const rows = lines.filter((line) => line.trim().startsWith('|')).map(splitTableRow).filter((row) => row.length > 1);
  return rows.filter((row) => !(row.length > 1 && row.every((cell) => /^:?-{3,}:?$/.test(cell))));
}

function parsePlayerAnimationContractDoc(content: string): { states: string[]; source: string } {
  const section = parseMarkdownSection(content, 'Player Animation Contract');
  if (section.length === 0) {
    return { states: [], source: '' };
  }

  const stateLine = section.find((line) => /stateContract/i.test(line));
  const sourceLine = section.find((line) => /Contract source/i.test(line));

  const statePayload = stateLine ? stateLine.split(':', 2)[1] ?? '' : '';
  const stateMatches = statePayload ? [...statePayload.matchAll(/`([a-z_]+)`/gi)] : [];
  const sourceMatch = sourceLine ? sourceLine.match(/`([^`]+)`/) : null;

  return {
    states: stateMatches.map((entry) => entry[1]).filter(Boolean),
    source: sourceMatch ? sourceMatch[1] : '',
  };
}

function parseReferenceContractDocRows(content: string): ContractReferenceTargetDocRow[] {
  const sectionRows = parseMarkdownSection(content, 'Reference Contract');
  const rows = parseMarkdownTableRows(sectionRows);
  if (rows.length < 2) {
    return [];
  }
  const header = rows[0];
  const index = Object.fromEntries(header.map((cell, idx) => [cell.toLowerCase(), idx]));
  const expectedHeaders = ['name', 'path', 'role', 'required', 'scenes', 'reason', 'notes'];
  const missingHeader = expectedHeaders.find((column) => !Object.prototype.hasOwnProperty.call(index, column));
  if (missingHeader) {
    return [];
  }
  return rows.slice(1).map((row) => ({
    name: row[index.name],
    path: row[index.path],
    role: row[index.role],
    requiredRaw: row[index.required] ?? '',
    required: /^(true|yes|required)$/i.test(row[index.required] ?? ''),
    scenes: (row[index.scenes] ?? '').replace(/^`|`$/g, '').split(',').map((scene) => scene.trim()).filter(Boolean),
    reason: (row[index.reason] ?? '').replace(/^`|`$/g, ''),
    notes: (row[index.notes] ?? '').replace(/^`|`$/g, ''),
  }));
}

function parseSceneExceptionsDocRows(content: string): ContractSceneExceptionDocRow[] {
  const sectionRows = parseMarkdownSection(content, 'Scene Style Exceptions');
  const rows = parseMarkdownTableRows(sectionRows);
  if (rows.length < 2) {
    return [];
  }
  const header = rows[0];
  const index = Object.fromEntries(header.map((cell, idx) => [cell.toLowerCase(), idx]));
  const expectedHeaders = ['scene', 'rationale', 'approvedby', 'since', 'notes'];
  const missingHeader = expectedHeaders.find((column) => !Object.prototype.hasOwnProperty.call(index, column));
  if (missingHeader) {
    return [];
  }
  return rows
    .slice(1)
    .filter((row) => {
      const scene = (row[index.scene] ?? '').toLowerCase().trim();
      return scene.length > 0 && scene !== 'none' && scene !== '(none)';
    })
    .map((row) => ({
    scene: row[index.scene],
    rationale: row[index.rationale],
    approvedBy: row[index.approvedby],
    since: row[index.since],
    notes: row[index.notes] ?? '',
  }));
}

function parseContractMetadataDoc(content: string): ContractMetadataDoc {
  const rows = parseMarkdownSection(content, 'Contract Metadata');
  const metadata: ContractMetadataDoc = {};

  for (const row of rows) {
    const match = row.match(/^\s*-\s*([^:]+):\s*(.+)\s*$/);
    if (!match) {
      continue;
    }

    const key = match[1]?.trim().toLowerCase().replace(/[^a-z]/g, '') as keyof ContractMetadataDoc | string;
    const rawValue = match[2]?.trim() ?? '';
    const value = rawValue.replace(/`([^`]*)`/g, '$1').trim();

    if (key === CONTRACT_METADATA_KEYS.contractVersion) {
      metadata.contractVersion = value;
      continue;
    }
    if (key === CONTRACT_METADATA_KEYS.authoritativeSource) {
      metadata.authoritativeSource = value;
      continue;
    }
    if (key === CONTRACT_METADATA_KEYS.referenceTargetSource) {
      metadata.referenceTargetSource = value;
      continue;
    }
    if (key === CONTRACT_METADATA_KEYS.sceneLockScope) {
      metadata.sceneLockScope = value;
    }
  }

  return metadata;
}

function validatePlayerAnimationContractDocs(errors: ErrorList, content: string): void {
  const parsed = parsePlayerAnimationContractDoc(content);
  const contract = styleConfig.playerAnimationContract;
  if (!contract || !Array.isArray(contract.states)) {
    errors.push('styleConfig.playerAnimationContract is required for Player Animation Contract documentation checks.');
    return;
  }

  if (parsed.states.length === 0) {
    errors.push('docs/style_kit.md must include a Player Animation Contract stateContract line.');
    return;
  }
  if (parsed.source !== contract.source) {
    errors.push(
      `docs/style_kit.md Player Animation Contract source must be "${contract.source}", received "${parsed.source || 'missing'}".`,
    );
  }

  const contractSet = new Set(contract.states);
  const parsedSet = new Set(parsed.states);
  if (contractSet.size !== parsedSet.size) {
    errors.push(
      `docs/style_kit.md Player Animation Contract state count must match styleConfig.playerAnimationContract.state length (${contractSet.size})`,
    );
  }

  for (const state of contractSet) {
    if (!parsedSet.has(state)) {
      errors.push(`docs/style_kit.md Player Animation Contract must include state "${state}".`);
    }
  }
  for (const state of parsedSet) {
    if (!contractSet.has(state)) {
      errors.push(`docs/style_kit.md Player Animation Contract includes unknown state "${state}" not in styleConfig.playerAnimationContract.`);
    }
  }
}

function cleanTextForChecks(source: string): string {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/.*$/gm, '')
    .replace(/(["'`])(?:\\.|(?!\1)[\s\S])*?\1/g, '');
}

function isLivesHudTemplate(value: string): boolean {
  return /BART x\{instances\}/.test(value);
}

function isWorldTimeHudTemplate(value: string): boolean {
  return /WORLD \{world\}-\{level\}/.test(value) && /TIME \{time\}/.test(value);
}

function extractQuotedText(source: string): string[] {
  const matches = source.match(/(["'`])(?:\\.|(?!\1)[\s\S])*?\1/g) ?? [];
  return matches
    .map((raw) => raw.slice(1, -1))
    .filter((entry) => entry.length > 0);
}

function addWarning(warnings: WarningList, message: string): void {
  warnings.push(message);
}

function assertRange(errors: ErrorList, label: string, value: number, min: number, max: number): void {
  if (!Number.isFinite(value) || value < min || value > max) {
    errors.push(`${label} out of range: expected ${min}-${max}, received ${value}`);
  }
}

function assertHex(errors: ErrorList, label: string, value: string): void {
  if (!/^#[0-9a-fA-F]{6}$/.test(value)) {
    errors.push(`${label} must be a 6-digit hex color, received ${value}`);
  }
}

function normalizeHex(value: string): string {
  return value.trim().toUpperCase();
}

function paletteByName(name: string): string | undefined {
  return SWATCH_BY_NAME.get(name);
}

function hasExpectedOutlineColor(file: string, expected: [number, number, number, number]): boolean {
  if (!fs.existsSync(file)) {
    return false;
  }
  const image = readPng(file);
  for (let i = 0; i < image.data.length; i += 4) {
    if (
      image.data[i] === expected[0] &&
      image.data[i + 1] === expected[1] &&
      image.data[i + 2] === expected[2] &&
      image.data[i + 3] === expected[3]
    ) {
      return true;
    }
  }
  return false;
}

function validateOutlineMetadata(errors: ErrorList, file = OUTLINE_METADATA_PATH): void {
  const payload = readJson(file);
  if (payload == null || typeof payload !== 'object') {
    errors.push('Contract-level outline metadata is missing: public/assets/style_outline_contract.json (run `npm run gen:all`).');
    return;
  }

  const metadata = payload as {
    schemaVersion?: unknown;
    generatedBy?: unknown;
    generatedAt?: unknown;
    source?: unknown;
    outline?: {
      configVersion?: unknown;
      worldPx?: unknown;
      uiPx?: unknown;
      maxPx?: unknown;
      worldColor?: unknown;
      uiColor?: unknown;
      sourceColor?: unknown;
      sourceAlpha?: unknown;
    };
  };

  if (metadata.schemaVersion !== OUTLINE_METADATA_SCHEMA_VERSION) {
    errors.push(
      `Contract-level outline metadata schemaVersion must be ${OUTLINE_METADATA_SCHEMA_VERSION}, received ${String(metadata.schemaVersion)}.`,
    );
  }
  if (typeof metadata.generatedBy !== 'string' || !OUTLINE_GENERATOR_ALLOWLIST.has(metadata.generatedBy)) {
    errors.push(
      `Contract-level outline metadata generatedBy must be one of ${[...OUTLINE_GENERATOR_ALLOWLIST.values()].join(', ')}, received ${
        metadata.generatedBy
      }.`,
    );
  }
  if (typeof metadata.generatedAt !== 'string' || Number.isNaN(Date.parse(metadata.generatedAt))) {
    errors.push('Contract-level outline metadata must include a valid ISO generatedAt timestamp.');
  }
  if (metadata.source !== OUTLINE_SOURCE_DOCUMENT) {
    errors.push(`Contract-level outline metadata source must be "${OUTLINE_SOURCE_DOCUMENT}", received "${String(metadata.source)}".`);
  }

  const outline = metadata.outline;
  if (!outline) {
    errors.push('Contract-level outline metadata must include an "outline" object.');
    return;
  }

  const expected = {
    configVersion: contractVersion,
    worldPx: Math.max(1, Math.floor(styleConfig.outline.worldPx ?? 0)),
    uiPx: Math.max(1, Math.floor(styleConfig.outline.uiPx ?? 0)),
    maxPx: Math.max(1, Math.floor(styleConfig.outline.maxPx ?? 3)),
    worldColor: styleConfig.outline.worldColor ?? styleConfig.outline.sourceColor ?? styleConfig.outline.color ?? 'inkDark',
    uiColor: styleConfig.outline.uiColor ?? styleConfig.outline.sourceColor ?? styleConfig.outline.color ?? 'inkDark',
    sourceColor: styleConfig.outline.sourceColor ?? styleConfig.outline.color ?? 'inkDark',
    sourceAlpha: Math.max(0, Math.min(255, Math.floor(styleConfig.outline.sourceAlpha ?? 220))),
  };

  if (typeof outline.configVersion !== 'string' || outline.configVersion !== expected.configVersion) {
    errors.push(
      `Contract-level outline metadata outline.configVersion must be ${expected.configVersion}, received ${String(outline.configVersion)}.`,
    );
  }
  if (typeof outline.worldPx !== 'number' || Math.floor(outline.worldPx) !== expected.worldPx) {
    errors.push(`Outline metadata worldPx must be ${expected.worldPx}, received ${String(outline.worldPx)}.`);
  }
  if (typeof outline.uiPx !== 'number' || Math.floor(outline.uiPx) !== expected.uiPx) {
    errors.push(`Outline metadata uiPx must be ${expected.uiPx}, received ${String(outline.uiPx)}.`);
  }
  if (typeof outline.maxPx !== 'number' || Math.floor(outline.maxPx) !== expected.maxPx) {
    errors.push(`Outline metadata maxPx must be ${expected.maxPx}, received ${String(outline.maxPx)}.`);
  }
  if (outline.worldColor !== expected.worldColor) {
    errors.push(`Contract-level outline metadata worldColor must be ${expected.worldColor}, received ${String(outline.worldColor)}.`);
  }
  if (outline.uiColor !== expected.uiColor) {
    errors.push(`Contract-level outline metadata uiColor must be ${expected.uiColor}, received ${String(outline.uiColor)}.`);
  }
  if (outline.sourceColor !== expected.sourceColor) {
    errors.push(
      `Contract-level outline metadata sourceColor must be ${expected.sourceColor}, received ${String(outline.sourceColor)}.`,
    );
  }
  const outlineSourceAlpha = Number.isFinite(Number(outline.sourceAlpha)) ? Math.floor(Number(outline.sourceAlpha)) : NaN;
  if (Number.isNaN(outlineSourceAlpha) || outlineSourceAlpha !== expected.sourceAlpha) {
    errors.push(
      `Contract-level outline metadata sourceAlpha must be ${expected.sourceAlpha}, received ${String(outline.sourceAlpha)}.`,
    );
  }
}

function validateReferenceContractDocs(errors: ErrorList, content: string): void {
  const docRows = parseReferenceContractDocRows(content);
  if (docRows.length === 0) {
    errors.push('Contract-level reference targets table is missing or malformed in docs/style_kit.md.');
    return;
  }

  const requiredValuePattern = /^(true|false|yes|no|required|optional)$/i;
  const docTargetNames = new Set<string>();

  const requiredDocTargets = docRows.filter((row) => row.required).length;
  if (requiredDocTargets !== 1) {
    errors.push(`Reference contract docs must mark exactly one target as required, received ${requiredDocTargets}.`);
  }

  for (const docRow of docRows) {
    if (docTargetNames.has(docRow.name)) {
      errors.push(`Reference contract docs include duplicate target name "${docRow.name}".`);
    }
    docTargetNames.add(docRow.name);

    if (!requiredValuePattern.test(docRow.requiredRaw)) {
      errors.push(`Reference contract docs required value for "${docRow.name}" must be one of true/false/yes/no/required/optional.`);
    }
    if (!ALLOWED_REFERENCE_ROLES.has(docRow.role)) {
      errors.push(`Reference contract docs role for "${docRow.name}" must be primary|secondary|supplemental, received "${docRow.role}".`);
    }
  }

  const targets = Array.isArray(styleConfig.referenceTargets) ? styleConfig.referenceTargets : [];
  if (targets.length !== docRows.length) {
    errors.push(
      `Reference target row count mismatch: docs/style_kit.md has ${docRows.length}, styleConfig.referenceTargets has ${targets.length}.`,
    );
  }

  const docByName = new Map(docRows.map((row) => [row.name, row]));
  const namesInTarget = new Set<string>();
  for (const target of targets) {
    namesInTarget.add(target.name);
    const docRow = docByName.get(target.name);
    if (!docRow) {
      errors.push(`Reference contract docs are missing target "${target.name}".`);
      continue;
    }

    if (docRow.path !== target.path) {
      errors.push(`Reference contract path mismatch for "${target.name}": expected "${target.path}", docs "${docRow.path}".`);
    }
    if (docRow.role !== target.role) {
      errors.push(`Reference contract role mismatch for "${target.name}": expected "${target.role}", docs "${docRow.role}".`);
    }
    if (docRow.required !== target.required) {
      errors.push(`Reference contract required flag mismatch for "${target.name}".`);
    }
    if ((target.reason ?? '') !== docRow.reason) {
      errors.push(`Reference contract reason mismatch for "${target.name}".`);
    }

    const targetScenes = [...(target.scenes ?? [])].sort();
    const docScenes = [...(docRow.scenes ?? [])].sort();
    if (targetScenes.length !== docScenes.length || targetScenes.some((scene, index) => scene !== docScenes[index])) {
      errors.push(`Reference contract scenes mismatch for "${target.name}": expected "${targetScenes.join(', ')}", docs "${docScenes.join(', ')}".`);
    }
  }

  for (const row of docRows) {
    if (!namesInTarget.has(row.name)) {
      errors.push(`Reference contract docs include unknown target "${row.name}" not in styleConfig.referenceTargets.`);
    }
  }

  if (sceneLockScope !== 'all-user-facing' && sceneLockScope !== 'core-only') {
    errors.push(`styleConfig.sceneLockScope has unexpected value "${sceneLockScope}".`);
  }
}

function validateSceneExceptionContracts(errors: ErrorList, content: string): void {
  const exceptions = Array.isArray(styleConfig.sceneStyleExceptions) ? styleConfig.sceneStyleExceptions : [];
  const knownScenes = new Set(Object.keys(SCENE_PATHS));
  const seenScenes = new Set<string>();
  const docsRows = parseSceneExceptionsDocRows(content);
  const exceptionSection = parseMarkdownSection(content, 'Scene Style Exceptions');
  const hasNoExceptionsStatement = exceptionSection.some((line) => NO_EXCEPTIONS_DOC_STMT.test(line));

  if (exceptions.length === 0 && docsRows.length === 0 && !hasNoExceptionsStatement) {
    errors.push(
      'Scene Style Exceptions must document zero exceptions with the explicit statement "No approved scene exceptions are currently documented."',
    );
  }

  if (exceptions.length !== docsRows.length) {
    errors.push(
      `sceneStyleExceptions count mismatch: styleConfig has ${exceptions.length}, docs/style_kit.md has ${docsRows.length}.`,
    );
  }

  if (!Array.isArray(exceptions)) {
    errors.push('styleConfig.sceneStyleExceptions must be an array.');
    return;
  }

  const docsByScene = new Map(docsRows.map((row) => [row.scene, row]));
  for (const exception of exceptions) {
    if (!exception.scene || exception.scene.trim().length === 0) {
      errors.push('Each sceneStyleException must define a scene.');
      continue;
    }
    if (!knownScenes.has(exception.scene)) {
      errors.push(`sceneStyleException scene "${exception.scene}" is unknown.`);
    }
    if (seenScenes.has(exception.scene)) {
      errors.push(`sceneStyleException scene "${exception.scene}" is duplicated.`);
    }
    seenScenes.add(exception.scene);
    if (!SCENE_EXCEPTION_RATIONALES.has(exception.rationale)) {
      errors.push(
        `sceneStyleException "${exception.scene}" has invalid rationale "${String(exception.rationale)}".`,
      );
    }
    if (typeof exception.approvedBy !== 'string' || exception.approvedBy.trim().length === 0) {
      errors.push(`sceneStyleException "${exception.scene}" requires non-empty approvedBy.`);
    }
    if (typeof exception.since !== 'string' || exception.since.trim().length === 0) {
      errors.push(`sceneStyleException "${exception.scene}" requires non-empty since.`);
    }

    const docsEntry = docsByScene.get(exception.scene);
    if (!docsEntry) {
      errors.push(`sceneStyleException "${exception.scene}" must be documented in docs/style_kit.md Scene Style Exceptions.`);
      continue;
    }
    if (!docsEntry.rationale || docsEntry.rationale.trim().length === 0) {
      errors.push(`Scene Style Exceptions docs entry for "${exception.scene}" requires a non-empty rationale.`);
    }
    if (!docsEntry.approvedBy || docsEntry.approvedBy.trim().length === 0) {
      errors.push(`Scene Style Exceptions docs entry for "${exception.scene}" requires a non-empty approvedBy.`);
    }
    if (!docsEntry.since || docsEntry.since.trim().length === 0) {
      errors.push(`Scene Style Exceptions docs entry for "${exception.scene}" requires a non-empty since.`);
    }
    if (docsEntry.rationale !== exception.rationale) {
      errors.push(`Scene Style Exceptions docs mismatch for "${exception.scene}" rationale.`);
    }
    if (docsEntry.approvedBy !== exception.approvedBy) {
      errors.push(`Scene Style Exceptions docs mismatch for "${exception.scene}" approvedBy.`);
    }
    if (docsEntry.since !== exception.since) {
      errors.push(`Scene Style Exceptions docs mismatch for "${exception.scene}" since.`);
    }
  }

  for (const docRow of docsRows) {
    const match = exceptions.find((entry) => entry.scene === docRow.scene);
    if (!match) {
      errors.push(`Scene Style Exceptions docs include unknown scene "${docRow.scene}" not present in styleConfig.sceneStyleExceptions.`);
    }
  }
}

function validateContractMetadataDoc(errors: ErrorList, content: string): void {
  if (!content.includes('## Contract Scope')) {
    errors.push('docs/style_kit.md must include a Contract Scope section.');
  }

  const scopeScenes = parseContractScopeScenes(content);
  if (scopeScenes.length === 0) {
    errors.push('Contract Scope section must include a user-facing scene list.');
  } else {
    const expectedScenes = [...USER_FACING_SCENES].sort();
    const observedScenes = [...new Set(scopeScenes)].sort();

    if (expectedScenes.length !== observedScenes.length) {
      errors.push(
        `Contract Scope must include exactly ${expectedScenes.length} user-facing scenes, observed ${observedScenes.length}.`,
      );
    }
    const mismatch = expectedScenes.find((scene, index) => scene !== observedScenes[index]);
    if (mismatch || expectedScenes.length !== observedScenes.length) {
      errors.push(
        `Contract Scope user-facing scenes must match lock scope: ${expectedScenes.join(', ')}. Received ${observedScenes.join(', ')}.`,
      );
    }
  }

  const metadata = parseContractMetadataDoc(content);
  if (!metadata.contractVersion) {
    errors.push('docs/style_kit.md Contract Metadata must define contractVersion.');
  } else if (metadata.contractVersion !== contractVersion) {
    errors.push(`docs/style_kit.md contractVersion must be ${contractVersion}, received ${metadata.contractVersion}.`);
  }

  if (metadata.authoritativeSource !== OUTLINE_SOURCE_DOCUMENT) {
    errors.push(
      `docs/style_kit.md Contract Metadata authoritativeSource must be "${OUTLINE_SOURCE_DOCUMENT}", received "${metadata.authoritativeSource ?? 'missing'}".`,
    );
  }

  if (metadata.referenceTargetSource !== 'styleConfig.referenceTargets') {
    errors.push(
      'docs/style_kit.md Contract Metadata referenceTargetSource must be "styleConfig.referenceTargets".',
    );
  }

  if (metadata.sceneLockScope !== sceneLockScope) {
    errors.push(
      `docs/style_kit.md Contract Metadata sceneLockScope must be "${sceneLockScope}", received "${metadata.sceneLockScope ?? 'missing'}".`,
    );
  }
}

function readStyleContractDoc(errors: ErrorList): string {
  const docPath = 'docs/style_kit.md';
  if (!fs.existsSync(docPath)) {
    errors.push('docs/style_kit.md is missing and must define the authoritative target reference and palette.');
    return '';
  }
  return fs.readFileSync(docPath, 'utf-8');
}

function validateReferenceTargets(errors: ErrorList, warnings: WarningList): void {
  const targets = Array.isArray(styleConfig.referenceTargets) ? styleConfig.referenceTargets : [];
  if (targets.length === 0) {
    errors.push('Contract-level reference target list must include at least one entry in styleConfig.referenceTargets.');
    return;
  }

  const requiredTargets = targets.filter((target) => target.required === true);
  if (requiredTargets.length !== 1) {
    errors.push(`Contract-level reference targets must contain exactly one required target, received ${requiredTargets.length}.`);
  }

  if (targets.length !== canonicalReferenceTargets.length) {
    errors.push(
      `styleConfig.referenceTargets must match canonicalReferenceTargets (${canonicalReferenceTargets.length}), received ${targets.length}.`,
    );
  }

  const targetByPath = new Set<string>();
  const targetByName = new Set<string>();
  const targetByScene = new Set<string>();
  const knownScenes = KNOWN_SCENE_KEYS;

  if (sceneLockScope === 'all-user-facing' && USER_FACING_SCENES.length === 0) {
    errors.push('Contract-level all-user-facing lock scope requires at least one user-facing scene in styleConfig.referenceTargets.');
  }

  for (const target of targets) {
    if (!target.path || target.path.trim().length === 0) {
      errors.push('Contract-level reference target entries must define a path.');
      continue;
    }
    if (!target.name || target.name.trim().length === 0) {
      errors.push('Contract-level reference targets must define a non-empty name.');
    }
    if (targetByName.has(target.name)) {
      errors.push(`Contract-level reference target names must be unique: "${target.name}".`);
    }
    targetByName.add(target.name);
    if (!ALLOWED_REFERENCE_ROLES.has(target.role)) {
      errors.push(`Contract-level reference target "${target.path}" has unsupported role "${String(target.role)}".`);
    }
    if (typeof target.reason !== 'string' || target.reason.trim().length === 0) {
      errors.push(
        `Contract-level reference target "${target.name}" must include a non-empty reason explaining lock/coverage semantics.`,
      );
    }
    if (!fs.existsSync(path.resolve(target.path))) {
      errors.push(`Contract-level reference target missing on disk: ${target.path}`);
    }
    if (targetByPath.has(target.path)) {
      errors.push(`Duplicate contract reference target path in referenceTargets: ${target.path}`);
    }
    targetByPath.add(target.path);
    if (!Array.isArray(target.scenes) || target.scenes.length === 0) {
      if (target.required) {
        errors.push(`Contract-level required reference target "${target.path}" must include at least one scene binding.`);
      }
      continue;
    }

    const seenScenes = new Set<string>();
    for (const scene of target.scenes) {
      if (typeof scene !== 'string' || scene.trim().length === 0) {
        errors.push(`Contract-level reference target "${target.path}" contains empty scene entry.`);
        continue;
      }
      if (seenScenes.has(scene)) {
        errors.push(`Contract-level reference target "${target.path}" duplicates scene "${scene}".`);
      }
      seenScenes.add(scene);
      targetByScene.add(scene);
      if (!knownScenes.has(scene)) {
        errors.push(`Contract-level reference target "${target.path}" references unknown scene "${scene}".`);
      }
    }
  }

  const exceptionScenes = new Set((CANONICAL_SCENE_EXCEPTIONS ?? []).map((entry) => entry.scene));
  if (sceneLockScope === 'all-user-facing') {
    for (const scene of USER_FACING_SCENES) {
      if (!targetByScene.has(scene) && !exceptionScenes.has(scene)) {
        errors.push(
          `Contract-level user-facing scene "${scene}" must be assigned to at least one reference target or be in sceneStyleExceptions.`,
        );
      }
    }
  }
}

function validateSceneTypography(errors: ErrorList, warnings: WarningList): void {
  const exceptionScenes = new Set((CANONICAL_SCENE_EXCEPTIONS ?? []).map((entry) => entry.scene));
  const addTextRegex = /\b(?:this\.)?add\s*\.\s*text\s*\(/;
  const fontFamilyRegex = /\bfontFamily\b/;
  const bitmapTextRegex = /\b(?:this\.)?add\s*\.\s*bitmapText\s*\(/;

  for (const scene of USER_FACING_SCENES) {
    const scenePath = SCENE_PATHS[scene];
    if (!scenePath) {
      errors.push(`No scene path mapping for ${scene}.`);
      continue;
    }

    const source = readSource(scenePath);
    if (!source) {
      errors.push(`Expected scene file missing: ${scenePath}`);
      continue;
    }

    const sourceForChecks = cleanTextForChecks(source);
    if (exceptionScenes.has(scene)) {
      if (addTextRegex.test(sourceForChecks) || fontFamilyRegex.test(sourceForChecks)) {
        addWarning(
          warnings,
          `${scene} contains native text usage under an explicit sceneStyleExceptions entry in styleConfig.`,
        );
      }
      continue;
    }

    if (addTextRegex.test(sourceForChecks) || fontFamilyRegex.test(sourceForChecks)) {
      errors.push(`${scene} must not use native text primitives (add.text/fontFamily) in NES-locked scenes.`);
    }
    if (!bitmapTextRegex.test(sourceForChecks)) {
      errors.push(`${scene} must render user-facing text with bitmapText for style-lock consistency.`);
    }
  }
}

function parseStylePaletteFromConfig(): Map<string, string> {
  const map = new Map<string, string>();
  for (const entry of styleConfig.palette.swatches) {
    map.set(entry.name, normalizeHex(entry.hex));
  }
  return map;
}

function validateDocsPalette(errors: ErrorList, content: string): void {
  if (!content) {
    return;
  }
  if (!content.includes('public/assets/target_look.png') || !content.includes('public/assets/target_look_2.jpeg')) {
    errors.push('docs/style_kit.md must list both target_look.png and target_look_2.jpeg as reference assets.');
  }

  const docPalette = parseDocPaletteRows(content);
  const configPalette = parseStylePaletteFromConfig();
  const configNames = new Set(configPalette.keys());

  for (const [name, value] of configPalette.entries()) {
    const docValue = docPalette.get(name);
    if (!docValue) {
      errors.push(`docs/style_kit.md must include canonical swatch "${name}" with value ${value}.`);
      continue;
    }
    if (docValue !== value.toUpperCase()) {
      errors.push(`docs/style_kit.md swatch "${name}" must match config value ${value}, received ${docValue}.`);
    }
  }

  for (const [name, value] of docPalette.entries()) {
    if (!configNames.has(name)) {
      errors.push(`docs/style_kit.md defines swatch "${name}" (${value}) not present in styleConfig.palette.swatches.`);
    }
  }

  if (!content.includes('## Palette')) {
    errors.push('docs/style_kit.md must include a Palette section as the style source-of-truth reference.');
  }
  if (!content.includes('## Reference Contract')) {
    errors.push('docs/style_kit.md must include a Reference Contract section.');
  }
  if (!content.includes('## Scene Style Exceptions')) {
    errors.push('docs/style_kit.md must include a Scene Style Exceptions section.');
  }
  if (!content.includes('## Contract Metadata')) {
    errors.push('docs/style_kit.md must include a Contract Metadata section.');
  }
  if (!content.includes('## Source Color Baseline')) {
    errors.push('docs/style_kit.md should include a Source Color Baseline section linked to styleConfig values.');
  }
}

function validateOutlineContract(errors: ErrorList): void {
  validateOutlineMetadata(errors);

  if (!SWATCH_BY_NAME.has(OUTLINE_SWATCH_KEY)) {
    errors.push(`styleConfig.outline.sourceColor "${OUTLINE_SWATCH_KEY}" must exist in palette.swatches.`);
  }

  const scriptPaths = ['tools/make_ui_assets.ts', 'tools/make_bart_sprites.ts'];
  for (const scriptPath of scriptPaths) {
    const source = readSource(scriptPath);
    if (!source.includes('styleConfig.outline')) {
      errors.push(`${scriptPath} must consume styleConfig.outline settings for generated artifacts.`);
      continue;
    }
  }

  const expectedOutlineHex = paletteByName(OUTLINE_SWATCH_KEY);
  const expectedOutlineRgb = parseHex(expectedOutlineHex ?? '#000000');
  const expectedOutline: [number, number, number, number] = [expectedOutlineRgb[0], expectedOutlineRgb[1], expectedOutlineRgb[2], OUTLINE_ALPHA];

  const artifactChecks = [
    'public/assets/sprites/enemy_walker.png',
    'public/assets/sprites/enemy_shell.png',
    'public/assets/sprites/enemy_shell_retracted.png',
    'public/assets/sprites/enemy_flying.png',
    'public/assets/sprites/enemy_spitter.png',
    'public/assets/sprites/projectile.png',
    'public/assets/sprites/flag.png',
    'public/assets/sprites/spring.png',
    'public/assets/sprites/map_node_open.png',
    'public/assets/sprites/map_node_done.png',
    'public/assets/sprites/map_node_locked.png',
    'public/assets/sprites/map_node_selected.png',
    'public/assets/sprites/map_path_dot.png',
    'public/assets/sprites/cloud_1.png',
    'public/assets/sprites/cloud_2.png',
    'public/assets/sprites/bart_head_32.png',
    'public/assets/sprites/bart_head_48.png',
    'public/assets/sprites/bart_head_64.png',
    'public/assets/sprites/bart_portrait_96.png',
  ];

  for (const target of artifactChecks) {
    if (!hasExpectedOutlineColor(path.resolve(target), expectedOutline)) {
      errors.push(`Generated asset ${target} does not contain configured outline color ${OUTLINE_SWATCH_KEY} with alpha ${OUTLINE_ALPHA}.`);
    }
  }
}

function validateHudLayout(errors: ErrorList): void {
  const hud = styleConfig.hudLayout;
  if (!hud || !hud.leftGroup || !hud.rightGroup || !hud.portrait) {
    errors.push('hudLayout constants are incomplete. Expected leftGroup, rightGroup, and portrait.');
    return;
  }

  if (hud.viewport.width !== 960 || hud.viewport.height !== 540) {
    errors.push(
      `hudLayout.viewport must stay locked to 960x540, received ${hud.viewport.width}x${hud.viewport.height}`,
    );
  }

  assertRange(errors, 'hudLayout.leftGroup.x', hud.leftGroup.x, 74, 102);
  assertRange(errors, 'hudLayout.leftGroup.y', hud.leftGroup.y, 8, 16);
  assertRange(errors, 'hudLayout.leftGroup.fontSizePx', hud.leftGroup.fontSizePx, 12, 16);
  assertRange(errors, 'hudLayout.leftGroup.letterSpacingPx', hud.leftGroup.letterSpacingPx, 1, 2);

  assertRange(errors, 'hudLayout.rightGroup.x', hud.rightGroup.x, 920, 952);
  assertRange(errors, 'hudLayout.rightGroup.y', hud.rightGroup.y, 8, 16);
  assertRange(errors, 'hudLayout.rightGroup.fontSizePx', hud.rightGroup.fontSizePx, 12, 16);
  assertRange(errors, 'hudLayout.rightGroup.letterSpacingPx', hud.rightGroup.letterSpacingPx, 1, 2);

  assertRange(errors, 'hudLayout.portrait.x', hud.portrait.x, 8, 22);
  assertRange(errors, 'hudLayout.portrait.y', hud.portrait.y, 4, 14);
  assertRange(errors, 'hudLayout.portrait.scale', hud.portrait.scale, 0.62, 0.72);

  if (hud.leftGroup.anchor !== 'top-left') {
    errors.push(`hudLayout.leftGroup.anchor must be top-left, received ${hud.leftGroup.anchor}`);
  }
  if (hud.rightGroup.anchor !== 'top-right') {
    errors.push(`hudLayout.rightGroup.anchor must be top-right, received ${hud.rightGroup.anchor}`);
  }
  if (hud.portrait.anchor !== 'top-left') {
    errors.push(`hudLayout.portrait.anchor must be top-left for the locked HUD layout, received ${hud.portrait.anchor}`);
  }
  if (!/BART/.test(hud.leftGroup.textFormat)) {
    errors.push('hudLayout.leftGroup.textFormat must include BART.');
  }
  if (!/BART x\{instances\}/.test(hud.leftGroup.textFormat)) {
    errors.push('hudLayout.leftGroup.textFormat must include contract token BART x{instances}.');
  }
  if (!isWorldTimeHudTemplate(hud.rightGroup.textFormat)) {
    errors.push('hudLayout.rightGroup.textFormat must include WORLD {world}-{level} and TIME {time} tokens.');
  }
  assertRange(errors, 'hudLayout.timeDigits', hud.timeDigits, 3, 3);

  const forbiddenHudWords = ['LIVES', 'LEVELS'];
  for (const word of forbiddenHudWords) {
    if (hud.leftGroup.textFormat.includes(word) || hud.rightGroup.textFormat.includes(word)) {
      errors.push(`hudLayout text contracts must not include legacy HUD words. Found ${word}.`);
    }
  }

  const requiredIcon = hud.leftGroupIcons;
  if (!requiredIcon || typeof requiredIcon !== 'object') {
    errors.push('hudLayout.leftGroupIcons must define star and coin icon metadata.');
  } else {
    const starConfig: { texture?: string } = requiredIcon.star;
    const coinConfig: { texture?: string } = requiredIcon.coin;
    if (!starConfig?.texture) {
      errors.push('hudLayout.leftGroupIcons.star must define a texture key.');
    } else {
      const descriptor = ASSET_MANIFEST.images[starConfig.texture];
      if (!descriptor) {
        errors.push(`hudLayout.leftGroupIcons.star.texture (${starConfig.texture}) is not present in ASSET_MANIFEST.images.`);
      } else {
        const imagePath = readManifestImagePath(descriptor);
        if (!imagePath.endsWith('.png')) {
          errors.push(`HUD star icon texture ${starConfig.texture} must reference a PNG, received ${imagePath}.`);
        }
      }
    }

    if (!coinConfig?.texture) {
      errors.push('hudLayout.leftGroupIcons.coin must define a texture key.');
    } else {
      const descriptor = ASSET_MANIFEST.images[coinConfig.texture];
      if (!descriptor) {
        errors.push(`hudLayout.leftGroupIcons.coin.texture (${coinConfig.texture}) is not present in ASSET_MANIFEST.images.`);
      } else {
        const imagePath = readManifestImagePath(descriptor);
        if (!imagePath.endsWith('.png')) {
          errors.push(`HUD coin icon texture ${coinConfig.texture} must reference a PNG, received ${imagePath}.`);
        }
      }
    }
  }

  if (!hud.portrait.texture) {
    errors.push('hudLayout.portrait.texture is required and should be set to a runtime-loaded HUD portrait key.');
  } else {
    const portraitDescriptor = ASSET_MANIFEST.images[hud.portrait.texture];
    if (!portraitDescriptor) {
      errors.push(`hudLayout.portrait.texture (${hud.portrait.texture}) is not present in ASSET_MANIFEST.images.`);
    } else if (!readManifestImagePath(portraitDescriptor).endsWith('.png')) {
      errors.push(`hudLayout.portrait.texture ${hud.portrait.texture} must reference a PNG asset path.`);
    }
  }

  if (!hud.hudMode || hud.hudMode !== 'icon-driven') {
    errors.push('hudLayout.hudMode must be set to "icon-driven".');
  }

  if (!isLivesHudTemplate(hud.leftGroup.textFormat)) {
    errors.push(`hudLayout.leftGroup.textFormat must include "${HUD_CONTRACT_GLYPHS.lives}", received "${hud.leftGroup.textFormat}".`);
  }
  if (!isWorldTimeHudTemplate(hud.rightGroup.textFormat)) {
    errors.push(`hudLayout.rightGroup.textFormat must include "${HUD_CONTRACT_GLYPHS.worldTime}" tokens, received "${hud.rightGroup.textFormat}".`);
  }
}

function validateTitleLayout(errors: ErrorList): void {
  const title = styleConfig.titleLayout;
  if (!title || !title.wordmark || !title.subtitle || !title.prompt || !title.attract) {
    errors.push('titleLayout constants are incomplete. Expected wordmark/subtitle/prompt/attract blocks.');
    return;
  }

  if (title.viewport.width !== 960 || title.viewport.height !== 540) {
    errors.push(
      `titleLayout.viewport must stay locked to 960x540, received ${title.viewport.width}x${title.viewport.height}`,
    );
  }

  assertRange(errors, 'titleLayout.wordmark.x', title.wordmark.x, 440, 520);
  assertRange(errors, 'titleLayout.wordmark.y', title.wordmark.y, 18, 88);
  assertRange(errors, 'titleLayout.wordmark.scale', title.wordmark.scale, 0.8, 1.25);
  if (title.wordmark.anchor !== 'top-center') {
    errors.push(`titleLayout.wordmark.anchor must be top-center, received ${title.wordmark.anchor}`);
  }
  if (title.wordmark.copy !== 'SUPER BART') {
    errors.push(`titleLayout.wordmark.copy must be "SUPER BART", received "${title.wordmark.copy}"`);
  }

  assertRange(errors, 'titleLayout.portrait.x', title.portrait.x, 680, 860);
  assertRange(errors, 'titleLayout.portrait.y', title.portrait.y, 50, 140);
  assertRange(errors, 'titleLayout.portrait.scale', title.portrait.scale, 0.5, 0.75);

  assertRange(errors, 'titleLayout.subtitle.x', title.subtitle.x, 440, 520);
  assertRange(errors, 'titleLayout.subtitle.y', title.subtitle.y, 186, 260);
  assertRange(errors, 'titleLayout.subtitle.fontSizePx', title.subtitle.fontSizePx, 16, 24);
  assertRange(errors, 'titleLayout.subtitle.letterSpacingPx', title.subtitle.letterSpacingPx, 1, 3);

  assertRange(errors, 'titleLayout.prompt.x', title.prompt.x, 440, 520);
  assertRange(errors, 'titleLayout.prompt.y', title.prompt.y, 340, 430);
  assertRange(errors, 'titleLayout.prompt.fontSizePx', title.prompt.fontSizePx, 20, 32);
  assertRange(errors, 'titleLayout.prompt.blinkMs', title.prompt.blinkMs, 280, 700);

  assertRange(errors, 'titleLayout.hints.x', title.hints.x, 440, 520);
  assertRange(errors, 'titleLayout.hints.y', title.hints.y, 410, 500);
  assertRange(errors, 'titleLayout.hints.fontSizePx', title.hints.fontSizePx, 12, 18);

  assertRange(errors, 'titleLayout.attract.worldWidthPx', title.attract.worldWidthPx, 1080, 1800);
  assertRange(errors, 'titleLayout.attract.cameraPanPx', title.attract.cameraPanPx, 120, 280);
  assertRange(errors, 'titleLayout.attract.cameraPanMs', title.attract.cameraPanMs, 8000, 14000);
  assertRange(errors, 'titleLayout.attract.groundY', title.attract.groundY, 430, 500);
  assertRange(errors, 'titleLayout.attract.groundRows', title.attract.groundRows, 3, 6);
  assertRange(errors, 'titleLayout.attract.cloudDriftPx', title.attract.cloudDriftPx, 80, 180);
  assertRange(errors, 'titleLayout.attract.cloudDriftMs', title.attract.cloudDriftMs, 16000, 32000);
  if (!Array.isArray(title.attract.clouds) || title.attract.clouds.length < 2) {
    errors.push('titleLayout.attract.clouds must define at least two drifting cloud sprites.');
  }
}

function validateGameplayLayout(errors: ErrorList): void {
  const gameplay = styleConfig.gameplayLayout;
  if (!gameplay || !gameplay.sky || !gameplay.haze || !gameplay.hills) {
    errors.push('gameplayLayout constants are incomplete.');
    return;
  }

  if (gameplay.viewport.width !== 960 || gameplay.viewport.height !== 540) {
    errors.push(
      `gameplayLayout.viewport must stay locked to 960x540, received ${gameplay.viewport.width}x${gameplay.viewport.height}`,
    );
  }

  assertRange(errors, 'gameplayLayout.haze.alpha', gameplay.haze.alpha, 0.04, 0.2);
  assertRange(errors, 'gameplayLayout.haze.widthFactor', gameplay.haze.widthFactor, 0.35, 1.05);
  assertRange(errors, 'gameplayLayout.cameraZoom', gameplay.cameraZoom, 1.0, 1.6);
  assertRange(errors, 'gameplayLayout.hills.far.scrollFactor', gameplay.hills.far.scrollFactor, 0.1, 0.1);
  assertRange(errors, 'gameplayLayout.hills.near.scrollFactor', gameplay.hills.near.scrollFactor, 0.22, 0.22);

  const profile = gameplay.parallaxProfile;
  if (!profile) {
    errors.push('gameplayLayout.parallaxProfile is required for deterministic depth passes.');
  } else {
    if (typeof profile.enabled !== 'boolean') {
      errors.push('gameplayLayout.parallaxProfile.enabled must be a boolean.');
    }
    if (profile.enabled && !Array.isArray(profile.layers)) {
      errors.push('gameplayLayout.parallaxProfile.layers must be an array when parallax is enabled.');
    }
    if (profile.enabled && profile.layers.length < 2) {
      errors.push('gameplayLayout.parallaxProfile.layers must define at least 2 layers for NES depth motion.');
    }
    if (profile.depthCue && profile.depthCue.enabled) {
      if (!styleConfig.palette.swatches.some((entry) => entry.name === profile.depthCue.topSwatch)) {
        errors.push(`gameplayLayout.parallaxProfile.depthCue.topSwatch "${profile.depthCue.topSwatch}" is not defined in palette.`);
      }
      if (!styleConfig.palette.swatches.some((entry) => entry.name === profile.depthCue.midSwatch)) {
        errors.push(`gameplayLayout.parallaxProfile.depthCue.midSwatch "${profile.depthCue.midSwatch}" is not defined in palette.`);
      }
      assertRange(errors, 'gameplayLayout.parallaxProfile.depthCue.startY', profile.depthCue.startY, 0, 520);
      assertRange(errors, 'gameplayLayout.parallaxProfile.depthCue.bandHeightPx', profile.depthCue.bandHeightPx, 60, 240);
      assertRange(errors, 'gameplayLayout.parallaxProfile.depthCue.maxAlpha', profile.depthCue.maxAlpha, 0.05, 0.35);
      assertRange(errors, 'gameplayLayout.parallaxProfile.depthCue.bands', profile.depthCue.bands, 4, 24);
    }
    for (const [index, layer] of profile.layers.entries()) {
      assertRange(
        errors,
        `gameplayLayout.parallaxProfile.layers[${index}].spacingPx`,
        layer.spacingPx,
        80,
        560,
      );
      assertRange(
        errors,
        `gameplayLayout.parallaxProfile.layers[${index}].parallaxFactor || gameplayLayout.parallaxProfile.layers[${index}].scrollFactor`,
        layer.scrollFactor ?? layer.parallaxFactor,
        0.05,
        0.4,
      );
    }
  }

  for (const [index, cloud] of gameplay.clouds.entries()) {
    assertRange(errors, `gameplayLayout.clouds[${index}].scrollFactor`, cloud.scrollFactor, 0.05, 0.12);
  }
}

function validateWorldMapLayout(errors: ErrorList): void {
  const map = styleConfig.worldMapLayout;
  if (!map || !map.title || !map.nodes || !map.nodeSpriteKeys) {
    errors.push('worldMapLayout constants are incomplete.');
    return;
  }

  if (map.viewport.width !== 960 || map.viewport.height !== 540) {
    errors.push(
      `worldMapLayout.viewport must stay locked to 960x540, received ${map.viewport.width}x${map.viewport.height}`,
    );
  }

  if (!Array.isArray(map.nodes) || map.nodes.length !== 25) {
    errors.push(`worldMapLayout.nodes must contain 25 campaign nodes, received ${map.nodes.length}`);
  }
  if (!map.nodes.some((node) => node.key === '5-1')) {
    errors.push('worldMapLayout.nodes must contain final castle key 5-1.');
  }

  assertRange(errors, 'worldMapLayout.nodeScale.base', map.nodeScale.base, 1.6, 2.3);
  assertRange(errors, 'worldMapLayout.nodeScale.selected', map.nodeScale.selected, 2.0, 2.5);
  assertRange(errors, 'worldMapLayout.mapPath.spacingPx', map.mapPath.spacingPx, 12, 22);
  assertRange(errors, 'worldMapLayout.selectionBob.distancePx', map.selectionBob.distancePx, 4, 8);
  assertRange(errors, 'worldMapLayout.selectionBob.durationMs', map.selectionBob.durationMs, 320, 600);
}

function validateTitleSceneContract(errors: ErrorList): void {
  const scenePath = path.resolve('src/scenes/TitleScene.ts');
  if (!fs.existsSync(scenePath)) {
    errors.push('src/scenes/TitleScene.ts is required for title-screen enforcement.');
    return;
  }

  const source = fs.readFileSync(scenePath, 'utf-8');
  const sourceForChecks = cleanTextForChecks(source);
  if (!sourceForChecks.includes('styleConfig.titleLayout')) {
    errors.push('TitleScene must read title layout values from styleConfig.titleLayout.');
  }
  if (!source.includes("'title_logo'")) {
    errors.push('TitleScene must render the generated title_logo asset.');
  }
  if (!BITMAP_TEXT_CALL_REGEX.test(sourceForChecks)) {
    errors.push('TitleScene must use bitmap text for subtitle/prompt treatment.');
  }
  if (FONT_FAMILY_REGEX.test(sourceForChecks) || ADD_TEXT_CALL_REGEX.test(sourceForChecks)) {
    errors.push('TitleScene may not use system text rendering.');
  }

  const scrollFactorHits = source.match(/setScrollFactor\(0\)/g)?.length ?? 0;
  if (scrollFactorHits < 6) {
    errors.push('TitleScene UI must pin logo/portrait/subtitle/prompt/hints with setScrollFactor(0).');
  }
}

function validateWorldMapSceneContract(errors: ErrorList): void {
  const scenePath = path.resolve('src/scenes/WorldMapScene.ts');
  if (!fs.existsSync(scenePath)) {
    errors.push('src/scenes/WorldMapScene.ts is required for world-map style enforcement.');
    return;
  }
  const source = fs.readFileSync(scenePath, 'utf-8');
  const sourceForChecks = cleanTextForChecks(source);

  if (!sourceForChecks.includes('styleConfig.worldMapLayout')) {
    errors.push('WorldMapScene must read world-map layout values from styleConfig.worldMapLayout.');
  }
  if (!BITMAP_TEXT_CALL_REGEX.test(sourceForChecks)) {
    errors.push('WorldMapScene must use bitmap text.');
  }
  if (FONT_FAMILY_REGEX.test(sourceForChecks) || ADD_TEXT_CALL_REGEX.test(sourceForChecks)) {
    errors.push('WorldMapScene may not use system text rendering.');
  }
  if (!sourceForChecks.includes('nodeSpriteKeys.selected')) {
    errors.push('WorldMapScene must render sprite-kit node states (selected/open/done/locked).');
  }
}

function validatePlaySceneContract(errors: ErrorList): void {
  const scenePath = path.resolve('src/scenes/PlayScene.ts');
  if (!fs.existsSync(scenePath)) {
    errors.push('src/scenes/PlayScene.ts is required for gameplay style enforcement.');
    return;
  }
  const source = fs.readFileSync(scenePath, 'utf-8');
  const sourceForChecks = cleanTextForChecks(source);

  if (!source.includes('renderGameplayBackground')) {
    errors.push('PlayScene must use renderGameplayBackground from rendering/parallax.');
  }
  if (source.includes('renderThemedBackground')) {
    errors.push('PlayScene may not call legacy renderThemedBackground.');
  }
  if (!sourceForChecks.includes('styleConfig.gameplayLayout')) {
    errors.push('PlayScene must pass styleConfig.gameplayLayout to background renderer.');
  }
}

function validateParallaxHazeContract(errors: ErrorList): void {
  const parallaxPath = path.resolve('src/rendering/parallax.ts');
  if (!fs.existsSync(parallaxPath)) {
    errors.push('src/rendering/parallax.ts is required for gameplay background haze enforcement.');
    return;
  }

  const source = fs.readFileSync(parallaxPath, 'utf-8');
  if (!source.includes('renderHaze(')) {
    errors.push('parallax.ts must render gameplay haze using renderHaze().');
  }
  if (!source.includes('layout.haze') || !source.includes('alpha') || !source.includes('widthFactor') || !source.includes('heightPx')) {
    errors.push('parallax.ts must read haze configuration from layout.haze (alpha, widthFactor, heightPx required).');
  }
  if (!source.includes('renderGameplayBackground')) {
    errors.push('parallax.ts must expose renderGameplayBackground for locked play background rendering.');
  }
}

function validateHudContract(errors: ErrorList): void {
  const hudPath = path.resolve('src/ui/hud.ts');
  if (!fs.existsSync(hudPath)) {
    errors.push('src/ui/hud.ts is required for HUD style enforcement.');
    return;
  }
  const source = fs.readFileSync(hudPath, 'utf-8');
  const sourceForChecks = cleanTextForChecks(source);
  const hudLayout = styleConfig.hudLayout;
  if (!BITMAP_TEXT_CALL_REGEX.test(sourceForChecks)) {
    errors.push('HUD must render using bitmapText.');
  }
  if (ADD_TEXT_CALL_REGEX.test(sourceForChecks) || FONT_FAMILY_REGEX.test(sourceForChecks)) {
    errors.push('HUD must not use system text rendering.');
  }
  if (sourceForChecks.includes('PTU')) {
    errors.push('HUD must not contain PTU copy.');
  }

  if (!sourceForChecks.includes('hudLayout.portrait.texture')) {
    errors.push('HUD portrait texture should be read from styleConfig.hudLayout.portrait.texture, not hardcoded.');
  }

  if (/\b['"]bart_portrait_96['"]/.test(source)) {
    errors.push('HUD must not hardcode bart_portrait_96; use runtime config texture key.');
  }

  if (!sourceForChecks.includes('leftGroupIcons.star')) {
    errors.push('HUD must render star pickups using leftGroupIcons.star metadata path from styleConfig.');
  }
  if (!sourceForChecks.includes('leftGroupIcons.coin')) {
    errors.push('HUD must render token pickups using leftGroupIcons.coin metadata path from styleConfig.');
  }

  const quotedText = extractQuotedText(source);
  for (const forbidden of HUD_TEXT_FORBIDDEN_WORDS) {
    if (quotedText.some((entry) => entry.toUpperCase().includes(forbidden))) {
      errors.push(`HUD implementation should avoid gameplay HUD words in code/text literals: ${forbidden}.`);
    }
  }

  for (const iconKey of HUD_ICON_KEYS) {
    const iconMeta = (hudLayout.leftGroupIcons as Record<string, { texture?: string }>)[iconKey];
    if (!iconMeta?.texture) {
      errors.push(`HUD icon metadata "${iconKey}" must define a texture key in styleConfig.hudLayout.leftGroupIcons.`);
      continue;
    }

    const descriptor = ASSET_MANIFEST.images[iconMeta.texture];
    if (!descriptor) {
      errors.push(`HUD icon "${iconKey}" references missing manifest image key "${iconMeta.texture}".`);
      continue;
    }

    const imagePath = readManifestImagePath(descriptor);
    if (!imagePath.endsWith('.png')) {
      errors.push(`HUD icon "${iconKey}" texture "${iconMeta.texture}" must resolve to PNG.`);
    }
  }

  if (!isLivesHudTemplate(hudLayout.leftGroup.textFormat)) {
    errors.push('HUD leftGroup.textFormat must include BART x{instances}.');
  }
  if (!isWorldTimeHudTemplate(hudLayout.rightGroup.textFormat)) {
    errors.push('HUD rightGroup.textFormat must include WORLD {world}-{level} and TIME {time}.');
  }

  if (!sourceForChecks.includes('HUD_CONTRACT.leftBlock.iconMultiplierGlyph')) {
    errors.push('HUD token rendering should derive multiplier glyph from HUD_CONTRACT.leftBlock.iconMultiplierGlyph.');
  }
  if (!sourceForChecks.includes('HUD_CONTRACT.leftBlock.widthDigits')) {
    errors.push('HUD implementation should format lives using HUD_CONTRACT.leftBlock.widthDigits.');
  }
}

function validateWorldSpaceLabelPolicy(errors: ErrorList): void {
  const playPath = path.resolve('src/scenes/PlayScene.ts');
  if (!fs.existsSync(playPath)) {
    errors.push('src/scenes/PlayScene.ts is required for gameplay label policy enforcement.');
    return;
  }

  const source = cleanTextForChecks(fs.readFileSync(playPath, 'utf-8'));
  const policy = styleConfig.gameplayLayout.worldSpaceLabelPolicy;
  if (!policy || policy.disallowGameplayEntityLabels !== true) {
    errors.push('Gameplay world-space policy must disallow labels over gameplay entities.');
  }
  if (!policy || policy.disallowLabelDebugGlyphs !== true) {
    errors.push('Gameplay world-space policy must disallow debug glyph labels.');
  }

  if (ADD_TEXT_CALL_REGEX.test(source)) {
    errors.push(
      'Gameplay should not use world-space system text labels over entities; replace with asset/UI text and popup-only messaging.',
    );
  }

  const bitmapTextCalls = source.match(/\b(?:this\.)?add\s*\.\s*bitmapText\s*\(/g)?.length ?? 0;
  if (bitmapTextCalls !== 1) {
    errors.push(
      `PlayScene should keep world-space labels to popup-only messaging; expected exactly one transient toast path, found ${bitmapTextCalls}.`,
    );
  }

  const hardCodedPopupText = source.match(/add\s*\.\s*bitmapText\s*\([^)]*?,[^)]*?,[^)]*?,\s*["'`][^"'`]+["'`]/g);
  if (hardCodedPopupText && hardCodedPopupText.length > 0) {
    errors.push('PlayScene bitmapText calls in gameplay flow must not use hardcoded text literals.');
  }

  if (!/showHudToast\s*\(/.test(source)) {
    errors.push('PlayScene should route transient popup messaging through showHudToast().');
  }

  const quotedText = extractQuotedText(source).map((entry) => entry.toUpperCase());
  const invalidPopup =
    quotedText.some((entry) => entry.includes('N: NEW DEPLOYMENT')) ||
    quotedText.some((entry) => entry.includes('PRESS ENTER')) ||
    quotedText.some((entry) => entry.includes('LIVES'));
  if (invalidPopup) {
    errors.push('PlayScene should not render static title-style label strings; keep gameplay labels as HUD-only or headless toasts.');
  }
}

function validatePopupDurations(errors: ErrorList): void {
  const playPath = path.resolve('src/scenes/PlayScene.ts');
  if (!fs.existsSync(playPath)) {
    errors.push('src/scenes/PlayScene.ts is required for popup timing enforcement.');
    return;
  }

  const source = fs.readFileSync(playPath, 'utf-8');
  const match = source.match(
    /private showHudToast\(message: string\): void \{[\s\S]*?duration:\s*(\d+)\s*,[\s\S]*?\}/
  );
  if (!match) {
    errors.push('src/scenes/PlayScene.ts must expose showHudToast() with an explicit fade duration.');
    return;
  }

  const toastMs = Number(match[1]);
  if (!Number.isFinite(toastMs) || toastMs < 800 || toastMs > 1200) {
    errors.push(`showHudToast fade duration must be within 800-1200ms, received ${toastMs}`);
  }
}

function validateDocs(errors: ErrorList): void {
  const requiredDocs = [
    { file: 'docs/screenshots/title_expected.md', mustContain: ['setScrollFactor(0)', 'title_logo.png', 'PRESS ENTER', 'N: NEW DEPLOYMENT'] },
    { file: 'docs/screenshots/world_map_expected.md', mustContain: ['WorldMapScene', 'map_node_selected', 'bitmap text'] },
    { file: 'docs/screenshots/play_expected.md', mustContain: ['BART x{instances}', '✦', '◎', 'WORLD W-L', 'TIME TTT'] },
  ];

  for (const doc of requiredDocs) {
    const fullPath = path.resolve(doc.file);
    if (!fs.existsSync(fullPath)) {
      errors.push(`Missing visual gate doc: ${doc.file}`);
      continue;
    }
    const content = fs.readFileSync(fullPath, 'utf-8');
    for (const token of doc.mustContain) {
      if (!content.includes(token)) {
        errors.push(`${doc.file} must mention "${token}".`);
      }
    }
  }
}

function validatePalette(errors: ErrorList): void {
  const palette = styleConfig.palette;
  const requiredNames = [
    'inkDark',
    'skyDeep',
    'grassTop',
    'groundWarm',
    'coinCore',
    'hudText',
    'hudAccent',
    'hudPanel',
    'bloomWarm',
  ];

  if (!palette || !Array.isArray(palette.swatches)) {
    errors.push('palette.swatches must exist as an array of named colors.');
    return;
  }

  const names = new Set<string>();
  for (const swatch of palette.swatches) {
    if (!swatch || typeof swatch.name !== 'string' || typeof swatch.hex !== 'string') {
      errors.push('palette.swatches must contain { name, hex } entries.');
      continue;
    }
    names.add(swatch.name);
    assertHex(errors, `palette.swatches.${swatch.name}.hex`, swatch.hex);
  }

  for (const name of requiredNames) {
    if (!names.has(name)) {
      errors.push(`palette.swatches is missing required color: ${name}`);
    }
  }
}

function validateBloom(errors: ErrorList): void {
  const bloom = styleConfig.bloom;
  if (!bloom) {
    errors.push('bloom settings must exist in styleConfig.');
    return;
  }

  assertRange(errors, 'bloom.threshold', bloom.threshold, 0.65, 0.82);
  assertRange(errors, 'bloom.strength', bloom.strength, 0.25, 0.65);
  assertRange(errors, 'bloom.radius', bloom.radius, 2, 5);
  assertRange(errors, 'bloom.downsample', bloom.downsample, 1, 3);
  assertHex(errors, 'bloom.tint', bloom.tint);
}

function validateTypography(errors: ErrorList): void {
  const typography = styleConfig.typography;
  if (typography.style !== 'bitmap') {
    errors.push(`typography.style must be "bitmap", received ${typography.style}`);
  }
  if (typography.casing !== 'uppercase') {
    errors.push(`typography.casing must be "uppercase", received ${typography.casing}`);
  }
  if (typeof typography.fontKey !== 'string' || typography.fontKey.trim().length === 0) {
    errors.push('typography.fontKey must be defined for bitmap font rendering.');
  }
  assertRange(errors, 'typography.letterSpacingPx', typography.letterSpacingPx, 1, 2);
  assertRange(errors, 'typography.lineHeightPx', typography.lineHeightPx, 14, 18);
}

function validatePlayerAnimation(errors: ErrorList): void {
  const anim = styleConfig.playerAnimation;
  if (!anim) {
    errors.push('playerAnimation config block is required in styleConfig.');
    return;
  }
  assertRange(errors, 'playerAnimation.idleThreshold', anim.idleThreshold, 5, 20);
  assertRange(errors, 'playerAnimation.runThreshold', anim.runThreshold, 130, 200);
  assertRange(errors, 'playerAnimation.skidThreshold', anim.skidThreshold, 80, 150);
  assertRange(errors, 'playerAnimation.walkFps', anim.walkFps, 6, 12);
  assertRange(errors, 'playerAnimation.runFps', anim.runFps, 10, 16);
  assertRange(errors, 'playerAnimation.landDurationMs', anim.landDurationMs, 50, 120);
  assertRange(errors, 'playerAnimation.hurtDurationMs', anim.hurtDurationMs, 200, 600);
  assertRange(errors, 'playerAnimation.headScaleSmall', anim.headScaleSmall, 0.25, 0.45);
  assertRange(errors, 'playerAnimation.headScaleBig', anim.headScaleBig, 0.18, 0.35);
  assertRange(errors, 'playerAnimation.dustPuffAlpha', anim.dustPuffAlpha, 0.3, 0.8);
  assertRange(errors, 'playerAnimation.dustPuffScale', anim.dustPuffScale, 1.0, 2.5);
  assertRange(errors, 'playerAnimation.dustPuffLifeMs', anim.dustPuffLifeMs, 100, 400);
  assertRange(errors, 'playerAnimation.dustPuffCount', anim.dustPuffCount, 2, 6);
}

function main(): number {
  const errors: ErrorList = [];
  const warnings: WarningList = [];
  const contractDocContent = readStyleContractDoc(errors);

  validateReferenceTargets(errors, warnings);
  validateSceneTypography(errors, warnings);
  validateHudLayout(errors);
  validateTitleLayout(errors);
  validateGameplayLayout(errors);
  validateWorldMapLayout(errors);
  validatePalette(errors);
  validateBloom(errors);
  validateTypography(errors);
  validatePlayerAnimation(errors);
  validatePlayerAnimationContract(errors);
  validatePlayerAnimationContractDocs(errors, contractDocContent);
  validateDocsPalette(errors, contractDocContent);
  validateReferenceContractDocs(errors, contractDocContent);
  validateContractMetadataDoc(errors, contractDocContent);
  validateSceneExceptionContracts(errors, contractDocContent);
  validateOutlineContract(errors);
  validateTitleSceneContract(errors);
  validateWorldMapSceneContract(errors);
  validatePlaySceneContract(errors);
  validateHudContract(errors);
  validateWorldSpaceLabelPolicy(errors);
  validatePopupDurations(errors);
  validateParallaxHazeContract(errors);
  validateDocs(errors);

  if (errors.length > 0) {
    console.error('Style validation failed:');
    for (const error of errors) {
      console.error(`- ${error}`);
    }
    return 1;
  }

  if (warnings.length > 0) {
    console.warn('Style validation warnings:');
    for (const warning of warnings) {
      console.warn(`- ${warning}`);
    }
  }

  console.log('Style validation passed. target_look constraints are within approved ranges.');
  return 0;
}

process.exitCode = main();
