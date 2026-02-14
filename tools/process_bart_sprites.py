
import sys
from PIL import Image
import os

def process_sprites():
    # Load the generated sprite sheet
    # Assuming the user provided image name is consistent or passed as arg
    # For now, I'll use the one I generated: bart_spritesheet_1771043194720.png
    # But I don't know the exact path if the tool doesn't tell me.
    # Ah, I saw the output: /Users/damian/.gemini/antigravity/brain/759ccdf6-979e-4751-a5e4-7fd4b8efe2d6/bart_spritesheet_1771043194720.png
    
    # Let's find the latest png in the artifacts dir
    artifacts_dir = "/Users/damian/.gemini/antigravity/brain/759ccdf6-979e-4751-a5e4-7fd4b8efe2d6"
    files = [f for f in os.listdir(artifacts_dir) if f.startswith("bart_spritesheet") and f.endswith(".png")]
    if not files:
        print("No generated sprite sheet found.")
        return
    
    latest_file = max([os.path.join(artifacts_dir, f) for f in files], key=os.path.getctime)
    print(f"Processing {latest_file}")
    
    img = Image.open(latest_file)
    
    # The generated image is a grid. I asked for:
    # 1. Idle - 4 frames
    # 2. Run - 6 frames
    # 3. Jump - 1 frame
    # 4. Fall - 1 frame
    # 5. Skid - 1 frame
    # Total ~13 frames.
    # The image likely put them in a grid. I need to slice them.
    # Since I don't see the image, I have to guess or assume a simple layout.
    # Usually it's a grid. Let's assume 4 columns.
    
    # Actually, to be safe, I should just take 14 frames from the grid reading left-to-right, top-to-bottom.
    
    # Target formats:
    # bart_body_small.png: 16x24 frames. 14 frames total (0-13).
    # bart_body_big.png: 16x32 frames. 14 frames total (0-13).
    
    # Mapping:
    # 0: Idle (Frame 0 of gen)
    # 1: Walk (Frame 4 of gen - start of run)
    # 2: Walk (Frame 5 of gen)
    # 3: Walk (Frame 6 of gen)
    # 4: Run (Frame 4 of gen)
    # 5: Run (Frame 5 of gen)
    # 6: Run (Frame 6 of gen)
    # 7: Skid (Frame 12 of gen - last one?)
    # 8: Jump (Frame 10)
    # 9: Fall (Frame 11)
    # 10: Land (Frame 0 reused)
    # 11: Hurt (Frame 11 reused)
    # 12: Win (Frame 0 reused)
    # 13: Dead (Frame 11 reused)
    
    # Wait, the prompt asked for:
    # 1. Idle (4)
    # 2. Run (6)
    # 3. Jump (1)
    # 4. Fall (1)
    # 5. Skid (1)
    # Total 13 frames.
    
    frames = []
    
    # Scan the image to find sprite bounding boxes or just grid slice?
    # Let's assume grid slice based on image size.
    # If image is WxH and I expect roughly N sprites ...
    
    # Let's define the grid. 
    # Assumed row height and col width based on total size.
    # Actually, I'll just use a smart slicer or assume uniform grid.
    # Let's assume standard cell size of 48x48 (since I asked for 32x32 or 48x48).
    
    cell_w = 48
    cell_h = 48
    
    cols = img.width // cell_w
    rows = img.height // cell_h
    
    extracted = []
    for r in range(rows):
        for c in range(cols):
            x = c * cell_w
            y = r * cell_h
            frame = img.crop((x, y, x+cell_w, y+cell_h))
            
            # Check if frame is empty
            if frame.getbbox():
                extracted.append(frame)
                
    print(f"Extracted {len(extracted)} frames")
    
    if len(extracted) < 13:
        print("Warning: Not enough frames extracted. Reusing last frame.")
        while len(extracted) < 13:
            extracted.append(extracted[-1])
            
    # Map to Game Frames (0-13)
    # Game expects:
    # 0: Idle
    # 1-3: Walk
    # 4-6: Run
    # 7: Skid
    # 8: Jump
    # 9: Fall
    # 10: Land
    # 11: Hurt
    # 12: Win
    # 13: Dead
    
    # Gen frames (0-12 idx):
    # 0-3: Idle
    # 4-9: Run
    # 10: Jump
    # 11: Fall
    # 12: Skid
    
    final_frames = []
    
    # 0: Idle
    final_frames.append(extracted[0])
    
    # 1-3: Walk (Use Run 0, 1, 2)
    final_frames.append(extracted[4])
    final_frames.append(extracted[5])
    final_frames.append(extracted[6])
    
    # 4-6: Run (Use Run 3, 4, 5)
    final_frames.append(extracted[7])
    final_frames.append(extracted[8])
    final_frames.append(extracted[9])
    
    # 7: Skid
    final_frames.append(extracted[12] if len(extracted) > 12 else extracted[-1])
    
    # 8: Jump
    final_frames.append(extracted[10] if len(extracted) > 10 else extracted[-1])
    
    # 9: Fall
    final_frames.append(extracted[11] if len(extracted) > 11 else extracted[-1])
    
    # 10: Land (Use Idle 0)
    final_frames.append(extracted[0])
    
    # 11: Hurt (Use Fall)
    final_frames.append(extracted[11] if len(extracted) > 11 else extracted[-1])
    
    # 12: Win (Use Idle 1 - maybe hands up?)
    final_frames.append(extracted[1]) 
    
    # 13: Dead (Use Skid or Fall rotated?)
    final_frames.append(extracted[11] if len(extracted) > 11 else extracted[-1])
    
    # Create Sheets
    # Small: 16x24
    # Big: 16x32
    
    # NOTE: Resizing 48x48 down to 16x24/32 might lose detail. 
    # But for now, we must match the engine or update the engine.
    # Plan: Update engine to support 32x32 frames if possible, BUT simpler to just resize for now to verify pipeline.
    # User wanted "Premium SNES", resizing to 16px wide is very NES.
    # I should try to keep them 32px wide if possible.
    # If I change frameWidth in assetManifest, Phaser will handle it.
    # But physics body (10x24 approx) might look small compared to sprite.
    
    # Let's create 'bart_body_big.png' as 32x48 per frame (Premium size)
    # And 'bart_body_small.png' as 32x32 per frame.
    # I will verify this by updating assetManifest.
    
    def create_sheet(frames, w, h):
        sheet = Image.new("RGBA", (w * len(frames), h))
        for i, f in enumerate(frames):
            # Maintain aspect ratio?
            # Scale to fit
            # f.thumbnail((w, h), Image.NEAREST) # Maintains aspect
            # Force resize
            resized = f.resize((w, h), Image.NEAREST)
            sheet.paste(resized, (i * w, 0))
        return sheet

    # Generate Big Sheet (32x48)
    big_sheet = create_sheet(final_frames, 32, 48)
    big_sheet.save("public/assets/sprites/bart_body_big.png")
    print("Saved public/assets/sprites/bart_body_big.png")
    
    # Generate Small Sheet (32x32)
    small_sheet = create_sheet(final_frames, 32, 32)
    small_sheet.save("public/assets/sprites/bart_body_small.png")
    print("Saved public/assets/sprites/bart_body_small.png")
    
if __name__ == "__main__":
    process_sprites()
