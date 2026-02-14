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
const scenes = [
  BootScene,
  TitleScene,
  WorldMapScene,
  PlayScene,
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
    (window as any).__SUPER_BART__ = { game };

    // Wait slightly for boot to finish since we forced CANVAS
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
