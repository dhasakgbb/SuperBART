type AssetFrameTiming = {
  fps: number;
  frameCount?: number;
};

type AssetAnchor = {
  x: number;
  y: number;
};

type ArtPass = 'enemy' | 'hazard' | 'object' | 'hud' | 'system' | 'tile';

type AssetImageDescriptor = {
  path: string;
  pass?: ArtPass;
  palette?: readonly string[];
  frameTiming?: AssetFrameTiming;
  anchorPx?: AssetAnchor;
};

export type AssetImageSource = string | AssetImageDescriptor;

const image = (path: string, meta?: Omit<AssetImageDescriptor, 'path'>): AssetImageSource =>
  meta == null ? path : { path, ...meta };

export const ASSET_MANIFEST: {
  images: Record<string, AssetImageSource>;
  spritesheets: Record<
    string,
    { path: string; frameWidth: number; frameHeight: number; }
  >;
  bitmapFonts: Record<string, { texture: string; data: string; }>;
} = {
  images: {
    bart_head_32: '/assets/sprites/bart_head_32.png',
    bart_head_48: '/assets/sprites/bart_head_48.png',
    bart_head_64: '/assets/sprites/bart_head_64.png',
    bart_portrait_96: '/assets/sprites/bart_portrait_96.png',
    dust_puff: image('/assets/sprites/dust_puff.png', {
      pass: 'object',
    }),
    particle_spark: image('/assets/sprites/particle_spark.png', {
      pass: 'object',
      anchorPx: { x: 4, y: 4 },
    }),
    particle_chain: image('/assets/sprites/particle_chain.png', {
      pass: 'object',
      anchorPx: { x: 4, y: 4 },
    }),
    boss_health_bg: image('/assets/sprites/boss_health_bg.png', {
      pass: 'hud',
      anchorPx: { x: 0, y: 0 },
    }),
    boss_health_fill: image('/assets/sprites/boss_health_fill.png', {
      pass: 'hud',
      anchorPx: { x: 0, y: 0 },
    }),
    enemy_shell_retracted: image('/assets/sprites/enemy_shell_retracted.png', {
      pass: 'enemy',
      anchorPx: { x: 8, y: 16 },
    }),
    enemy_microservice: image('/assets/sprites/enemy_microservice.png', {
      pass: 'enemy',
      anchorPx: { x: 8, y: 8 },
    }),
    projectile: image('/assets/sprites/projectile.png', {
      pass: 'object',
      palette: ['groundShadow', 'coinCore', 'coinEdge'],
      frameTiming: { fps: 12, frameCount: 1 },
      anchorPx: { x: 4, y: 4 },
    }),
    question_block: image('/assets/sprites/question_block.png', {
      pass: 'object',
      palette: ['groundWarm', 'groundMid', 'groundShadow'],
      frameTiming: { fps: 10, frameCount: 1 },
      anchorPx: { x: 8, y: 8 },
    }),
    question_block_used: image('/assets/sprites/question_block_used.png', {
      pass: 'object',
      palette: ['groundShadow', 'groundMid', 'groundWarm'],
      frameTiming: { fps: 1, frameCount: 1 },
      anchorPx: { x: 8, y: 8 },
    }),
    title_logo: image('/assets/sprites/title_logo.png', {
      pass: 'hud',
      palette: ['hudText', 'hudAccent', 'hudPanel'],
      frameTiming: { fps: 1, frameCount: 1 },
      anchorPx: { x: 256, y: 80 },
    }),
    cloud_1: image('/assets/sprites/cloud_1.png', {
      pass: 'hud',
      palette: ['hudText', 'skyMid'],
      frameTiming: { fps: 1, frameCount: 1 },
      anchorPx: { x: 12, y: 8 },
    }),
    cloud_2: image('/assets/sprites/cloud_2.png', {
      pass: 'hud',
      palette: ['hudText', 'skyMid'],
      frameTiming: { fps: 1, frameCount: 1 },
      anchorPx: { x: 16, y: 9 },
    }),
    hill_far: image('/assets/sprites/hill_far.png', {
      pass: 'hud',
      palette: ['grassTop', 'grassMid', 'groundWarm'],
      frameTiming: { fps: 1, frameCount: 1 },
      anchorPx: { x: 40, y: 44 },
    }),
    hill_near: image('/assets/sprites/hill_near.png', {
      pass: 'hud',
      palette: ['grassTop', 'grassMid', 'groundWarm'],
      frameTiming: { fps: 1, frameCount: 1 },
      anchorPx: { x: 44, y: 46 },
    }),
    map_node_open: image('/assets/sprites/map_node_open.png', {
      pass: 'hud',
      palette: ['hudPanel', 'hudText', 'hudAccent'],
      frameTiming: { fps: 1, frameCount: 1 },
      anchorPx: { x: 8, y: 8 },
    }),
    map_node_done: image('/assets/sprites/map_node_done.png', {
      pass: 'hud',
      palette: ['groundMid', 'groundWarm', 'hudText'],
      frameTiming: { fps: 1, frameCount: 1 },
      anchorPx: { x: 8, y: 8 },
    }),
    map_node_locked: image('/assets/sprites/map_node_locked.png', {
      pass: 'hud',
      palette: ['groundShadow', 'skyMid', 'inkDark'],
      frameTiming: { fps: 1, frameCount: 1 },
      anchorPx: { x: 8, y: 8 },
    }),
    map_node_selected: image('/assets/sprites/map_node_selected.png', {
      pass: 'hud',
      palette: ['hudAccent', 'grassTop', 'groundWarm'],
      frameTiming: { fps: 1, frameCount: 1 },
      anchorPx: { x: 8, y: 8 },
    }),
    map_path_dot: image('/assets/sprites/map_path_dot.png', {
      pass: 'hud',
      palette: ['coinCore', 'hudAccent'],
      frameTiming: { fps: 1, frameCount: 1 },
      anchorPx: { x: 4, y: 4 },
    }),
    pickup_token: image('/assets/sprites/pickup_token.png', {
      pass: 'object',
      palette: ['hudText', 'coinCore', 'coinEdge'],
      frameTiming: { fps: 1, frameCount: 1 },
      anchorPx: { x: 8, y: 8 },
    }),
    pickup_eval: image('/assets/sprites/pickup_eval.png', {
      pass: 'object',
      palette: ['hudAccent', 'coinCore', 'skyDeep'],
      frameTiming: { fps: 1, frameCount: 1 },
      anchorPx: { x: 8, y: 8 },
    }),
    pickup_gpu_allocation: image('/assets/sprites/pickup_gpu_allocation.png', {
      pass: 'object',
      palette: ['coinCore', 'groundShadow', 'inkDark'],
      frameTiming: { fps: 1, frameCount: 1 },
      anchorPx: { x: 8, y: 8 },
    }),
    pickup_copilot_mode: image('/assets/sprites/pickup_copilot_mode.png', {
      pass: 'object',
      palette: ['coinCore', 'groundWarm', 'inkDark'],
      frameTiming: { fps: 1, frameCount: 1 },
      anchorPx: { x: 8, y: 8 },
    }),
    pickup_semantic_kernel: image('/assets/sprites/pickup_semantic_kernel.png', {
      pass: 'object',
      palette: ['hudAccent', 'skyMid', 'inkDark'],
      frameTiming: { fps: 1, frameCount: 1 },
      anchorPx: { x: 8, y: 8 },
    }),
    pickup_deploy_to_prod: image('/assets/sprites/pickup_deploy_to_prod.png', {
      pass: 'object',
      palette: ['groundShadow', 'groundMid', 'coinCore'],
      frameTiming: { fps: 1, frameCount: 1 },
      anchorPx: { x: 8, y: 8 },
    }),
    pickup_works_on_my_machine: image('/assets/sprites/pickup_works_on_my_machine.png', {
      pass: 'object',
      palette: ['groundShadow', 'groundWarm', 'groundMid'],
      frameTiming: { fps: 1, frameCount: 1 },
      anchorPx: { x: 8, y: 8 },
    }),
    flag: image('/assets/sprites/flag.png', {
      pass: 'object',
      palette: ['hudText', 'hudAccent', 'inkDark'],
      frameTiming: { fps: 1, frameCount: 1 },
      anchorPx: { x: 8, y: 16 },
    }),
    checkpoint: image('/assets/sprites/checkpoint.png', {
      pass: 'object',
      palette: ['hudText', 'hudAccent', 'inkDark'],
      frameTiming: { fps: 1, frameCount: 1 },
      anchorPx: { x: 8, y: 8 },
    }),
    spring: image('/assets/sprites/spring.png', {
      pass: 'hazard',
      palette: ['groundShadow', 'groundMid', 'coinCore'],
      frameTiming: { fps: 1, frameCount: 1 },
      anchorPx: { x: 8, y: 8 },
    }),
    spike: image('/assets/sprites/spike.png', {
      pass: 'hazard',
      palette: ['groundShadow', 'groundMid', 'coinCore'],
      frameTiming: { fps: 1, frameCount: 1 },
      anchorPx: { x: 8, y: 16 },
    }),
    thwomp: image('/assets/sprites/thwomp.png', {
      pass: 'hazard',
      palette: ['inkDark', 'groundMid', 'coinCore'],
      frameTiming: { fps: 6, frameCount: 2 },
      anchorPx: { x: 8, y: 16 },
    }),
    moving_platform: image('/assets/sprites/moving_platform.png', {
      pass: 'hazard',
      palette: ['groundShadow', 'inkDark', 'groundMid'],
      frameTiming: { fps: 1, frameCount: 1 },
      anchorPx: { x: 16, y: 4 },
    }),
    tile_ground: image('/assets/tiles/tile_ground.png', { pass: 'object' }),
    tile_oneway: image('/assets/tiles/tile_oneway.png', { pass: 'object' }),
    tile_ground_w1_top: image('/assets/tiles/tile_ground_w1_top.png', { pass: 'tile' }),
    tile_ground_w1_mid: image('/assets/tiles/tile_ground_w1_mid.png', { pass: 'tile' }),
    tile_ground_w1_bot: image('/assets/tiles/tile_ground_w1_bot.png', { pass: 'tile' }),
    tile_oneway_w1: image('/assets/tiles/tile_oneway_w1.png', { pass: 'tile' }),

    // Placeholders for other worlds (using default for now, or copy w1 if preferred)
    tile_ground_w2_top: image('/assets/tiles/tile_ground_w2_top.png', { pass: 'tile' }),
    tile_ground_w2_mid: image('/assets/tiles/tile_ground_w2_mid.png', { pass: 'tile' }),
    tile_ground_w2_bot: image('/assets/tiles/tile_ground_w2_bot.png', { pass: 'tile' }),
    
    tile_ground_w3_top: image('/assets/tiles/tile_ground_w3_top.png', { pass: 'tile' }),
    tile_ground_w3_mid: image('/assets/tiles/tile_ground_w3_mid.png', { pass: 'tile' }),
    tile_ground_w3_bot: image('/assets/tiles/tile_ground_w3_bot.png', { pass: 'tile' }),
    
    tile_ground_w4_top: image('/assets/tiles/tile_ground_w4_top.png', { pass: 'tile' }),
    tile_ground_w4_mid: image('/assets/tiles/tile_ground_w4_mid.png', { pass: 'tile' }),
    tile_ground_w4_bot: image('/assets/tiles/tile_ground_w4_bot.png', { pass: 'tile' }),
    
    tile_ground_w5_top: image('/assets/tiles/tile_ground_w5_top.png', { pass: 'tile' }),
    tile_ground_w5_mid: image('/assets/tiles/tile_ground_w5_mid.png', { pass: 'tile' }),
    tile_ground_w5_bot: image('/assets/tiles/tile_ground_w5_bot.png', { pass: 'tile' }),
    
    tile_oneway_w2: image('/assets/tiles/tile_oneway_w2.png', { pass: 'tile' }),
    tile_oneway_w3: image('/assets/tiles/tile_oneway_w3.png', { pass: 'tile' }),
    tile_oneway_w4: image('/assets/tiles/tile_oneway_w4.png', { pass: 'tile' }),
    tile_oneway_w5: image('/assets/tiles/tile_oneway_w5.png', { pass: 'tile' }),

    // World 1: Glacial Mainframe
    hill_far_w1: image('/assets/bg/hill_far_w1.png', { pass: 'object' }),
    hill_near_w1: image('/assets/bg/hill_near_w1.png', { pass: 'object' }),

    // World 2-5 backgrounds (placeholder copies until per-world assets exist)
    hill_far_w2: image('/assets/bg/hill_far_w2.png', { pass: 'object' }),
    hill_near_w2: image('/assets/bg/hill_near_w2.png', { pass: 'object' }),
    hill_far_w3: image('/assets/bg/hill_far_w3.png', { pass: 'object' }),
    hill_near_w3: image('/assets/bg/hill_near_w3.png', { pass: 'object' }),
    hill_far_w4: image('/assets/bg/hill_far_w4.png', { pass: 'object' }),
    hill_near_w4: image('/assets/bg/hill_near_w4.png', { pass: 'object' }),
    hill_far_w5: image('/assets/bg/hill_far_w5.png', { pass: 'object' }),
    hill_near_w5: image('/assets/bg/hill_near_w5.png', { pass: 'object' }),
  },
  spritesheets: {
    bart_body_small: { path: '/assets/sprites/bart_body_small.png', frameWidth: 32, frameHeight: 32 },
    bart_body_big: { path: '/assets/sprites/bart_body_big.png', frameWidth: 32, frameHeight: 48 },
    bart_body_small_fire: { path: '/assets/sprites/bart_body_small_fire.png', frameWidth: 32, frameHeight: 32 },
    bart_body_big_fire: { path: '/assets/sprites/bart_body_big_fire.png', frameWidth: 32, frameHeight: 48 },
    enemy_walker: {
      path: '/assets/sprites/enemy_walker.png',
      frameWidth: 16,
      frameHeight: 16,
    },
    enemy_shell: {
      path: '/assets/sprites/enemy_shell.png',
      frameWidth: 16,
      frameHeight: 16,
    },
    enemy_flying: {
      path: '/assets/sprites/enemy_flying.png',
      frameWidth: 16,
      frameHeight: 16,
    },
    enemy_spitter: {
      path: '/assets/sprites/enemy_spitter.png',
      frameWidth: 16,
      frameHeight: 16,
    },
    enemy_compliance: {
      path: '/assets/sprites/enemy_compliance.png',
      frameWidth: 16,
      frameHeight: 16,
    },
    enemy_techdebt: {
      path: '/assets/sprites/enemy_techdebt.png',
      frameWidth: 16,
      frameHeight: 16,
    },
    boss_sheet: {
      path: '/assets/sprites/boss_sheet.png',
      frameWidth: 64,
      frameHeight: 64,
    },
  },
  bitmapFonts: {
    hud: {
      texture: '/assets/fonts/bitmap_font.png',
      data: '/assets/fonts/bitmap_font.fnt'
    }
  }
};
