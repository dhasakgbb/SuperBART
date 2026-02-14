from PIL import Image
import argparse
import os

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", required=True)
    parser.add_argument("--output_dir", required=True)
    parser.add_argument("--width", type=int, default=32)
    parser.add_argument("--height", type=int, default=32)
    parser.add_argument("--prefix", default="tile_")
    args = parser.parse_args()
    
    if not os.path.exists(args.output_dir):
        os.makedirs(args.output_dir)
        
    img = Image.open(args.input)
    w, h = img.size
    
    cols = w // args.width
    rows = h // args.height
    
    print(f"Slicing {w}x{h} into {cols}x{rows} tiles of {args.width}x{args.height}")
    
    for y in range(rows):
        for x in range(cols):
            box = (x * args.width, y * args.height, (x + 1) * args.width, (y + 1) * args.height)
            tile = img.crop(box)
            # Naming convention: prefix_x_y.png or index?
            # User wants specific files: tile_ground_w1_top.png
            # We'll just output generic names and rename/copy later.
            tile.save(os.path.join(args.output_dir, f"{args.prefix}{x}_{y}.png"))
            print(f"Saved {args.prefix}{x}_{y}.png")

if __name__ == "__main__":
    main()
