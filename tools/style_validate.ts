#!/usr/bin/env node
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

  assertRange(errors, 'hudLayout.topText.x', hud.topText.x, 8, 20);
  assertRange(errors, 'hudLayout.topText.y', hud.topText.y, 8, 16);
  assertRange(errors, 'hudLayout.topText.fontSizePx', hud.topText.fontSizePx, 14, 18);

  assertRange(errors, 'hudLayout.rightText.x', hud.rightText.x, 770, 810);
  assertRange(errors, 'hudLayout.rightText.y', hud.rightText.y, 8, 16);
  assertRange(errors, 'hudLayout.rightText.fontSizePx', hud.rightText.fontSizePx, 12, 16);

  assertRange(errors, 'hudLayout.portrait.x', hud.portrait.x, 890, 930);
  assertRange(errors, 'hudLayout.portrait.y', hud.portrait.y, 60, 86);
  assertRange(errors, 'hudLayout.portrait.scale', hud.portrait.scale, 0.58, 0.68);

  const allowedAnchors = new Set(['top-left', 'top-right']);
  if (!allowedAnchors.has(hud.topText.anchor)) {
    errors.push(`hudLayout.topText.anchor must be top-left or top-right, received ${hud.topText.anchor}`);
  }
  if (!allowedAnchors.has(hud.rightText.anchor)) {
    errors.push(`hudLayout.rightText.anchor must be top-left or top-right, received ${hud.rightText.anchor}`);
  }
  if (!allowedAnchors.has(hud.portrait.anchor)) {
    errors.push(`hudLayout.portrait.anchor must be top-left or top-right, received ${hud.portrait.anchor}`);
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

function main(): number {
  const errors: ErrorList = [];
  validateHudLayout(errors);
  validatePalette(errors);
  validateBloom(errors);

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
