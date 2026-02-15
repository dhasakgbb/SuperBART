import os
from PIL import Image

BRAIN_DIR = "/Users/damian/.gemini/antigravity/brain/2eeabcbf-33cd-4979-89e0-aaa884ea00ea"
ASSETS_DIR = "/Users/damian/GitHub/NES/SuperBART/public/assets"
SPRITES_DIR = os.path.join(ASSETS_DIR, "sprites")

# Input files
VEG_SRC = os.path.join(BRAIN_DIR, "silicon_forest_vegetation_1771076405302.png")
ENEMIES_SRC = os.path.join(BRAIN_DIR, "silicon_forest_enemies_1771076422114.png")

def ensure_dir(path):
    if not os.path.exists(path):
        os.makedirs(path)

def slice_vegetation():
    print(f"Slicing vegetation: {VEG_SRC}")
    img = Image.open(VEG_SRC).convert("RGBA")
    w, h = img.size
    
    # Grid appears to be 4 columns x 3 rows based on visual
    # Row 1: Vines
    # Row 2: Ferns
    # Row 3: Flowers
    # Bottom: Tiles?
    
    # Let's crop specific items.
    
    # Vines (Top Left)
    vine = img.crop((0, 0, w//4, h//4)).resize((32, 32), Image.NEAREST)
    vine.save(os.path.join(SPRITES_DIR, "decoration_vine_w1.png"))
    
    # Fern (Row 2, Col 3 - Orange/Green?)
    fern = img.crop((w//2, h//4, 3*w//4, h//2)).resize((32, 32), Image.NEAREST)
    fern.save(os.path.join(SPRITES_DIR, "decoration_fern_w1.png"))
    
    # Flower (Row 3, Col 1)
    flower = img.crop((0, h//2, w//4, 3*h//4)).resize((32, 32), Image.NEAREST)
    flower.save(os.path.join(SPRITES_DIR, "decoration_flower_w1.png"))
    
    print("Vegetation sliced.")

def slice_enemies():
    print(f"Slicing enemies: {ENEMIES_SRC}")
    img = Image.open(ENEMIES_SRC).convert("RGBA")
    w, h = img.size
    
    # 3 Panels: Bug (Top Left), Snake (Top Right), Spike (Bottom Center)
    # The generation usually puts them in frames.
    
    half_w = w // 2
    half_h = h // 2
    
    # 1. Bug (Top Left)
    # The actual sprite is inside the frame. Center crop.
    bug_panel = img.crop((0, 0, half_w, half_h))
    # Heuristic: Crop the center 50% of the panel and resize to 32x32
    bug_w, bug_h = bug_panel.size
    margin = bug_w // 4
    bug = bug_panel.crop((margin, margin, bug_w - margin, bug_h - margin)).resize((32, 32), Image.NEAREST)
    bug.save(os.path.join(SPRITES_DIR, "enemy_bug_w1.png"))
    
    # 2. Snake (Top Right)
    snake_panel = img.crop((half_w, 0, w, half_h))
    snake = snake_panel.crop((margin, margin, bug_w - margin, bug_h - margin)).resize((32, 32), Image.NEAREST)
    snake.save(os.path.join(SPRITES_DIR, "enemy_snake_w1.png"))
    
    # 3. Spike (Bottom Center-ish)
    spike_panel = img.crop((w//4, half_h, 3*w//4, h))
    spike = spike_panel.crop((margin, margin, bug_w - margin, bug_h - margin)).resize((32, 32), Image.NEAREST)
    spike.save(os.path.join(SPRITES_DIR, "trap_spike_w1.png"))
    
    print("Enemies sliced.")

if __name__ == "__main__":
    ensure_dir(SPRITES_DIR)
    slice_vegetation()
    slice_enemies()
