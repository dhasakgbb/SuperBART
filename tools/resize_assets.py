
import os
from PIL import Image

ASSETS = [
    # Sprites
    {'path': 'public/assets/sprites/bart_body_small.png', 'size': (224, 24)},
    {'path': 'public/assets/sprites/bart_body_big.png', 'size': (224, 32)},
    {'path': 'public/assets/sprites/enemy_walker.png', 'size': (64, 16)},
    {'path': 'public/assets/sprites/enemy_shell.png', 'size': (48, 16)},
    {'path': 'public/assets/sprites/enemy_flying.png', 'size': (32, 16)},
    {'path': 'public/assets/sprites/enemy_spitter.png', 'size': (32, 16)},
    
    # Tiles
    {'path': 'public/assets/tiles/tileset.png', 'size': (16, 112)},
    {'path': 'public/assets/tiles/tile_ground.png', 'size': (16, 16)},
    {'path': 'public/assets/tiles/tile_oneway.png', 'size': (16, 16)},
    {'path': 'public/assets/tiles/tile_brick.png', 'size': (16, 16)},
    {'path': 'public/assets/sprites/question_block.png', 'size': (16, 16)},
]

def resize_assets():
    for item in ASSETS:
        path = item['path']
        target_w, target_h = item['size']
        
        if not os.path.exists(path):
            print(f"Skipping missing: {path}")
            continue
            
        try:
            img = Image.open(path)
            print(f"Resizing {path}: {img.size} -> ({target_w}, {target_h})")
            
            # Use Nearest Neighbor to preserve pixel art
            resized = img.resize((target_w, target_h), Image.NEAREST)
            resized.save(path)
            print(f"Saved {path}")
            
        except Exception as e:
            print(f"Error resizing {path}: {e}")

if __name__ == '__main__':
    resize_assets()
