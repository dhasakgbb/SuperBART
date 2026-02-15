import os
from PIL import Image

BRAIN_DIR = "/Users/damian/.gemini/antigravity/brain/2eeabcbf-33cd-4979-89e0-aaa884ea00ea"
ASSETS_DIR = "/Users/damian/GitHub/NES/SuperBART/public/assets"
TILES_DIR = os.path.join(ASSETS_DIR, "tiles")
BG_DIR = os.path.join(ASSETS_DIR, "bg")

# Input files
TILESET_SRC = os.path.join(BRAIN_DIR, "silicon_forest_tileset_1771076298755.png")
BG_SRC = os.path.join(BRAIN_DIR, "silicon_forest_background_1771076316904.png")

def ensure_dir(path):
    if not os.path.exists(path):
        os.makedirs(path)

def slice_tileset():
    print(f"Slicing tileset: {TILESET_SRC}")
    img = Image.open(TILESET_SRC).convert("RGBA")
    w, h = img.size
    
    # Assuming 4x4 grid layout based on typical generation
    cols, rows = 4, 4
    cell_w = w // cols
    cell_h = h // rows
    
    # 1. Ground Top (0,0) - Grassy Circuit
    top = img.crop((0, 0, cell_w, cell_h)).resize((32, 32), Image.NEAREST)
    top.save(os.path.join(TILES_DIR, "tile_ground_w1_top.png"))
    
    # 2. Ground Mid (0,1) - Circuit Pattern
    mid = img.crop((0, cell_h, cell_w, cell_h * 2)).resize((32, 32), Image.NEAREST)
    mid.save(os.path.join(TILES_DIR, "tile_ground_w1_mid.png"))
    
    # 3. One Way Platform (2,0) - Floating Platform
    oneway = img.crop((cell_w * 2, 0, cell_w * 3, cell_h)).resize((32, 32), Image.NEAREST)
    oneway.save(os.path.join(TILES_DIR, "tile_oneway_w1.png"))
    
    print("Tiles sliced.")

def process_background():
    print(f"Processing background: {BG_SRC}")
    img = Image.open(BG_SRC).convert("RGBA")
    
    # Resize to standard background height if needed, keeping aspect ratio?
    # Or just crop/resize to logic size.
    target_w, target_h = 512, 256
    bg = img.resize((target_w, target_h), Image.BICUBIC)
    
    # Create distinct layers? For now, just one far layer.
    bg.save(os.path.join(BG_DIR, "hill_far_w1.png"))
    
    # Create a "near" layer that is just transparent for now, or maybe the bottom of the image
    near = Image.new("RGBA", (512, 256), (0, 0, 0, 0))
    near.save(os.path.join(BG_DIR, "hill_near_w1.png"))
    
    print("Background processed.")

if __name__ == "__main__":
    ensure_dir(TILES_DIR)
    ensure_dir(BG_DIR)
    slice_tileset()
    process_background()
