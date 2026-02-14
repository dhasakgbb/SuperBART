import argparse
import os
from PIL import Image

FRAME_WIDTH = 32
FRAME_HEIGHT_SMALL = 32
FRAME_HEIGHT_BIG = 48
GRID_COLS = 7
GRID_ROWS = 2

def pack_grid(input_dir, output_path, mode="small"):
    # Create empty canvas
    frame_h = FRAME_HEIGHT_SMALL if mode == "small" else FRAME_HEIGHT_BIG
    canvas_w = GRID_COLS * FRAME_WIDTH
    canvas_h = GRID_ROWS * frame_h
    
    canvas = Image.new("RGBA", (canvas_w, canvas_h), (0, 0, 0, 0))
    
    files = sorted([f for f in os.listdir(input_dir) if f.endswith(".png")])
    # Assumption: files are named frame_00.png, frame_01.png etc. or similar sortable names
    
    for i, filename in enumerate(files):
        if i >= GRID_COLS * GRID_ROWS:
            break
            
        col = i % GRID_COLS
        row = i // GRID_COLS
        
        path = os.path.join(input_dir, filename)
        with Image.open(path) as frame:
            # Center or align logic? Assuming exact fit for now
            canvas.paste(frame, (col * FRAME_WIDTH, row * frame_h))
            
    canvas.save(output_path)
    print(f"Packed {len(files)} frames to {output_path}")

def main():
    parser = argparse.ArgumentParser(description="Pack Grid Tool")
    parser.add_argument("--input_dir", required=True, help="Directory containing frames")
    parser.add_argument("--output", required=True, help="Output spritesheet path")
    parser.add_argument("--mode", choices=["small", "big"], default="small", help="Sprite size mode")
    
    args = parser.parse_args()
    pack_grid(args.input_dir, args.output, args.mode)

if __name__ == "__main__":
    main()
