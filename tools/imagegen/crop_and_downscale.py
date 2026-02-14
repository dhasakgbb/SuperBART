import argparse
import os
from PIL import Image

def quantize_image(image, palette_image):
    # Apply palette from palette_image to image
    # For now, strict quantization logic or simple converting to palette mode
    if palette_image:
        return image.quantize(palette=palette_image, dither=Image.NONE)
    return image.quantize(colors=256, method=2, dither=Image.NONE)

def apply_transparency(img):
    img = img.convert("RGBA")
    # Flood-fill transparency from corners
    seeds = [(0, 0), (img.width-1, 0), (0, img.height-1), (img.width-1, img.height-1)]
    pixels = img.load()
    width, height = img.size
    visited = set()
    queue = []
    threshold_sq = 1500

    for seed in seeds:
        if 0 <= seed[0] < width and 0 <= seed[1] < height:
            queue.append(seed)
            visited.add(seed)
    
    src_pixels = img.copy().load()
    
    while queue:
        x, y = queue.pop(0)
        pixels[x, y] = (0, 0, 0, 0)
        pr, pg, pb, _ = src_pixels[x, y]
        
        for dx, dy in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
            nx, ny = x + dx, y + dy
            if 0 <= nx < width and 0 <= ny < height and (nx, ny) not in visited:
                r, g, b, a = src_pixels[nx, ny]
                dist = (r - pr)**2 + (g - pg)**2 + (b - pb)**2
                if dist < threshold_sq:
                    visited.add((nx, ny))
                    queue.append((nx, ny))
    return img

def process_image(input_path, output_path, scale_factor, palette_path=None, width=None, height=None):
    try:
        with Image.open(input_path) as img:
            img = apply_transparency(img)
            
            if width and height:
                img = img.resize((width, height), Image.LANCZOS)
            elif scale_factor > 1:
                new_size = (img.width // scale_factor, img.height // scale_factor)
                img = img.resize(new_size, resample=Image.NEAREST)
            
            if palette_path:
                 with Image.open(palette_path) as p_img:
                    img = quantize_image(img, p_img)
                    
            img.save(output_path)
            print(f"Processed: {input_path} -> {output_path}")
            
    except Exception as e:
        print(f"Error processing {input_path}: {e}")

def main():
    parser = argparse.ArgumentParser(description="Crop and Downscale Tool")
    parser.add_argument("--input", required=True, help="Input image path or directory")
    parser.add_argument("--output", required=True, help="Output image path or directory")
    parser.add_argument("--scale", type=int, default=1, help="Downscale factor (integer)")
    parser.add_argument("--palette", help="Reference palette image path (optional)")
    parser.add_argument("--width", type=int, help="Target width (overrides scale)")
    parser.add_argument("--height", type=int, help="Target height (overrides scale)")
    
    args = parser.parse_args()
    
    if os.path.isdir(args.input):
        if not os.path.exists(args.output):
            os.makedirs(args.output)
            
        files = [f for f in os.listdir(args.input) if f.lower().endswith(('.png', '.jpg', '.jpeg'))]
        for f in files:
            in_p = os.path.join(args.input, f)
            out_p = os.path.join(args.output, f)
            # Use the shared function
            process_image(in_p, out_p, args.scale, args.palette, args.width, args.height)
    else:
        # Single file mode
        process_image(args.input, args.output, args.scale, args.palette, args.width, args.height)

if __name__ == "__main__":
    main()
