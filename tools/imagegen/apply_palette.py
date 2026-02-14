import argparse
import json
import numpy as np
from PIL import Image

def hex_to_rgb(hex_color):
    hex_color = hex_color.lstrip('#')
    return tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))

def apply_palette(input_path, palette_path, category='player'):
    # Load Palette
    with open(palette_path, 'r') as f:
        data = json.load(f)
    
    hex_colors = data['global'][category]
    palette_colors = [hex_to_rgb(c) for c in hex_colors]
    
    # Open Image
    img = Image.open(input_path).convert('RGBA')
    arr = np.array(img)
    
    # Process
    height, width, _ = arr.shape
    
    # Create a simple color map
    # For a small palette, we can just iterate or use broadcasting
    # But let's use a KDTree or simple distance for speed/simplicity
    # Actually, for < 20 colors, simple distance is fine.
    
    # Flatten array for processing
    pixels = arr.reshape(-1, 4)
    
    new_pixels = []
    
    palette_arr = np.array(palette_colors)
    
    for p in pixels:
        r, g, b, a = p
        if a < 128:
            new_pixels.append((0, 0, 0, 0))
            continue
            
        # Find nearest
        current_color = np.array([r, g, b])
        distances = np.sqrt(np.sum((palette_arr - current_color)**2, axis=1))
        nearest_idx = np.argmin(distances)
        nearest = palette_colors[nearest_idx]
        new_pixels.append((*nearest, 255))
        
    new_arr = np.array(new_pixels, dtype=np.uint8).reshape(height, width, 4)
    new_img = Image.fromarray(new_arr)
    new_img.save(input_path)
    print(f"Quantized {input_path} to {len(palette_colors)} colors.")

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", required=True)
    parser.add_argument("--palette_json", required=True)
    args = parser.parse_args()
    apply_palette(args.input, args.palette_json)
