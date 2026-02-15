import { SCRIPT_STAGE_DEFINITIONS } from '../content/scriptCampaign';
import { CAMPAIGN_WORLD_LAYOUT } from '../core/constants';
import type { CampaignArtifact, LevelHardRules, LevelSpec, PacingPhase, SetPieceSpec } from '../types/levelgen';

const DEFAULT_HARD_RULES: LevelHardRules = {
  maxNewMechanicsPerChunk: 1,
  minRecoveryGap: 1,
  maxHazardClusters: 2,
};

type ChunkGroup = Array<{ phase: PacingPhase; chunks: string[] }>;

function level(
  world: number,
  stage: number,
  title: string,
  sequence: ChunkGroup,
  hardRules: Partial<typeof DEFAULT_HARD_RULES>,
  setPiece?: SetPieceSpec,
): LevelSpec {
  return {
    world,
    level: stage,
    title,
    sequence,
    hardRules: { ...DEFAULT_HARD_RULES, ...hardRules },
    setPiece,
  };
}

function setPieceForWorldAndStage(world: number, stage: number): SetPieceSpec | undefined {
  if (world === 1 && stage === 3) {
    return {
      mode: 'avalanche-alley',
      description: 'Downhill chase set-piece on a torn server panel.',
    };
  }

  if (world === 2 && stage === 3) {
    return {
      mode: 'collapse',
      description: 'Quantum Void collapse sequence with platform breakaway.',
    };
  }

  if (world === 5 && stage === 2) {
    return {
      mode: 'approach',
      description: 'No-enemy corridor atmosphere approach before the boss.',
    };
  }

  return undefined;
}

