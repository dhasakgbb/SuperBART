import Phaser from 'phaser';
import './style.css';
import { createGameConfig } from './core/gameConfig';
import { BootScene } from './scenes/BootScene';
import { FinalVictoryScene } from './scenes/FinalVictoryScene';
import { GameOverScene } from './scenes/GameOverScene';
import { LevelCompleteScene } from './scenes/LevelCompleteScene';
import { PauseScene } from './scenes/PauseScene';
import { PlayScene } from './scenes/PlayScene';
import { SettingsScene } from './scenes/SettingsScene';
import { TitleScene } from './scenes/TitleScene';
import { WorldMapScene } from './scenes/WorldMapScene';
console.log('DEBUG: Starting main.ts');

const scenes = {
  BootScene,
  TitleScene,
  WorldMapScene,
  PlayScene,
  PauseScene,
  LevelCompleteScene,
  GameOverScene,
  FinalVictoryScene,
  SettingsScene
};

try {
  const appEl = document.getElementById('app');
  if (!appEl) {
    console.error('CRITICAL: DOM element #app not found!');
  } else {
    console.log('DEBUG: DOM element #app found.', appEl);
  }

    const game = new Phaser.Game(
    createGameConfig(Object.values(scenes))
  );

  game.events.on('poststep', () => {
     // Log only once
     if (!(window as any)._stepLogged) {
         console.log('DEBUG: Game loop ticking (poststep)');
         (window as any)._stepLogged = true;
     }
  });

  game.events.on('ready', () => {
    // Ensure BootScene starts if not automatically triggered
    if (!game.scene.isActive('BootScene')) {
        game.scene.start('BootScene');
    }
  });

  (window as Window & { __SUPER_BART__?: Record<string, unknown> }).__SUPER_BART__ = {
    ...(window as Window & { __SUPER_BART__?: Record<string, unknown> }).__SUPER_BART__,
    game
  };
} catch (e) {
  console.error('CRITICAL: Failed to create Phaser game instance:', e);
}
