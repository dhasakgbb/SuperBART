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

  if (!hud || !hud.topText || !hud.rightText || !hud.portrait) {
    errors.push('hudLayout constants are incomplete. Expected topText, rightText, and portrait.');
    return;
  }

  if (hud.viewport.width !== 960 || hud.viewport.height !== 540) {
    errors.push(
      `hudLayout.viewport must stay locked to 960x540, received ${hud.viewport.width}x${hud.viewport.height}`,
    );
  }

  assertRange(errors, 'hudLayout.topText.x', hud.topText.x, 74, 100);
  assertRange(errors, 'hudLayout.topText.y', hud.topText.y, 8, 16);
  assertRange(errors, 'hudLayout.topText.fontSizePx', hud.topText.fontSizePx, 12, 16);

  assertRange(errors, 'hudLayout.rightText.x', hud.rightText.x, 920, 952);
  assertRange(errors, 'hudLayout.rightText.y', hud.rightText.y, 8, 16);
  assertRange(errors, 'hudLayout.rightText.fontSizePx', hud.rightText.fontSizePx, 12, 16);

  assertRange(errors, 'hudLayout.portrait.x', hud.portrait.x, 8, 22);
  assertRange(errors, 'hudLayout.portrait.y', hud.portrait.y, 4, 14);
  assertRange(errors, 'hudLayout.portrait.scale', hud.portrait.scale, 0.62, 0.72);

  const allowedAnchors = new Set(['top-left', 'top-right']);
  if (!allowedAnchors.has(hud.topText.anchor)) {
    errors.push(`hudLayout.topText.anchor must be top-left or top-right, received ${hud.topText.anchor}`);
  }
  if (!allowedAnchors.has(hud.rightText.anchor)) {
    errors.push(`hudLayout.rightText.anchor must be top-left or top-right, received ${hud.rightText.anchor}`);
  }
  if (hud.portrait.anchor !== 'top-left') {
    errors.push(`hudLayout.portrait.anchor must be top-left for the locked HUD layout, received ${hud.portrait.anchor}`);
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
  assertRange(errors, 'titleLayout.wordmark.y', title.wordmark.y, 30, 88);
  assertRange(errors, 'titleLayout.wordmark.scale', title.wordmark.scale, 0.8, 1.25);
  if (title.wordmark.anchor !== 'top-center') {
    errors.push(`titleLayout.wordmark.anchor must be top-center, received ${title.wordmark.anchor}`);
  }

  assertRange(errors, 'titleLayout.portrait.x', title.portrait.x, 680, 840);
  assertRange(errors, 'titleLayout.portrait.y', title.portrait.y, 70, 140);
  assertRange(errors, 'titleLayout.portrait.scale', title.portrait.scale, 0.5, 0.75);

  assertRange(errors, 'titleLayout.subtitle.x', title.subtitle.x, 440, 520);
  assertRange(errors, 'titleLayout.subtitle.y', title.subtitle.y, 186, 260);
  assertRange(errors, 'titleLayout.subtitle.fontSizePx', title.subtitle.fontSizePx, 16, 24);
  assertRange(errors, 'titleLayout.subtitle.letterSpacingPx', title.subtitle.letterSpacingPx, 1, 3);

  assertRange(errors, 'titleLayout.prompt.x', title.prompt.x, 440, 520);
  assertRange(errors, 'titleLayout.prompt.y', title.prompt.y, 360, 430);
  assertRange(errors, 'titleLayout.prompt.fontSizePx', title.prompt.fontSizePx, 20, 32);
  assertRange(errors, 'titleLayout.prompt.blinkMs', title.prompt.blinkMs, 280, 700);

  assertRange(errors, 'titleLayout.hints.x', title.hints.x, 440, 520);
  assertRange(errors, 'titleLayout.hints.y', title.hints.y, 430, 500);
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
  } else {
    for (const [index, cloud] of title.attract.clouds.entries()) {
      assertRange(errors, `titleLayout.attract.clouds[${index}].x`, cloud.x, 120, 1000);
      assertRange(errors, `titleLayout.attract.clouds[${index}].y`, cloud.y, 60, 220);
      assertRange(errors, `titleLayout.attract.clouds[${index}].scale`, cloud.scale, 1.5, 2.6);
      assertRange(errors, `titleLayout.attract.clouds[${index}].alpha`, cloud.alpha, 0.3, 0.75);
    }
  }

  assertRange(errors, 'titleLayout.attract.questionBlock.x', title.attract.questionBlock.x, 520, 760);
  assertRange(errors, 'titleLayout.attract.questionBlock.y', title.attract.questionBlock.y, 260, 380);
  assertRange(errors, 'titleLayout.attract.questionBlock.bobPx', title.attract.questionBlock.bobPx, 4, 10);
  assertRange(errors, 'titleLayout.attract.questionBlock.bobMs', title.attract.questionBlock.bobMs, 900, 1800);
  assertRange(errors, 'titleLayout.attract.questionBlock.scale', title.attract.questionBlock.scale, 2.2, 3.4);

  assertRange(errors, 'titleLayout.attract.coinLine.count', title.attract.coinLine.count, 3, 6);
  assertRange(errors, 'titleLayout.attract.coinLine.scale', title.attract.coinLine.scale, 1.8, 2.8);
  assertRange(errors, 'titleLayout.attract.coinLine.shimmerMs', title.attract.coinLine.shimmerMs, 480, 1200);
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
  if (source.includes('fontFamily')) {
    errors.push('TitleScene may not use system fontFamily declarations; use bitmap text + generated logo.');
  }
  if (source.includes('this.add.text(')) {
    errors.push('TitleScene may not use system text rendering. Use bitmapText and generated title_logo.');
  }
  if (source.includes('this.add.graphics(') || source.includes('this.add.rectangle(')) {
    errors.push('TitleScene may not use primitive placeholder shapes; use generated sprite kit assets.');
  }

  const hardcodedPlacementPattern = /this\.add\.(?:text|bitmapText|image|sprite|rectangle)\(\s*\d/;
  if (hardcodedPlacementPattern.test(source)) {
    errors.push(
      'TitleScene contains hardcoded numeric placement in this.add(...) calls. Move placement values into styleConfig.titleLayout.',
    );
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
  if (source.includes('this.add.text(') || source.includes('.add.text(')) {
    errors.push('HUD must not use system text rendering.');
  }
  if (source.includes('.add.rectangle(') || source.includes('add.graphics(')) {
    errors.push('HUD should avoid primitive placeholder panels; use sprite-kit visuals only.');
  }
}

function validateTitleExpectedDoc(errors: ErrorList): void {
  const expectedPath = path.resolve('docs/screenshots/title_expected.md');
  if (!fs.existsSync(expectedPath)) {
    errors.push('Missing visual gate doc: docs/screenshots/title_expected.md');
    return;
  }

  const content = fs.readFileSync(expectedPath, 'utf-8');
  const requiredPhrases = [
    'title_logo.png',
    'PRESS ENTER',
    'TitleScene',
    'styleConfig.ts',
    'attract-style scene',
  ];
  for (const phrase of requiredPhrases) {
    if (!content.includes(phrase)) {
      errors.push(`docs/screenshots/title_expected.md must mention "${phrase}".`);
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

  const ramps = palette.ramps;
  if (!ramps || !Array.isArray(ramps.terrain) || !Array.isArray(ramps.ui) || !Array.isArray(ramps.fx)) {
    errors.push('palette.ramps.terrain/ui/fx arrays must exist.');
    return;
  }

  for (const [rampName, entries] of Object.entries(ramps)) {
    if (!Array.isArray(entries) || entries.length < 2) {
      errors.push(`palette.ramps.${rampName} must contain at least two named colors.`);
    }
    for (const entry of entries) {
      if (!names.has(entry)) {
        errors.push(`palette.ramps.${rampName} references unknown swatch: ${entry}`);
      }
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

function main(): number {
  const errors: ErrorList = [];
  validateHudLayout(errors);
  validateTitleLayout(errors);
  validatePalette(errors);
  validateBloom(errors);
  validateTypography(errors);
  validateTitleSceneContract(errors);
  validateHudContract(errors);
  validateTitleExpectedDoc(errors);

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
