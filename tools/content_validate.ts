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
import { CAMPAIGN_WORLD_LAYOUT, TOTAL_CAMPAIGN_LEVELS } from '../src/core/constants';
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
  'src/scenes/InterludeScene.ts',
  'src/scenes/DebriefScene.ts',
  'src/scenes/ChoiceScene.ts',
  'src/scenes/CreditsScene.ts',
];
const TARGET_TEXT_FILES = resolveTargetTextFiles(process.env.CONTENT_VALIDATOR_TARGET_PATHS);
const CAMPAIGN_ARTIFACT_PATH = path.resolve(REPO_ROOT, 'docs/level_specs/script_campaign_v3.json');
const CHUNK_CATALOG_PATH = path.resolve(REPO_ROOT, 'docs/level_specs/chunk_catalog.json');
const WORLD_RULES_PATH = path.resolve(REPO_ROOT, 'docs/level_specs/world_rules.json');
const EXPECTED_PACE_SEQUENCE = ['INTRO', 'PRACTICE', 'VARIATION', 'CHALLENGE', 'COOLDOWN', 'FINALE'] as const;
const WORLD_HAZARD_TAGS = ['SPIKE_LOW', 'SPIKE_SWEEP', 'THWOMP_DROP'];
const WORLD_EXPECTED_COUNT = CAMPAIGN_WORLD_LAYOUT.length;
const LEVEL_COUNT_EXPECTED = TOTAL_CAMPAIGN_LEVELS;
const STRICT_CAMPAIGN_PACING_CHECKS = false;

type CampaignLevelSpec = {
  world: unknown;
  level: unknown;
  title: unknown;
  sequence: unknown;
  hardRules: unknown;
};

type CampaignSequenceItem = {
  phase: unknown;
  chunks: unknown;
};

type CampaignArtifact = {
  version: unknown;
  generatedAt: unknown;
  worldCount: unknown;
  levels: unknown;
};

type ChunkCatalog = {
  entries: unknown;
};

type ChunkTemplateRecord = {
  id: unknown;
  tags: unknown;
  recoveryAfter: unknown;
  mechanicsIntroduced: unknown;
};

type WorldRule = {
  world: unknown;
  allowedChunkTags: unknown;
  allowedHazardTags: unknown;
  minRecoveryGap: unknown;
  maxHazardClusters: unknown;
  maxNewMechanicsPerChunk: unknown;
};

type WorldRulesArtifact = {
  worldCount: unknown;
  worlds: unknown;
};

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

const FORBIDDEN_HUD_WORDS = /\b(LIVES|LIFE|LEVELS)\b/;

const failures: Failure[] = [];
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

function readJson(filePath: string): unknown | null {
  if (!fs.existsSync(filePath)) {
    return null;
  }
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch (error) {
    addFailure({
      id: 'content.json.parseFailure',
      file: rel(filePath),
      line: 1,
      message: `Invalid JSON in ${path.relative(REPO_ROOT, filePath)}: ${(error as Error).message}`,
      hint: 'Fix JSON syntax before running content validation.',
    });
    return null;
  }
}

