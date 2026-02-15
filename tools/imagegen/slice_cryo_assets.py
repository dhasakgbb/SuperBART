import os
from PIL import Image, ImageDraw

BRAIN_DIR = "/Users/damian/.gemini/antigravity/brain/2eeabcbf-33cd-4979-89e0-aaa884ea00ea"
ASSETS_DIR = "/Users/damian/GitHub/NES/SuperBART/public/assets"
TILES_DIR = os.path.join(ASSETS_DIR, "tiles")
SPRITES_DIR = os.path.join(ASSETS_DIR, "sprites")
BG_DIR = os.path.join(ASSETS_DIR, "bg")

# Input files
TILESET_SRC = os.path.join(BRAIN_DIR, "cryo_server_tileset_1771075834203.png")
ENEMIES_SRC = os.path.join(BRAIN_DIR, "cryo_enemies_retry_1771075861445.png")

def ensure_dir(path):
    if not os.path.exists(path):
        os.makedirs(path)

def slice_tileset():
    print(f"Slicing tileset: {TILESET_SRC}")
    img = Image.open(TILESET_SRC).convert("RGBA")
    
    # Grid analysis: The image looks like a 4x4 grid of roughly 32x32 tiles (or larger)
    # Let's assume standard cell size based on image width.
    w, h = img.size
    cols, rows = 4, 4
    cell_w = w // cols
    cell_h = h // rows
    
    print(f"Image size: {w}x{h}, Cell size: {cell_w}x{cell_h}")

    # Mapping based on visual inspection of the grid (Top-Left is 0,0)
    # (0,0): Snow Ground Top
    # (0,1): Server Rack Wall
    # (2,0): Snow Spike (Hazard)
    # (3,1): Glass Platform (OneWay)
    
    # 1. Tile Ground Top (Snow + Ice) -> w2_top
    top_tile = img.crop((0, 0, cell_w, cell_h)).resize((32, 32), Image.NEAREST)
    top_tile.save(os.path.join(TILES_DIR, "tile_ground_w2_top.png"))
    
    # 2. Tile Ground Mid (Ice Block) -> w2_mid
    # Let's use (1, 0)
    mid_tile = img.crop((cell_w, 0, cell_w * 2, cell_h)).resize((32, 32), Image.NEAREST)
    mid_tile.save(os.path.join(TILES_DIR, "tile_ground_w2_mid.png"))

    # 3. Tile OneWay (Glass Platform) -> w2_oneway
    # (3, 1) looks like a platform
    oneway_tile = img.crop((cell_w * 3, cell_h, cell_w * 4, cell_h * 2)).resize((32, 32), Image.NEAREST)
    oneway_tile.save(os.path.join(TILES_DIR, "tile_oneway_w2.png"))
    
    print("Tiles sliced and saved.")

def slice_enemies():
    print(f"Slicing enemies: {ENEMIES_SRC}")
    img = Image.open(ENEMIES_SRC).convert("RGBA")
    w, h = img.size
    
    # The generated image has labels, so we need to crop carefully.
    # It shows 3 horizontal items.
    item_w = w // 3
    
    # Snowman (Left)
    snowman = img.crop((0, 0, item_w, item_w)).resize((32, 32), Image.NEAREST)
    snowman.save(os.path.join(SPRITES_DIR, "enemy_cryo_sentry.png"))
    
    # Drone (Middle)
    drone = img.crop((item_w, 0, item_w * 2, item_w)).resize((32, 32), Image.NEAREST)
    drone.save(os.path.join(SPRITES_DIR, "enemy_cryo_drone.png"))
    
    # Firewall (Right)
    firewall = img.crop((item_w * 2, 0, w, item_w)).resize((32, 32), Image.NEAREST)
    firewall.save(os.path.join(SPRITES_DIR, "enemy_firewall_ice.png"))
    
    print("Enemies sliced and saved.")

def create_background():
    print("Generating fallback background...")
    # Gradient: Deep Blue to Cyan
    w, h = 512, 256
    img = Image.new("RGBA", (w, h))
    draw = ImageDraw.Draw(img)
    
    for y in range(h):
        r = 10 + int(y * 0.1)
        g = 20 + int(y * 0.3)
        b = 60 + int(y * 0.5)
        draw.line([(0, y), (w, y)], fill=(r, g, b, 255))
        
    # Add some "Server Towers" (Dark Rectangles)
    for i in range(5):
        x = i * 100 + 20
        bw = 40
        bh = 100 + (i * 20) % 80
        by = h - bh
        draw.rectangle([(x, by), (x + bw, h)], fill=(10, 10, 40, 255), outline=(50, 100, 200, 255))
        
        # Windows
        for wy in range(by + 10, h - 10, 20):
             draw.rectangle([(x + 5, wy), (x + 35, wy + 5)], fill=(0, 255, 255, 100))

    img.save(os.path.join(BG_DIR, "hill_far_w2.png"))
    
    # Near layer (Foreground spikes)
    near_img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d2 = ImageDraw.Draw(near_img)
    for i in range(10):
        x = i * 60
        h_spike = 40 + (i * 15) % 40
        y = h - h_spike
        d2.polygon([(x, h), (x + 30, y), (x + 60, h)], fill=(100, 200, 255, 128))
        
    near_img.save(os.path.join(BG_DIR, "hill_near_w2.png"))
    print("Backgrounds generated.")

if __name__ == "__main__":
    ensure_dir(TILES_DIR)
    ensure_dir(SPRITES_DIR)
    ensure_dir(BG_DIR)
    slice_tileset()
    slice_enemies()
    create_background()
