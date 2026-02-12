import Phaser from 'phaser';
import './style.css';
import { createGameConfig } from './game/config.js';
import { BootScene } from './scenes/BootScene.js';
import { PlayScene } from './scenes/PlayScene.js';

const game = new Phaser.Game(createGameConfig([BootScene, PlayScene]));

window.__SUPER_BART__ = {
  ...(window.__SUPER_BART__ || {}),
  game
};
