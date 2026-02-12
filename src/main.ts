import Phaser from 'phaser';
import './style.css';
import { createGameConfig } from './core/gameConfig';
import { BootScene } from './scenes/BootScene';
import { GameOverScene } from './scenes/GameOverScene';
import { LevelCompleteScene } from './scenes/LevelCompleteScene';
import { PlayScene } from './scenes/PlayScene';
import { SettingsScene } from './scenes/SettingsScene';
import { TitleScene } from './scenes/TitleScene';
import { WorldMapScene } from './scenes/WorldMapScene';

const game = new Phaser.Game(
  createGameConfig([
    BootScene,
    TitleScene,
    WorldMapScene,
    PlayScene,
    LevelCompleteScene,
    GameOverScene,
    SettingsScene
  ])
);

(window as Window & { __SUPER_BART__?: Record<string, unknown> }).__SUPER_BART__ = {
  ...(window as Window & { __SUPER_BART__?: Record<string, unknown> }).__SUPER_BART__,
  game
};
