#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import styleConfig from '../src/style/styleConfig';

type ErrorList = string[];

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
  if (!hud.leftGroup.textFormat.includes('BART')) {
    errors.push('hudLayout.leftGroup.textFormat must include BART.');
  }
  if (!hud.leftGroup.textFormat.includes('x')) {
    errors.push('hudLayout.leftGroup.textFormat must include the BART multiplier glyph pattern "x".');
  }
  if (!hud.rightGroup.textFormat.includes('WORLD')) {
    errors.push('hudLayout.rightGroup.textFormat must include WORLD.');
  }
  if (!hud.rightGroup.textFormat.includes('TIME')) {
    errors.push('hudLayout.rightGroup.textFormat must include TIME.');
  }
  assertRange(errors, 'hudLayout.timeDigits', hud.timeDigits, 3, 3);

  const forbiddenHudWords = ['LIVES', 'STAR', 'COIN'];
  for (const word of forbiddenHudWords) {
    if (hud.leftGroup.textFormat.includes(word) || hud.rightGroup.textFormat.includes(word)) {
      errors.push(`hudLayout text contracts must not include legacy HUD words. Found ${word}.`);
    }
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
  if (!source.includes('styleConfig.titleLayout')) {
    errors.push('TitleScene must read title layout values from styleConfig.titleLayout.');
  }
  if (!source.includes("'title_logo'")) {
    errors.push('TitleScene must render the generated title_logo asset.');
  }
  if (!source.includes('bitmapText')) {
    errors.push('TitleScene must use bitmap text for subtitle/prompt treatment.');
  }
  if (source.includes('fontFamily') || source.includes('this.add.text(')) {
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

  if (!source.includes('styleConfig.worldMapLayout')) {
    errors.push('WorldMapScene must read world-map layout values from styleConfig.worldMapLayout.');
  }
  if (!source.includes('bitmapText')) {
    errors.push('WorldMapScene must use bitmap text.');
  }
  if (source.includes('fontFamily') || source.includes('this.add.text(')) {
    errors.push('WorldMapScene may not use system text rendering.');
  }
  if (!source.includes('nodeSpriteKeys.selected')) {
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

  if (!source.includes('renderGameplayBackground')) {
    errors.push('PlayScene must use renderGameplayBackground from rendering/parallax.');
  }
  if (source.includes('renderThemedBackground')) {
    errors.push('PlayScene may not call legacy renderThemedBackground.');
  }
  if (!source.includes('styleConfig.gameplayLayout')) {
    errors.push('PlayScene must pass styleConfig.gameplayLayout to background renderer.');
  }
}

function validateHudContract(errors: ErrorList): void {
  const hudPath = path.resolve('src/ui/hud.ts');
  if (!fs.existsSync(hudPath)) {
    errors.push('src/ui/hud.ts is required for HUD style enforcement.');
    return;
  }
  const source = fs.readFileSync(hudPath, 'utf-8');
  if (!source.includes('bitmapText')) {
    errors.push('HUD must render using bitmapText.');
  }
  if (source.includes('.add.text(') || source.includes('fontFamily')) {
    errors.push('HUD must not use system text rendering.');
  }
  if (source.includes('PTU')) {
    errors.push('HUD must not contain PTU copy.');
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
  validateHudLayout(errors);
  validateTitleLayout(errors);
  validateGameplayLayout(errors);
  validateWorldMapLayout(errors);
  validatePalette(errors);
  validateBloom(errors);
  validateTypography(errors);
  validatePlayerAnimation(errors);
  validateTitleSceneContract(errors);
  validateWorldMapSceneContract(errors);
  validatePlaySceneContract(errors);
  validateHudContract(errors);
  validateDocs(errors);

  if (errors.length > 0) {
    console.error('Style validation failed:');
    for (const error of errors) {
      console.error(`- ${error}`);
    }
    return 1;
  }

  console.log('Style validation passed. target_look constraints are within approved ranges.');
  return 0;
}

process.exitCode = main();