function sequenceForStage(world: number, stage: number): ChunkGroup {
  // World 1: City (Prologue) - Tutorial, minimal hazards, generous checkpoints
  if (world === 1) {
    if (stage === 1) {
      return [
        { phase: 'INTRO', chunks: ['flat_intro_01', 'flat_intro_02'] },
        { phase: 'PRACTICE', chunks: ['coin_stair_01', 'gap_short_guarded_01'] },
        { phase: 'VARIATION', chunks: ['flat_guide_01', 'platform_bubble_01'] },
        { phase: 'CHALLENGE', chunks: ['walker_patrol_01'] },
        { phase: 'COOLDOWN', chunks: ['recovery_lane_01'] },
        { phase: 'FINALE', chunks: ['flat_finish_01'] },
      ];
    }
    if (stage === 2) {
      return [
        { phase: 'INTRO', chunks: ['flat_intro_02', 'platform_bubble_01'] },
        { phase: 'PRACTICE', chunks: ['coin_arch_01', 'gap_short_guarded_01'] },
        { phase: 'VARIATION', chunks: ['rise_step_01', 'platform_stack_01'] },
        { phase: 'CHALLENGE', chunks: ['walker_patrol_02', 'flying_drift_01'] },
        { phase: 'COOLDOWN', chunks: ['recovery_lane_01'] },
        { phase: 'FINALE', chunks: ['flat_finish_02'] },
      ];
    }
    // Stage 3 is the final boss for World 1
    return [
      { phase: 'INTRO', chunks: ['flat_intro_01', 'flat_guide_01'] },
      { phase: 'PRACTICE', chunks: ['coin_reward_01', 'gap_short_guarded_01'] },
      { phase: 'VARIATION', chunks: ['platform_stack_01', 'coin_arch_01'] },
      { phase: 'CHALLENGE', chunks: ['walker_patrol_03', 'flying_drift_02'] },
      { phase: 'COOLDOWN', chunks: ['recovery_lane_02'] },
      { phase: 'FINALE', chunks: ['flat_finish_01'] },
    ];
  }

  // World 2: Cryo-Server Tundra - Ice theme, moderate difficulty
  if (world === 2) {
    if (stage === 1) {
      return [
        { phase: 'INTRO', chunks: ['flat_intro_02', 'coin_stair_01'] },
        { phase: 'PRACTICE', chunks: ['gap_short_guarded_01', 'coin_arch_01'] },
        { phase: 'VARIATION', chunks: ['platform_bubble_01', 'rise_step_01'] },
        { phase: 'CHALLENGE', chunks: ['walker_patrol_02', 'flying_drift_01'] },
        { phase: 'COOLDOWN', chunks: ['recovery_lane_01'] },
        { phase: 'FINALE', chunks: ['flat_finish_02'] },
      ];
    }
    if (stage === 2) {
      return [
        { phase: 'INTRO', chunks: ['flat_intro_01', 'recovery_lane_01'] },
        { phase: 'PRACTICE', chunks: ['coin_rail_01', 'gap_short_guarded_01'] },
        { phase: 'VARIATION', chunks: ['platform_stack_01', 'coin_arch_01'] },
        { phase: 'CHALLENGE', chunks: ['walker_patrol_03', 'flying_drift_02'] },
        { phase: 'COOLDOWN', chunks: ['recovery_lane_02'] },
        { phase: 'FINALE', chunks: ['flat_finish_01'] },
      ];
    }
    if (stage === 3) {
      return [
        { phase: 'INTRO', chunks: ['flat_intro_02', 'flat_guide_01'] },
        { phase: 'PRACTICE', chunks: ['gap_long_01', 'coin_reward_01'] },
        { phase: 'VARIATION', chunks: ['platform_bubble_01', 'spike_low_01'] },
        { phase: 'CHALLENGE', chunks: ['walker_patrol_03', 'shell_blocker_01', 'flying_drift_02'] },
        { phase: 'COOLDOWN', chunks: ['recovery_lane_01'] },
        { phase: 'FINALE', chunks: ['flat_finish_02'] },
      ];
    }
    // Stage 4 is the boss for World 2
    return [
      { phase: 'INTRO', chunks: ['flat_intro_01', 'coin_stair_01'] },
      { phase: 'PRACTICE', chunks: ['gap_long_01', 'platform_stack_01'] },
      { phase: 'VARIATION', chunks: ['platform_bubble_01', 'coin_reward_01'] },
      { phase: 'CHALLENGE', chunks: ['thwomp_intro_01', 'walker_patrol_03', 'flying_drift_02'] },
      { phase: 'COOLDOWN', chunks: ['recovery_lane_02'] },
      { phase: 'FINALE', chunks: ['flat_finish_01'] },
    ];
  }

  // World 3: Quantum Void - Vertical focus, gravity zones, complexity increases
  if (world === 3) {
    if (stage === 1) {
      return [
        { phase: 'INTRO', chunks: ['flat_intro_02', 'recovery_lane_01'] },
        { phase: 'PRACTICE', chunks: ['coin_stair_01', 'gap_short_guarded_01'] },
        { phase: 'VARIATION', chunks: ['platform_stack_01', 'rise_step_01'] },
        { phase: 'CHALLENGE', chunks: ['walker_patrol_02', 'flying_drift_01'] },
        { phase: 'COOLDOWN', chunks: ['recovery_lane_01'] },
        { phase: 'FINALE', chunks: ['flat_finish_02'] },
      ];
    }
    if (stage === 2) {
      return [
        { phase: 'INTRO', chunks: ['flat_intro_01', 'flat_guide_01'] },
        { phase: 'PRACTICE', chunks: ['gap_long_01', 'coin_arch_01'] },
        { phase: 'VARIATION', chunks: ['platform_bubble_01', 'platform_stack_01'] },
        { phase: 'CHALLENGE', chunks: ['walker_patrol_03', 'flying_drift_02'] },
        { phase: 'COOLDOWN', chunks: ['recovery_lane_02'] },
        { phase: 'FINALE', chunks: ['flat_finish_01'] },
      ];
    }
    if (stage === 3) {
      return [
        { phase: 'INTRO', chunks: ['flat_intro_02', 'coin_reward_01'] },
        { phase: 'PRACTICE', chunks: ['spike_low_01', 'gap_short_guarded_01'] },
        { phase: 'VARIATION', chunks: ['platform_stack_01', 'coin_rail_01'] },
        { phase: 'CHALLENGE', chunks: ['walker_patrol_03', 'thwomp_intro_01', 'flying_drift_02'] },
        { phase: 'COOLDOWN', chunks: ['recovery_lane_01'] },
        { phase: 'FINALE', chunks: ['flat_finish_02'] },
      ];
    }
    // Stage 4 is the boss for World 3
    return [
      { phase: 'INTRO', chunks: ['flat_intro_01', 'flat_guide_01'] },
      { phase: 'PRACTICE', chunks: ['gap_long_01', 'platform_stack_01'] },
      { phase: 'VARIATION', chunks: ['platform_bubble_01', 'coin_reward_01'] },
      { phase: 'CHALLENGE', chunks: ['thwomp_intro_01', 'walker_patrol_03', 'flying_drift_02'] },
      { phase: 'COOLDOWN', chunks: ['recovery_lane_02'] },
      { phase: 'FINALE', chunks: ['flat_finish_01'] },
    ];
  }

  // World 4: Deep Web Catacombs - Dark, signal drift (0.6 friction), challenging
  if (world === 4) {
    if (stage === 1) {
      return [
        { phase: 'INTRO', chunks: ['flat_intro_02', 'coin_stair_01'] },
        { phase: 'PRACTICE', chunks: ['gap_short_guarded_01', 'coin_arch_01'] },
        { phase: 'VARIATION', chunks: ['platform_bubble_01', 'rise_step_01'] },
        { phase: 'CHALLENGE', chunks: ['walker_patrol_02', 'flying_drift_01'] },
        { phase: 'COOLDOWN', chunks: ['recovery_lane_01'] },
        { phase: 'FINALE', chunks: ['flat_finish_02'] },
      ];
    }
    if (stage === 2) {
      return [
        { phase: 'INTRO', chunks: ['flat_intro_01', 'recovery_lane_01'] },
        { phase: 'PRACTICE', chunks: ['gap_long_01', 'coin_reward_01'] },
        { phase: 'VARIATION', chunks: ['platform_stack_01', 'spike_low_01'] },
        { phase: 'CHALLENGE', chunks: ['walker_patrol_03', 'flying_drift_02', 'vanish_platform_01'] },
        { phase: 'COOLDOWN', chunks: ['recovery_lane_02'] },
        { phase: 'FINALE', chunks: ['flat_finish_01'] },
      ];
    }
    if (stage === 3) {
      return [
        { phase: 'INTRO', chunks: ['flat_intro_02', 'flat_guide_01'] },
        { phase: 'PRACTICE', chunks: ['spike_sweep_01', 'coin_arch_01'] },
        { phase: 'VARIATION', chunks: ['platform_bubble_01', 'coin_rail_01'] },
        { phase: 'CHALLENGE', chunks: ['walker_patrol_03', 'thwomp_intro_01', 'vanish_platform_01'] },
        { phase: 'COOLDOWN', chunks: ['recovery_lane_01'] },
        { phase: 'FINALE', chunks: ['flat_finish_02'] },
      ];
    }
    // Stage 4 is the boss for World 4
    return [
      { phase: 'INTRO', chunks: ['flat_intro_01', 'coin_stair_01'] },
      { phase: 'PRACTICE', chunks: ['gap_long_01', 'platform_stack_01'] },
      { phase: 'VARIATION', chunks: ['spike_sweep_01', 'coin_reward_01'] },
      { phase: 'CHALLENGE', chunks: ['thwomp_intro_01', 'walker_patrol_03', 'flying_drift_02', 'vanish_platform_01'] },
      { phase: 'COOLDOWN', chunks: ['recovery_lane_02'] },
      { phase: 'FINALE', chunks: ['flat_finish_01'] },
    ];
  }

  // World 5: Digital Graveyard - Heavy gravity (1.15x), emotional peak
  if (world === 5) {
    if (stage === 1) {
      return [
        { phase: 'INTRO', chunks: ['flat_intro_02', 'coin_reward_01'] },
        { phase: 'PRACTICE', chunks: ['gap_short_guarded_01', 'spike_low_01'] },
        { phase: 'VARIATION', chunks: ['platform_bubble_01', 'rise_step_01'] },
        { phase: 'CHALLENGE', chunks: ['walker_patrol_02', 'flying_drift_01'] },
        { phase: 'COOLDOWN', chunks: ['recovery_lane_01'] },
        { phase: 'FINALE', chunks: ['flat_finish_02'] },
      ];
    }
    if (stage === 2) {
      return [
        { phase: 'INTRO', chunks: ['flat_intro_01', 'recovery_lane_01'] },
        { phase: 'PRACTICE', chunks: ['gap_long_01', 'spike_sweep_01'] },
        { phase: 'VARIATION', chunks: ['platform_stack_01', 'coin_arch_01'] },
        { phase: 'CHALLENGE', chunks: ['walker_patrol_03', 'flying_drift_02', 'thwomp_intro_01'] },
        { phase: 'COOLDOWN', chunks: ['recovery_lane_02'] },
        { phase: 'FINALE', chunks: ['flat_finish_01'] },
      ];
    }
    if (stage === 3) {
      return [
        { phase: 'INTRO', chunks: ['flat_intro_02', 'flat_guide_01'] },
        { phase: 'PRACTICE', chunks: ['coin_rail_01', 'gap_long_01'] },
        { phase: 'VARIATION', chunks: ['platform_bubble_01', 'vanish_platform_01'] },
        { phase: 'CHALLENGE', chunks: ['walker_patrol_03', 'thwomp_intro_01', 'flying_drift_02'] },
        { phase: 'COOLDOWN', chunks: ['recovery_lane_01'] },
        { phase: 'FINALE', chunks: ['flat_finish_02'] },
      ];
    }
    // Stage 4 is the boss for World 5
    return [
      { phase: 'INTRO', chunks: ['flat_intro_01', 'coin_stair_01'] },
      { phase: 'PRACTICE', chunks: ['gap_long_01', 'platform_stack_01'] },
      { phase: 'VARIATION', chunks: ['spike_sweep_01', 'coin_reward_01'] },
      { phase: 'CHALLENGE', chunks: ['thwomp_intro_01', 'walker_patrol_03', 'flying_drift_02'] },
      { phase: 'COOLDOWN', chunks: ['recovery_lane_02'] },
      { phase: 'FINALE', chunks: ['flat_finish_01'] },
    ];
  }

  // World 6: Singularity Core - Apex gate, all mechanics, auto-scroll
  if (world === 6) {
    if (stage === 1) {
      return [
        { phase: 'INTRO', chunks: ['flat_intro_02', 'coin_stair_01'] },
        { phase: 'PRACTICE', chunks: ['gap_long_01', 'coin_arch_01'] },
        { phase: 'VARIATION', chunks: ['platform_stack_01', 'spike_low_01'] },
        { phase: 'CHALLENGE', chunks: ['walker_patrol_03', 'flying_drift_02', 'thwomp_intro_01'] },
        { phase: 'COOLDOWN', chunks: ['recovery_lane_01'] },
        { phase: 'FINALE', chunks: ['flat_finish_02'] },
      ];
    }
    if (stage === 2) {
      return [
        { phase: 'INTRO', chunks: ['flat_intro_01', 'coin_reward_01'] },
        { phase: 'PRACTICE', chunks: ['gap_long_01', 'spike_sweep_01'] },
        { phase: 'VARIATION', chunks: ['platform_bubble_01', 'vanish_platform_01'] },
        { phase: 'CHALLENGE', chunks: ['walker_patrol_03', 'thwomp_intro_01', 'flying_drift_02'] },
        { phase: 'COOLDOWN', chunks: ['recovery_lane_02'] },
        { phase: 'FINALE', chunks: ['flat_finish_01'] },
      ];
    }
    if (stage === 3) {
      return [
        { phase: 'INTRO', chunks: ['flat_intro_01', 'coin_stair_01'] },
        { phase: 'PRACTICE', chunks: ['gap_long_01', 'platform_stack_01'] },
        { phase: 'VARIATION', chunks: ['spike_sweep_01', 'coin_reward_01'] },
        { phase: 'CHALLENGE', chunks: ['thwomp_intro_01', 'walker_patrol_03', 'flying_drift_02', 'benchmark_sprint_01'] },
        { phase: 'COOLDOWN', chunks: ['recovery_lane_02'] },
        { phase: 'FINALE', chunks: ['flat_finish_01'] },
      ];
    }
    // Stage 4 is W6 boss (Omega) — campaign is [4,4,4,4,4,4,4]
    return [
      { phase: 'INTRO', chunks: ['flat_intro_02', 'flat_guide_01'] },
      { phase: 'PRACTICE', chunks: ['gap_long_01', 'platform_stack_01'] },
      { phase: 'VARIATION', chunks: ['spike_sweep_01', 'coin_reward_01'] },
      { phase: 'CHALLENGE', chunks: ['thwomp_intro_01', 'walker_patrol_03', 'flying_drift_02', 'benchmark_sprint_01'] },
      { phase: 'COOLDOWN', chunks: ['recovery_lane_02'] },
      { phase: 'FINALE', chunks: ['flat_finish_02'] },
    ];
  }

  // World 7: Singularity Apex - Final escalation corridor
  if (world === 7) {
    if (stage === 1) {
      return [
        { phase: 'INTRO', chunks: ['flat_intro_02', 'coin_stair_01'] },
        { phase: 'PRACTICE', chunks: ['gap_long_01', 'coin_arch_01'] },
        { phase: 'VARIATION', chunks: ['platform_stack_01', 'spike_low_01'] },
        { phase: 'CHALLENGE', chunks: ['walker_patrol_03', 'flying_drift_02', 'thwomp_intro_01'] },
        { phase: 'COOLDOWN', chunks: ['recovery_lane_01'] },
        { phase: 'FINALE', chunks: ['flat_finish_02'] },
      ];
    }
    if (stage === 2) {
      return [
        { phase: 'INTRO', chunks: ['flat_intro_01', 'coin_reward_01'] },
        { phase: 'PRACTICE', chunks: ['gap_long_01', 'spike_sweep_01'] },
        { phase: 'VARIATION', chunks: ['platform_bubble_01', 'vanish_platform_01'] },
        { phase: 'CHALLENGE', chunks: ['walker_patrol_03', 'thwomp_intro_01', 'flying_drift_02'] },
        { phase: 'COOLDOWN', chunks: ['recovery_lane_02'] },
        { phase: 'FINALE', chunks: ['flat_finish_01'] },
      ];
    }
    if (stage === 3) {
      return [
        { phase: 'INTRO', chunks: ['flat_intro_01', 'coin_stair_01'] },
        { phase: 'PRACTICE', chunks: ['gap_long_01', 'platform_stack_01'] },
        { phase: 'VARIATION', chunks: ['spike_sweep_01', 'coin_reward_01'] },
        { phase: 'CHALLENGE', chunks: ['thwomp_intro_01', 'walker_patrol_03', 'flying_drift_02', 'benchmark_sprint_01'] },
        { phase: 'COOLDOWN', chunks: ['recovery_lane_02'] },
        { phase: 'FINALE', chunks: ['flat_finish_01'] },
      ];
    }
    // Stage 4 is W7 boss (Final Ascent)
    return [
      { phase: 'INTRO', chunks: ['flat_intro_02', 'flat_guide_01'] },
      { phase: 'PRACTICE', chunks: ['gap_long_01', 'platform_stack_01'] },
      { phase: 'VARIATION', chunks: ['spike_sweep_01', 'coin_reward_01'] },
      { phase: 'CHALLENGE', chunks: ['thwomp_intro_01', 'walker_patrol_03', 'flying_drift_02', 'benchmark_sprint_01'] },
      { phase: 'COOLDOWN', chunks: ['recovery_lane_02'] },
      { phase: 'FINALE', chunks: ['flat_finish_02'] },
    ];
  }

  // Fallback (should not reach here with proper validation)
  return [
    { phase: 'INTRO', chunks: ['flat_intro_01'] },
    { phase: 'PRACTICE', chunks: ['coin_stair_01'] },
    { phase: 'VARIATION', chunks: ['platform_bubble_01'] },
    { phase: 'CHALLENGE', chunks: ['walker_patrol_01'] },
    { phase: 'COOLDOWN', chunks: ['recovery_lane_01'] },
    { phase: 'FINALE', chunks: ['flat_finish_01'] },
  ];
}

function hardRulesFor(world: number, stage: number): Partial<LevelHardRules> {
  // Early worlds are more lenient, later worlds are stricter
  const worldCount = CAMPAIGN_WORLD_LAYOUT[world - 1] ?? 4;
  const isBossStage = stage === worldCount;

  return {
    maxNewMechanicsPerChunk: 1,
    minRecoveryGap: world >= 4 ? 2 : world >= 3 ? 1 : 1,
    maxHazardClusters: isBossStage ? 3 : world >= 5 ? 3 : world >= 3 ? 2 : 1,
  };
}

export const SCRIPT_CAMPAIGN_LEVELS: CampaignArtifact = {
  version: '4.0.0',
  generatedAt: '2026-02-14T00:00:00.000Z',
  worldCount: 7,
  levels: SCRIPT_STAGE_DEFINITIONS.map((stage) =>
    level(
      stage.world,
      stage.stage,
      stage.title,
      sequenceForStage(stage.world, stage.stage),
      hardRulesFor(stage.world, stage.stage),
      setPieceForWorldAndStage(stage.world, stage.stage),
    )),
};
