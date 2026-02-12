import type { PlayerForm } from '../types/game';

export function collectGrowthPowerup(form: PlayerForm): PlayerForm {
  return form === 'small' ? 'big' : 'big';
}

export function resolvePlayerDamage(form: PlayerForm): { nextForm: PlayerForm; dead: boolean } {
  if (form === 'big') {
    return { nextForm: 'small', dead: false };
  }
  return { nextForm: 'small', dead: true };
}
