import { ASSET_MANIFEST as CORE_ASSET_MANIFEST } from '../core/assetManifest';

export const ASSET_MANIFEST = {
  ...CORE_ASSET_MANIFEST,
  images: {
    ...CORE_ASSET_MANIFEST.images,
    // Legacy compatibility aliases for non-production tooling/tests.
    terrain: 'assets/tiles/tile_ground.png',
    player: 'assets/sprites/bart_body_small.png',
    enemy: 'assets/sprites/enemy_walker.png',
    coin: 'assets/sprites/pickup_token.png',
    flag: 'assets/sprites/flag.png',
  },
  tilemaps: {
    level1: 'assets/maps/level1.json',
  },
};
