from PIL import Image
import numpy as np
import sys

def visualize_structure(path, scale=0.05):
    try:
        img = Image.open(path).convert('RGBA')
        w, h = img.size
        
        # Resize to manageable text grid
        # aim for ~80 chars wide
        target_w = 100
        ratio = target_w / w
        target_h = int(h * ratio)
        
        small = img.resize((target_w, target_h), Image.BILINEAR)
        arr = np.array(small)
        
        # Determine background from (0,0)
        bg = arr[0,0]
        diff = np.sum(np.abs(arr - bg), axis=2)
        mask = diff > 20
        
        print(f"Structure Map ({w}x{h} -> {target_w}x{target_h}):")
        print("-" * target_w)
        
        for y in range(target_h):
            line = ""
            for x in range(target_w):
                if mask[y, x]:
                    line += "#"
                else:
                    line += " "
            print(line)
            
        print("-" * target_w)

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    visualize_structure(sys.argv[1])
