import Phaser from 'phaser';
import './style.css';
import { createGameConfig } from './core/gameConfig';
import { BootScene } from './scenes/BootScene';
import { TitleScene } from './scenes/TitleScene';
import { WorldMapScene } from './scenes/WorldMapScene';
import { PlayScene } from './scenes/PlayScene';
import { PauseScene } from './scenes/PauseScene';
import { LevelCompleteScene } from './scenes/LevelCompleteScene';
import { GameOverScene } from './scenes/GameOverScene';
import { FinalVictoryScene } from './scenes/FinalVictoryScene';
import { SettingsScene } from './scenes/SettingsScene';
import { InterludeScene } from './scenes/InterludeScene';
import { DebriefScene } from './scenes/DebriefScene';
import { ChoiceScene } from './scenes/ChoiceScene';
import { CreditsScene } from './scenes/CreditsScene';
import { GalleryScene } from './scenes/GalleryScene';
import { BartsRulesScene } from './scenes/BartsRulesScene';
const scenes = [
  BootScene,
  TitleScene,
  WorldMapScene,
  PlayScene,
  InterludeScene,
  DebriefScene,
  ChoiceScene,
  CreditsScene,
  GalleryScene,
  BartsRulesScene,
  PauseScene,
  LevelCompleteScene,
  GameOverScene,
  FinalVictoryScene,
  SettingsScene
];

function init() {
  if ((window as any).__SUPER_BART__?.game) return;

  const config = createGameConfig(scenes);
  
  try {
    const game = new Phaser.Game(config);
    const existing = (window as any).__SUPER_BART__ ?? {};
    (window as any).__SUPER_BART__ = { ...existing, game };

    // Wait slightly for boot to finish for deterministic startup in tests.
    setTimeout(() => {
      if (!game.scene.isActive('BootScene') && game.scene.getScene('BootScene')) {
        game.scene.start('BootScene');
      }
    }, 100);

  } catch (e) {
    console.error('Phaser Init Error:', e);
  }
}

init();