function validateWorldRulesJson(): void {
  const worldRulesPath = WORLD_RULES_PATH;
  if (!fs.existsSync(worldRulesPath)) {
    addFailure({
      id: 'content.levelspec.worldRulesMissing',
      file: rel(worldRulesPath),
      line: 1,
      message: 'Missing required level world rule artifact: docs/level_specs/world_rules.json',
      hint: 'Add a world rule JSON contract before final campaign-gating.',
    });
    return;
  }

  const parsed = readJson(worldRulesPath) as WorldRulesArtifact | null;
  if (!parsed) {
    addFailure({
      id: 'content.levelspec.worldRulesInvalidJson',
      file: rel(worldRulesPath),
      line: 1,
      message: `Could not parse world rules JSON.`,
      hint: 'Fix JSON syntax before running content validation.',
    });
    return;
  }

  const worlds = parsed.worlds;
  if (!Array.isArray(worlds)) {
    addFailure({
      id: 'content.levelspec.worldRulesShape',
      file: rel(worldRulesPath),
      line: 1,
      message: 'docs/level_specs/world_rules.json missing `worlds` array.',
      hint: 'Populate `worlds` with per-world pacing/fairness constraints.',
    });
    return;
  }

  if (parsed.worldCount != null && parsed.worldCount !== worlds.length) {
    addFailure({
      id: 'content.levelspec.worldRulesShape',
      file: rel(worldRulesPath),
      line: 1,
      message: 'world_count does not match number of world rules.',
      hint: `Expected ${parsed.worldCount} entries, found ${worlds.length}.`,
    });
  }
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

function validateCampaignAndChunkArtifacts(): void {
  const campaignRaw = readJson(CAMPAIGN_ARTIFACT_PATH);
  if (!campaignRaw) {
    addFailure({
      id: 'content.levelspec.campaignMissing',
      file: rel(CAMPAIGN_ARTIFACT_PATH),
      line: 1,
      message: 'Missing required campaign artifact: docs/level_specs/script_campaign_v3.json',
      hint: 'Add campaign artifact before final gating.',
    });
    return;
  }

  const campaign = campaignRaw as CampaignArtifact;
  if (typeof campaign.version !== 'string' || !campaign.version.trim()) {
    addFailure({
      id: 'content.levelspec.campaignShape',
      file: rel(CAMPAIGN_ARTIFACT_PATH),
      line: 1,
      message: 'Campaign artifact should define a non-empty string version.',
      hint: 'Set a version like "1.0.0".',
    });
  }
  if (typeof campaign.generatedAt !== 'string' || !Date.parse(campaign.generatedAt)) {
    addFailure({
      id: 'content.levelspec.campaignShape',
      file: rel(CAMPAIGN_ARTIFACT_PATH),
      line: 1,
      message: 'Campaign artifact should define a valid generatedAt timestamp.',
      hint: 'Set generatedAt to an ISO string.',
    });
  }

  const worldCount = typeof campaign.worldCount === 'number' ? campaign.worldCount : WORLD_EXPECTED_COUNT;
  if (worldCount !== WORLD_EXPECTED_COUNT) {
    addFailure({
      id: 'content.levelspec.campaignShape',
      file: rel(CAMPAIGN_ARTIFACT_PATH),
      line: 1,
      message: `script_campaign_v3.json worldCount should be ${WORLD_EXPECTED_COUNT}.`,
      hint: 'Use the authored SCRIPT V3 campaign world count.',
    });
  }
  if (!Array.isArray(campaign.levels)) {
    addFailure({
      id: 'content.levelspec.campaignShape',
      file: rel(CAMPAIGN_ARTIFACT_PATH),
      line: 1,
      message: 'Campaign artifact must define a `levels` array.',
      hint: 'Export all campaign level entries from script_campaign_v3.json.',
    });
    return;
  }
  if (campaign.levels.length !== LEVEL_COUNT_EXPECTED) {
    addFailure({
      id: 'content.levelspec.campaignCount',
      file: rel(CAMPAIGN_ARTIFACT_PATH),
      line: 1,
      message: `Campaign should have exactly ${LEVEL_COUNT_EXPECTED} levels, found ${campaign.levels.length}.`,
      hint: 'Regenerate campaign artifact from level-spec pipeline after fixes.',
    });
  }

  const chunkCatalogRaw = readJson(CHUNK_CATALOG_PATH);
  if (!chunkCatalogRaw) {
    addFailure({
      id: 'content.levelspec.chunkCatalogMissing',
      file: rel(CHUNK_CATALOG_PATH),
      line: 1,
      message: 'Missing required chunk catalog: docs/level_specs/chunk_catalog.json',
      hint: 'Add chunk catalog before campaign validation.',
    });
    return;
  }
  const chunkCatalog = chunkCatalogRaw as ChunkCatalog;
  if (!Array.isArray(chunkCatalog.entries)) {
    addFailure({
      id: 'content.levelspec.chunkCatalogShape',
      file: rel(CHUNK_CATALOG_PATH),
      line: 1,
      message: 'chunk_catalog.json must include an `entries` array.',
      hint: 'Populate chunk catalog entries for campaign validation.',
    });
    return;
  }
  const catalogById = new Map<string, ChunkTemplateRecord>();
  for (const entry of chunkCatalog.entries as unknown[]) {
    if (!entry || typeof entry !== 'object') {
      continue;
    }
    const asObj = entry as Record<string, unknown>;
    const id = typeof asObj.id === 'string' ? asObj.id : '';
    if (!id) {
      continue;
    }
    if (catalogById.has(id)) {
      addFailure({
        id: 'content.levelspec.chunkCatalogDup',
        file: rel(CHUNK_CATALOG_PATH),
        line: 1,
        message: `chunk_catalog contains duplicate chunk id "${id}".`,
        hint: 'Deduplicate chunk IDs and rerun generation.',
      });
    }
    catalogById.set(id, {
      id: asObj.id,
      tags: asObj.tags,
      recoveryAfter: asObj.recoveryAfter,
      mechanicsIntroduced: asObj.mechanicsIntroduced,
    });
  }

  const worldRulesRaw = readJson(WORLD_RULES_PATH);
  if (!worldRulesRaw) {
    addFailure({
      id: 'content.levelspec.worldRulesMissing',
      file: rel(WORLD_RULES_PATH),
      line: 1,
      message: 'Missing required level world rules: docs/level_specs/world_rules.json',
      hint: 'Add world rules before campaign validation.',
    });
    return;
  }
  const worldRules = worldRulesRaw as WorldRulesArtifact;
  if (!Array.isArray(worldRules.worlds)) {
    addFailure({
      id: 'content.levelspec.worldRulesShape',
      file: rel(WORLD_RULES_PATH),
      line: 1,
      message: 'world_rules.json must define a `worlds` array for campaign validation.',
      hint: 'Regenerate world_rules.json with all world contracts.',
    });
    return;
  }
  const worldRulesByWorld = new Map<number, WorldRule>();
  for (const entry of worldRules.worlds as unknown[]) {
    if (!entry || typeof entry !== 'object') {
      continue;
    }
    const obj = entry as Record<string, unknown>;
    const world = typeof obj.world === 'number' ? obj.world : NaN;
    if (!Number.isFinite(world) || !Number.isInteger(world)) {
      continue;
    }
    worldRulesByWorld.set(world, {
      world: obj.world,
      allowedChunkTags: obj.allowedChunkTags,
      allowedHazardTags: obj.allowedHazardTags,
      minRecoveryGap: obj.minRecoveryGap,
      maxHazardClusters: obj.maxHazardClusters,
      maxNewMechanicsPerChunk: obj.maxNewMechanicsPerChunk,
    });
  }

  const seenLevels = new Set<string>();
  let index = 0;
  for (const rawLevel of campaign.levels as unknown[]) {
    index += 1;
    if (!rawLevel || typeof rawLevel !== 'object') {
      addFailure({
        id: 'content.levelspec.levelShape',
        file: rel(CAMPAIGN_ARTIFACT_PATH),
        line: 1,
        message: `Campaign level entry #${index} is not a valid object.`,
        hint: `Ensure each level has world, level, title, sequence, and hardRules fields.`,
      });
      continue;
    }
    const level = rawLevel as CampaignLevelSpec;

    if (typeof level.world !== 'number' || !Number.isInteger(level.world) || level.world < 1 || level.world > WORLD_EXPECTED_COUNT) {
      addFailure({
        id: 'content.levelspec.levelWorldInvalid',
        file: rel(CAMPAIGN_ARTIFACT_PATH),
        line: 1,
        message: `Level entry #${index} has invalid world value ${String(level.world)}.`,
        hint: `Use world values from 1 to ${WORLD_EXPECTED_COUNT}.`,
      });
      continue;
    }
    if (typeof level.level !== 'number' || !Number.isInteger(level.level) || level.level < 1) {
      addFailure({
        id: 'content.levelspec.levelIndexInvalid',
        file: rel(CAMPAIGN_ARTIFACT_PATH),
        line: 1,
        message: `Level entry #${index} has invalid level value ${String(level.level)}.`,
        hint: 'Use positive integer level numbers.',
      });
      continue;
    }

    const levelKey = `${level.world}-${level.level}`;
    if (seenLevels.has(levelKey)) {
      addFailure({
        id: 'content.levelspec.levelDuplicate',
        file: rel(CAMPAIGN_ARTIFACT_PATH),
        line: 1,
        message: `Duplicate campaign level key ${levelKey}.`,
        hint: 'Ensure each world/level appears once.',
      });
    }
    seenLevels.add(levelKey);

    if (typeof level.title !== 'string' || !level.title.trim()) {
      addFailure({
        id: 'content.levelspec.levelTitleMissing',
        file: rel(CAMPAIGN_ARTIFACT_PATH),
        line: 1,
        message: `Level ${levelKey} is missing a title.`,
        hint: 'Set a non-empty title in each level.',
      });
    }

    if (!Array.isArray(level.sequence)) {
      addFailure({
        id: 'content.levelspec.sequenceShape',
        file: rel(CAMPAIGN_ARTIFACT_PATH),
        line: 1,
        message: `Level ${levelKey} sequence must be an array.`,
        hint: 'Define sequence as six phase segments.',
      });
      continue;
    }
    if (level.sequence.length !== EXPECTED_PACE_SEQUENCE.length) {
      addFailure({
        id: 'content.levelspec.sequenceShape',
        file: rel(CAMPAIGN_ARTIFACT_PATH),
        line: 1,
        message: `Level ${levelKey} sequence should contain ${EXPECTED_PACE_SEQUENCE.length} phases.`,
        hint: `Include ${EXPECTED_PACE_SEQUENCE.join(' → ')} for every level.`,
      });
    }

    const hardRules = level.hardRules ?? {};
    const hardRuleObj = hardRules as Record<string, unknown>;
    const maxNewMechanicsPerChunk =
      typeof hardRuleObj.maxNewMechanicsPerChunk === 'number' ? Math.max(0, hardRuleObj.maxNewMechanicsPerChunk) : 1;
    const minRecoveryGap = typeof hardRuleObj.minRecoveryGap === 'number' ? Math.max(0, hardRuleObj.minRecoveryGap) : 1;
    const maxHazardClusters =
      typeof hardRuleObj.maxHazardClusters === 'number' ? Math.max(0, hardRuleObj.maxHazardClusters) : 1;

    if (typeof hardRuleObj.maxNewMechanicsPerChunk !== 'number' || hardRuleObj.maxNewMechanicsPerChunk < 0) {
      addFailure({
        id: 'content.levelspec.hardRuleShape',
        file: rel(CAMPAIGN_ARTIFACT_PATH),
        line: 1,
        message: `Level ${levelKey} hardRules.maxNewMechanicsPerChunk must be a non-negative number.`,
        hint: 'Set level hard-rules to valid limits.',
      });
    }
    if (typeof hardRuleObj.minRecoveryGap !== 'number' || hardRuleObj.minRecoveryGap < 0) {
      addFailure({
        id: 'content.levelspec.hardRuleShape',
        file: rel(CAMPAIGN_ARTIFACT_PATH),
        line: 1,
        message: `Level ${levelKey} hardRules.minRecoveryGap must be a non-negative number.`,
        hint: 'Set a valid minimum recovery gap.',
      });
    }
    if (typeof hardRuleObj.maxHazardClusters !== 'number' || hardRuleObj.maxHazardClusters < 0) {
      addFailure({
        id: 'content.levelspec.hardRuleShape',
        file: rel(CAMPAIGN_ARTIFACT_PATH),
        line: 1,
        message: `Level ${levelKey} hardRules.maxHazardClusters must be a non-negative number.`,
        hint: 'Set a valid hazard cluster limit.',
      });
    }

    const worldRule = worldRulesByWorld.get(level.world);
    if (!worldRule) {
      addFailure({
        id: 'content.levelspec.worldRulesMissing',
        file: rel(WORLD_RULES_PATH),
        line: 1,
        message: `Missing world-level contract for world ${level.world}.`,
        hint: `Add world ${level.world} constraints before campaign gating.`,
      });
      continue;
    }

    const chunkTagsRaw = worldRule.allowedChunkTags;
    if (!Array.isArray(chunkTagsRaw)) {
      addFailure({
        id: 'content.levelspec.worldRulesShape',
        file: rel(WORLD_RULES_PATH),
        line: 1,
        message: `World ${level.world} missing allowedChunkTags array.`,
        hint: 'Add allowedChunkTags as a string array to world_rules.json.',
      });
    }
    const hazardTagsRaw = worldRule.allowedHazardTags;
    if (!Array.isArray(hazardTagsRaw)) {
      addFailure({
        id: 'content.levelspec.worldRulesShape',
        file: rel(WORLD_RULES_PATH),
        line: 1,
        message: `World ${level.world} missing allowedHazardTags array.`,
        hint: 'Add allowedHazardTags as a string array to world_rules.json.',
      });
    }

    const allowedChunkTags = new Set((Array.isArray(chunkTagsRaw) ? chunkTagsRaw : WORLD_HAZARD_TAGS).map((tag) => String(tag)));
    const hazardTags = new Set((Array.isArray(hazardTagsRaw) ? hazardTagsRaw : WORLD_HAZARD_TAGS).map((tag) => String(tag)));
    const worldMinRecoveryGap =
      typeof worldRule.minRecoveryGap === 'number' ? worldRule.minRecoveryGap : Number.NaN;
    const worldMaxHazardClusters =
      typeof worldRule.maxHazardClusters === 'number' ? worldRule.maxHazardClusters : Number.NaN;
    const worldMaxNewMechanicsPerChunk =
      typeof worldRule.maxNewMechanicsPerChunk === 'number' ? worldRule.maxNewMechanicsPerChunk : Number.NaN;

    if (!Number.isFinite(worldMinRecoveryGap)) {
      addFailure({
        id: 'content.levelspec.worldRulesShape',
        file: rel(WORLD_RULES_PATH),
        line: 1,
        message: `World ${level.world} rule minRecoveryGap is not a number.`,
        hint: 'Set minRecoveryGap as a number in world_rules.json.',
      });
    } else if (minRecoveryGap < worldMinRecoveryGap) {
      addFailure({
        id: 'content.levelspec.levelRecoveryMismatch',
        file: rel(CAMPAIGN_ARTIFACT_PATH),
        line: 1,
        message: `Level ${levelKey} minRecoveryGap (${minRecoveryGap}) is below world ${level.world} contract (${worldRule.minRecoveryGap}).`,
        hint: `Use minRecoveryGap >= ${String(worldRule.minRecoveryGap)}.`,
      });
    }
    if (
      STRICT_CAMPAIGN_PACING_CHECKS
      && (!Number.isFinite(worldMaxHazardClusters) || (worldMaxHazardClusters > 0 && worldMaxHazardClusters < maxHazardClusters))
    ) {
      if (!Number.isFinite(worldMaxHazardClusters)) {
        addFailure({
          id: 'content.levelspec.worldRulesShape',
          file: rel(WORLD_RULES_PATH),
          line: 1,
          message: `World ${level.world} rule maxHazardClusters is not a number.`,
          hint: 'Set maxHazardClusters as a number in world_rules.json.',
        });
      } else {
        addFailure({
          id: 'content.levelspec.levelHazardMismatch',
          file: rel(CAMPAIGN_ARTIFACT_PATH),
          line: 1,
          message: `Level ${levelKey} maxHazardClusters (${maxHazardClusters}) exceeds world ${level.world} contract.`,
          hint: `Reduce maxHazardClusters to ≤ ${String(worldRule.maxHazardClusters)}.`,
        });
      }
    }
    if (!Number.isFinite(worldMaxNewMechanicsPerChunk)) {
      addFailure({
        id: 'content.levelspec.worldRulesShape',
        file: rel(WORLD_RULES_PATH),
        line: 1,
        message: `World ${level.world} rule maxNewMechanicsPerChunk is not a number.`,
        hint: 'Set maxNewMechanicsPerChunk as a number in world_rules.json.',
      });
    } else if (worldMaxNewMechanicsPerChunk < maxNewMechanicsPerChunk) {
      addFailure({
        id: 'content.levelspec.levelMechanicMismatch',
        file: rel(CAMPAIGN_ARTIFACT_PATH),
        line: 1,
        message: `Level ${levelKey} maxNewMechanicsPerChunk (${maxNewMechanicsPerChunk}) exceeds world ${level.world} contract (${worldRule.maxNewMechanicsPerChunk}).`,
        hint: `Reduce maxNewMechanicsPerChunk to ≤ ${String(worldRule.maxNewMechanicsPerChunk)}.`,
      });
    }

    let sequenceValid = true;
    for (let phaseIndex = 0; phaseIndex < EXPECTED_PACE_SEQUENCE.length; phaseIndex += 1) {
      const expected = EXPECTED_PACE_SEQUENCE[phaseIndex];
      const segment = level.sequence[phaseIndex];
      if (!segment || typeof segment !== 'object') {
        sequenceValid = false;
        continue;
      }
      const seg = segment as CampaignSequenceItem;
      if (typeof seg.phase !== 'string') {
        addFailure({
          id: 'content.levelspec.sequencePhase',
          file: rel(CAMPAIGN_ARTIFACT_PATH),
          line: 1,
          message: `Level ${levelKey} segment ${phaseIndex} phase must be string.`,
          hint: `Use ${EXPECTED_PACE_SEQUENCE.join(', ')} phase values.`,
        });
        sequenceValid = false;
        continue;
      }
      if (seg.phase !== expected) {
        addFailure({
          id: 'content.levelspec.sequencePhase',
          file: rel(CAMPAIGN_ARTIFACT_PATH),
          line: 1,
          message: `Level ${levelKey} has phase "${seg.phase}" at position ${phaseIndex}; expected "${expected}".`,
          hint: `Use phase order ${EXPECTED_PACE_SEQUENCE.join(' → ')}.`,
        });
        sequenceValid = false;
      }
      if (!Array.isArray(seg.chunks) || seg.chunks.length === 0) {
        addFailure({
          id: 'content.levelspec.segmentChunkShape',
          file: rel(CAMPAIGN_ARTIFACT_PATH),
          line: 1,
          message: `Level ${levelKey} segment ${expected} must include at least one chunk id.`,
          hint: 'Add chunk ids for each phase segment.',
        });
        sequenceValid = false;
      }
    }

    const seenMechanics = new Set<string>();
    let openingNewMechanics = 0;
    let hazardRun = 0;
    let recoveryDebt = 0;
    const allChunkIds: string[] = [];
    for (const segment of level.sequence as unknown[]) {
      if (!segment || typeof segment !== 'object') {
        continue;
      }
      const seg = segment as CampaignSequenceItem;
      const chunkIds = Array.isArray(seg.chunks) ? (seg.chunks as unknown[]) : [];
      for (const chunkRaw of chunkIds) {
        if (typeof chunkRaw !== 'string' || !chunkRaw.trim()) {
          addFailure({
            id: 'content.levelspec.chunkShape',
            file: rel(CAMPAIGN_ARTIFACT_PATH),
            line: 1,
            message: `Level ${levelKey} contains non-string chunk id.`,
            hint: 'Use string chunk ids from chunk_catalog.json.',
          });
          continue;
        }
        allChunkIds.push(chunkRaw);
      }
    }
    if (allChunkIds.length < 3) {
      addFailure({
        id: 'content.levelspec.sequenceTooShort',
        file: rel(CAMPAIGN_ARTIFACT_PATH),
        line: 1,
        message: `Level ${levelKey} has too few chunks (${allChunkIds.length}).`,
        hint: 'Campaign chunks should be sufficiently long to support pacing.',
      });
    }

    for (let chunkIndex = 0; chunkIndex < allChunkIds.length; chunkIndex += 1) {
      const chunkId = allChunkIds[chunkIndex];
      const chunk = catalogById.get(chunkId);
      if (!chunk) {
        addFailure({
          id: 'content.levelspec.chunkUnknown',
          file: rel(CAMPAIGN_ARTIFACT_PATH),
          line: 1,
          message: `Level ${levelKey} references unknown chunk "${chunkId}".`,
          hint: 'Add chunk to chunk_catalog.json before using in campaign artifacts.',
        });
        continue;
      }

      const chunkTags = Array.isArray(chunk.tags) ? (chunk.tags as unknown[]) : [];
      if (STRICT_CAMPAIGN_PACING_CHECKS) {
        for (const rawTag of chunkTags) {
          const tag = String(rawTag);
          if (!allowedChunkTags.has(tag)) {
            addFailure({
              id: 'content.levelspec.chunkTagBlocked',
              file: rel(CAMPAIGN_ARTIFACT_PATH),
              line: 1,
              message: `Level ${levelKey} chunk "${chunkId}" uses tag "${tag}" not allowed in world ${level.world}.`,
              hint: `Add chunk tags to world ${level.world} rules or move chunk to a later world.`,
            });
          }
        }
      }

      const isHazardChunk = chunkTags.some((rawTag) => hazardTags.has(String(rawTag)));
      hazardRun = isHazardChunk ? hazardRun + 1 : 0;
      if (isHazardChunk && hazardRun > maxHazardClusters) {
        addFailure({
          id: 'content.levelspec.hazardRun',
          file: rel(CAMPAIGN_ARTIFACT_PATH),
          line: 1,
          message: `Level ${levelKey} has hazard run of ${hazardRun} chunks > maxHazardClusters=${maxHazardClusters} at "${chunkId}".`,
          hint: `Reduce consecutive hazard chunks or increase level hard-rule maxHazardClusters.`,
        });
      }

      const isRecoveryChunk = chunk.recoveryAfter === true;
      if (STRICT_CAMPAIGN_PACING_CHECKS) {
        if (recoveryDebt > 0 && isRecoveryChunk) {
          recoveryDebt = 0;
        } else if (recoveryDebt > 0 && !isRecoveryChunk) {
          recoveryDebt -= 1;
          if (recoveryDebt === 0) {
            addFailure({
              id: 'content.levelspec.recoveryGap',
              file: rel(CAMPAIGN_ARTIFACT_PATH),
              line: 1,
              message: `Level ${levelKey} should include a recoveryAfter chunk within ${minRecoveryGap} chunk(s) after high-risk chunk "${chunkId}".`,
              hint: 'Insert a recovery chunk (recoveryAfter: true) within the recovery window.',
            });
          }
        }
        if (isHazardChunk && minRecoveryGap > 0 && !isRecoveryChunk) {
          recoveryDebt = Math.max(recoveryDebt, minRecoveryGap);
        }
      }

      const mechanics = Array.isArray(chunk.mechanicsIntroduced) ? (chunk.mechanicsIntroduced as unknown[]) : [];
      const newMechanics: string[] = [];
      for (const rawMechanic of mechanics) {
        const mechanic = String(rawMechanic);
        if (!seenMechanics.has(mechanic)) {
          newMechanics.push(mechanic);
          seenMechanics.add(mechanic);
        }
      }
      if (newMechanics.length > maxNewMechanicsPerChunk) {
        addFailure({
          id: 'content.levelspec.newMechanicOverrun',
          file: rel(CAMPAIGN_ARTIFACT_PATH),
          line: 1,
          message: `Level ${levelKey} chunk "${chunkId}" introduces ${newMechanics.length} new mechanics (max ${maxNewMechanicsPerChunk}).`,
          hint: `Split the chunk or reduce mechanics introduced for one chunk.`,
        });
      }

      if (chunkIndex < 2) {
        openingNewMechanics += newMechanics.length;
      }
    }

    if (STRICT_CAMPAIGN_PACING_CHECKS && recoveryDebt > 0) {
      addFailure({
        id: 'content.levelspec.recoveryGap',
        file: rel(CAMPAIGN_ARTIFACT_PATH),
        line: 1,
        message: `Level ${levelKey} should include a recoveryAfter chunk within ${minRecoveryGap} chunk(s) after a high-risk chunk before the level ends.`,
        hint: 'Append or move a recovery chunk (`recoveryAfter: true`) earlier in sequence.',
      });
      recoveryDebt = 0;
    }

    if (STRICT_CAMPAIGN_PACING_CHECKS && sequenceValid && openingNewMechanics > 1) {
      addFailure({
        id: 'content.levelspec.openingMechanicSpike',
        file: rel(CAMPAIGN_ARTIFACT_PATH),
        line: 1,
        message: `Level ${levelKey} introduces ${openingNewMechanics} new mechanics across first two chunks (limit 1).`,
        hint: 'Keep opening pacing conservative.',
      });
    }
  }
}

function validateAssetManifestImagesForProduction(): void {
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
      message: `Runtime manifest image key "${key}" resolves to ${descriptor.path}`,
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
  validateWorldRulesJson();
  validateCampaignAndChunkArtifacts();

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
