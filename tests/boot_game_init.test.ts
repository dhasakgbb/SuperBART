import { describe, expect, test } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ASSET_MANIFEST } from '../src/core/assetManifest';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');

describe('boot and config sanity', () => {
  test('asset manifest has required keys', () => {
    expect(ASSET_MANIFEST.spritesheets).toHaveProperty('bart_body_small');
    expect(ASSET_MANIFEST.spritesheets.bart_body_small.path).toContain('bart_body_small.png');
    const enemyWalkerSS = ASSET_MANIFEST.spritesheets.enemy_walker;
    expect(enemyWalkerSS.path).toContain('enemy_walker.png');
    expect(ASSET_MANIFEST.bitmapFonts.hud.texture).toContain('bitmap_font.png');
    expect(ASSET_MANIFEST.bitmapFonts.hud.data).toContain('bitmap_font.fnt');
    expect(Object.keys(ASSET_MANIFEST.images).length).toBeGreaterThan(20);
  });

  test('main scene wiring includes required flow scenes', () => {
    const mainSource = readFileSync(path.join(repoRoot, 'src/main.ts'), 'utf-8');
    expect(mainSource).toContain('BootScene');
    expect(mainSource).toContain('TitleScene');
    expect(mainSource).toContain('WorldMapScene');
    expect(mainSource).toContain('PlayScene');
    expect(mainSource).toContain('PauseScene');
    expect(mainSource).toContain('LevelCompleteScene');
    expect(mainSource).toContain('GameOverScene');
    expect(mainSource).toContain('FinalVictoryScene');
    expect(mainSource).toContain('SettingsScene');
  });
});
