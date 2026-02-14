from PIL import Image, ImageDraw
import sys

def extract_sample(path, out_path):
    try:
        img = Image.open(path).convert('RGBA')
        w, h = img.size
        pixels = img.load()
        
        # 1. Find the first non-transparent pixel (or non-background)
        # Assuming top-left is background
        bg = pixels[0, 0]
        
        start_x, start_y = -1, -1
        
        # Scan with a skip to be faster? No, need precision.
        found = False
        for y in range(h):
            for x in range(w):
                p = pixels[x, y]
                # Check diff
                diff = sum([abs(c1 - c2) for c1, c2 in zip(p, bg)])
                if diff > 30: # Tolerance
                    start_x, start_y = x, y
                    found = True
                    break
            if found: break
            
        if not found:
            print("No content found.")
            return
            
        print(f"Content starts at ({start_x}, {start_y})")
        
        # 2. Naive bounding box expansion from this point?
        # Let's just crop a 256x256 chunk around it and print the bbox of that chunk relative to the start.
        
        crop_w, crop_h = 1024, 1024
        if start_x + crop_w > w: crop_w = w - start_x
        if start_y + crop_h > h: crop_h = h - start_y
        
        crop = img.crop((start_x, start_y, start_x + crop_w, start_y + crop_h))
        
        # Determine bbox of the opaque pixels on this crop
        # We need to treat 'bg' as transparent
        dataset = []
        for cy in range(crop_h):
            for cx in range(crop_w):
                p = crop.getpixel((cx, cy))
                diff = sum([abs(c1 - c2) for c1, c2 in zip(p, bg)])
                if diff > 30:
                    dataset.append((cx, cy))
        
        if not dataset:
            print("Crop is empty?")
            return
            
        min_x = min(d[0] for d in dataset)
        max_x = max(d[0] for d in dataset)
        min_y = min(d[1] for d in dataset)
        max_y = max(d[1] for d in dataset)
        
        sprite_w = max_x - min_x + 1
        sprite_h = max_y - min_y + 1
        
        print(f"Estimated Sprite Size: {sprite_w}x{sprite_h}")
        
        # Save the crop
        final_sprite = crop.crop((min_x, min_y, max_x + 1, max_y + 1))
        final_sprite.save(out_path)
        print(f"Saved sample to {out_path}")

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    extract_sample(sys.argv[1], sys.argv[2])
