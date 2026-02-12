import { GAME_MODES } from '../game/config.js';

export function createHud(scene, state) {
  const scoreText = scene.add
    .text(10, 8, '', { fontSize: '20px', color: '#ffffff', stroke: '#000000', strokeThickness: 4 })
    .setScrollFactor(0)
    .setDepth(50);

  const livesText = scene.add
    .text(10, 34, '', { fontSize: '20px', color: '#ffffff', stroke: '#000000', strokeThickness: 4 })
    .setScrollFactor(0)
    .setDepth(50);

  const statusText = scene.add
    .text(10, 60, '', { fontSize: '18px', color: '#ffed86', stroke: '#000000', strokeThickness: 4 })
    .setScrollFactor(0)
    .setDepth(50);

  const controlsText = scene.add
    .text(10, 86, 'Move: Arrow / A-D  Jump: Space/W/Up  Restart: R', {
      fontSize: '14px',
      color: '#e6f6ff',
      stroke: '#000000',
      strokeThickness: 3
    })
    .setScrollFactor(0)
    .setDepth(50);

  renderHud({ scoreText, livesText, statusText, controlsText }, state, 0);
  return { scoreText, livesText, statusText, controlsText };
}

export function renderHud(hud, state, coinsRemaining) {
  hud.scoreText.setText(`Score: ${state.score}`);
  hud.livesText.setText(`Lives: ${state.lives}  Coins Left: ${coinsRemaining}`);

  if (state.mode === GAME_MODES.WIN) {
    hud.statusText.setText('YOU WIN! Press R to restart.');
  } else if (state.mode === GAME_MODES.LOSE) {
    hud.statusText.setText('GAME OVER. Press R to restart.');
  } else {
    hud.statusText.setText('Reach the flag!');
  }
}
