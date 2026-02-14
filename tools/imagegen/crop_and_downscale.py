import argparse
import os
from PIL import Image

def quantize_image(image, palette_image):
    # Apply palette from palette_image to image
    # For now, strict quantization logic or simple converting to palette mode
    if palette_image:
        return image.quantize(palette=palette_image, dither=Image.NONE)
    return image.quantize(colors=256, method=2, dither=Image.NONE)

def process_image(input_path, output_path, scale_factor, palette_path=None):
    try:
        with Image.open(input_path) as img:
            # Crop logic could be added here if needed, currently assumes source is ready
            
            # Downscale
            if scale_factor > 1:
                new_size = (img.width // scale_factor, img.height // scale_factor)
                img = img.resize(new_size, resample=Image.NEAREST)
            
            # Quantize
            if palette_path:
                with Image.open(palette_path) as p_img:
                    img = quantize_image(img, p_img)
            
            img.save(output_path)
            print(f"Processed: {input_path} -> {output_path}")
            
    except Exception as e:
        print(f"Error processing {input_path}: {e}")

def main():
    parser = argparse.ArgumentParser(description="Crop and Downscale Tool")
    parser.add_argument("--input", required=True, help="Input image path")
    parser.add_argument("--output", required=True, help="Output image path")
    parser.add_argument("--scale", type=int, default=1, help="Downscale factor (integer)")
    parser.add_argument("--palette", help="Reference palette image path (optional)")
    
    args = parser.parse_args()
    
    process_image(args.input, args.output, args.scale, args.palette)

if __name__ == "__main__":
    main()
