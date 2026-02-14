from PIL import Image
import sys
import os

def split_strip(path, out_dir, count=6):
    try:
        img = Image.open(path)
        w, h = img.size
        frame_w = w // count
        
        if not os.path.exists(out_dir):
            os.makedirs(out_dir)
            
        print(f"Splitting {w}x{h} into {count} frames of width {frame_w}")
        
        for i in range(count):
            x = i * frame_w
            frame = img.crop((x, 0, x + frame_w, h))
            
            # Save as frame_run_00.png etc
            out_path = os.path.join(out_dir, f"run_{i:02d}.png")
            frame.save(out_path)
            print(f"Saved {out_path}")

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    split_strip(sys.argv[1], sys.argv[2], int(sys.argv[3]))
