import argparse
import os
from PIL import Image

FRAME_WIDTH = 16
FRAME_HEIGHT = 16
STRIP_LEN = 4

def pack_strip(input_dir, output_path):
    canvas_w = STRIP_LEN * FRAME_WIDTH
    canvas_h = FRAME_HEIGHT
    
    canvas = Image.new("RGBA", (canvas_w, canvas_h), (0, 0, 0, 0))
    
    files = sorted([f for f in os.listdir(input_dir) if f.endswith(".png")])
    
    for i, filename in enumerate(files):
        if i >= STRIP_LEN:
            break
        
        path = os.path.join(input_dir, filename)
        with Image.open(path) as frame:
            canvas.paste(frame, (i * FRAME_WIDTH, 0))
            
    canvas.save(output_path)
    print(f"Packed {len(files)} frames to strip {output_path}")

def main():
    parser = argparse.ArgumentParser(description="Pack Strip Tool")
    parser.add_argument("--input_dir", required=True, help="Directory containing frames")
    parser.add_argument("--output", required=True, help="Output strip path")
    
    args = parser.parse_args()
    pack_strip(args.input_dir, args.output)

if __name__ == "__main__":
    main()
