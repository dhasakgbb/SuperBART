type AssetFrameTiming = {
  fps: number;
  frameCount?: number;
};

type AssetAnchor = {
  x: number;
  y: number;
};

type ArtPass = 'enemy' | 'hazard' | 'object' | 'hud' | 'system';

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
    enemy_walker: image('/assets/sprites/enemy_walker.png', {
      pass: 'enemy',
      palette: ['inkDark', 'groundShadow', 'groundMid', 'groundWarm'],
      frameTiming: { fps: 8, frameCount: 4 },
      anchorPx: { x: 8, y: 16 },
    }),
    enemy_shell: image('/assets/sprites/enemy_shell.png', {
      pass: 'enemy',
      palette: ['inkDark', 'groundShadow', 'groundMid', 'groundWarm'],
      frameTiming: { fps: 8, frameCount: 3 },
      anchorPx: { x: 8, y: 16 },
    }),
    enemy_shell_retracted: image('/assets/sprites/enemy_shell_retracted.png', {
      pass: 'enemy',
      palette: ['inkDark', 'groundShadow', 'groundMid', 'groundWarm'],
      frameTiming: { fps: 10, frameCount: 1 },
      anchorPx: { x: 8, y: 16 },
    }),
    enemy_flying: image('/assets/sprites/enemy_flying.png', {
      pass: 'enemy',
      palette: ['inkDark', 'groundMid', 'groundWarm', 'skyMid'],
      frameTiming: { fps: 8, frameCount: 2 },
      anchorPx: { x: 8, y: 16 },
    }),
    enemy_spitter: image('/assets/sprites/enemy_spitter.png', {
      pass: 'enemy',
      palette: ['inkDark', 'groundMid', 'groundWarm', 'coinCore'],
      frameTiming: { fps: 8, frameCount: 2 },
      anchorPx: { x: 8, y: 16 },
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
  },
  spritesheets: {
    bart_body_small: {
      path: '/assets/sprites/bart_body_small.png',
      frameWidth: 16,
      frameHeight: 24,
    },
    bart_body_big: {
      path: '/assets/sprites/bart_body_big.png',
      frameWidth: 16,
      frameHeight: 32,
    },
  },
  bitmapFonts: {
    hud: {
      texture: '/assets/fonts/bitmap_font.png',
      data: '/assets/fonts/bitmap_font.fnt'
    }
  }
};
