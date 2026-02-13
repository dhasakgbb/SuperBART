import type { PlayerForm, PlayerCombatState } from '../types/game';

export const COPILOT_MODE_DURATION_MS = 8_000;
export const COMPANION_DURATION_MS = 8_000;

export type CombatPickupId =
  | 'token'
  | 'eval'
  | 'gpu_allocation'
  | 'copilot_mode'
  | 'semantic_kernel'
  | 'deploy_to_prod'
  | 'works_on_my_machine';

export interface CombatStateUpdate {
  form: PlayerForm;
  combatState?: Partial<PlayerCombatState>;
  scoreBonus?: number;
  extraLife?: number;
}

const DEPLOY_HEAL_SCORE = 500;

export function normalizePlayerForm(form: PlayerForm | undefined): PlayerForm {
  if (form === 'gpu' || form === 'big' || form === 'small' || form === 'companion') {
    return form;
  }
  return 'small';
}

export function applyAzureGrowth(form: PlayerForm): PlayerForm {
  if (form === 'small') {
    return 'big';
  }
  return normalizePlayerForm(form);
}

export function applyGpuAllocation(form: PlayerForm): PlayerForm {
  if (form === 'small' || form === 'big') {
    return 'gpu';
  }
  return normalizePlayerForm(form);
}

export function applyWom(form: PlayerForm): PlayerForm {
  if (form === 'gpu') {
    return 'small';
  }
  if (form === 'big') {
    return 'small';
  }
  return 'small';
}

export function collectGrowthPowerup(form: PlayerForm): PlayerForm {
  const normalized = normalizePlayerForm(form);
  if (normalized === 'small') {
    return 'big';
  }
  if (normalized === 'big') {
    return 'gpu';
  }
  return normalized;
}

export function applyCombatPowerup(
  form: PlayerForm,
  pickupId: CombatPickupId,
  nowMs: number,
  state: Partial<PlayerCombatState> = {},
): CombatStateUpdate {
  const normalizedForm = normalizePlayerForm(form);

  if (pickupId === 'gpu_allocation') {
    return {
      form: applyGpuAllocation(normalizedForm),
      combatState: {
        form: applyGpuAllocation(normalizedForm),
      },
      scoreBonus: 0,
    };
  }

  if (pickupId === 'copilot_mode') {
    return {
      form: normalizedForm,
      combatState: {
        ...state,
        form: 'gpu',
        copilotActiveUntilMs: nowMs + COPILOT_MODE_DURATION_MS,
      },
      scoreBonus: 0,
    };
  }

  if (pickupId === 'semantic_kernel') {
    return {
      form: normalizedForm,
      combatState: {
        ...state,
        form: normalizedForm,
        hasCompanionUntilMs: nowMs + COMPANION_DURATION_MS,
      },
      scoreBonus: 0,
    };
  }

  if (pickupId === 'works_on_my_machine') {
    return {
      form: applyWom(normalizedForm),
      combatState: {
        ...state,
        form: applyWom(normalizedForm),
      },
      scoreBonus: 0,
    };
  }

  if (pickupId === 'deploy_to_prod') {
    return {
      form: normalizedForm,
      combatState: {
        ...state,
        form: normalizedForm,
      },
      extraLife: 1,
      scoreBonus: DEPLOY_HEAL_SCORE,
    };
  }

  if (pickupId === 'token' || pickupId === 'eval') {
    return { form: normalizedForm, combatState: { ...state, form: normalizedForm } };
  }

  return { form: normalizedForm, combatState: state };
}

export function resolvePlayerDamage(form: PlayerForm): { nextForm: PlayerForm; dead: boolean } {
  if (form === 'gpu') {
    return { nextForm: 'big', dead: false };
  }
  if (form === 'big') {
    return { nextForm: 'small', dead: false };
  }
  if (form === 'companion') {
    return { nextForm: 'gpu', dead: false };
  }
  return { nextForm: 'small', dead: true };
}
