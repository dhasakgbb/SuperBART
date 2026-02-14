import argparse
import os
from PIL import Image

FRAME_WIDTH = 32
FRAME_HEIGHT_SMALL = 32
FRAME_HEIGHT_BIG = 48
GRID_COLS = 7
GRID_ROWS = 2

def pack_grid(input_dir, output_path):
    files = sorted([f for f in os.listdir(input_dir) if f.endswith(".png")])
    print(f"Packing order: {files[:5]}...")
    if not files:
        print(f"No PNG files found in {input_dir}")
        return

    # Auto-detect size from first frame
    first_path = os.path.join(input_dir, files[0])
    with Image.open(first_path) as img:
        frame_w, frame_h = img.size
    
    canvas_w = GRID_COLS * frame_w
    canvas_h = GRID_ROWS * frame_h
    
    canvas = Image.new("RGBA", (canvas_w, canvas_h), (0, 0, 0, 0))
    
    for i, filename in enumerate(files):
        if i >= GRID_COLS * GRID_ROWS:
            break
            
        col = i % GRID_COLS
        row = i // GRID_COLS
        
        path = os.path.join(input_dir, filename)
        with Image.open(path) as frame:
            # Resize if strict packing needed, but typically we assume consistent inputs
            if frame.size != (frame_w, frame_h):
                 frame = frame.resize((frame_w, frame_h), Image.NEAREST)
            canvas.paste(frame, (col * frame_w, row * frame_h))
            
    canvas.save(output_path)
    print(f"Packed {len(files)} frames to {output_path} ({frame_w}x{frame_h} per frame)")

def main():
    parser = argparse.ArgumentParser(description="Pack Grid Tool")
    parser.add_argument("--input_dir", required=True, help="Directory containing frames")
    parser.add_argument("--output", required=True, help="Output spritesheet path")
    parser.add_argument("--mode", choices=["small", "big"], default="small", help="Sprite size mode")
    
    args = parser.parse_args()
    pack_grid(args.input_dir, args.output)

if __name__ == "__main__":
    main()
