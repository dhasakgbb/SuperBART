import argparse
from PIL import Image
import os

def analyze_image(path):
    print(f"Analyzing: {path}")
    try:
        img = Image.open(path)
        print(f"  Dimensions: {img.size}")
        
        # 1. Color Count
        # Convert to RGBA to ensure we handle alpha
        img = img.convert("RGBA")
        colors = img.getcolors(maxcolors=100000)
        
        if colors:
            unique_colors = len(colors)
            print(f"  Unique Colors: {unique_colors}")
            if unique_colors > 64:
                print("  [WARN] High color count! Likely not pixel art (or noisy).")
            else:
                print("  [PASS] Color count acceptable.")
        else:
            print("  [WARN] Too many colors to count (Pre-check failed).")
            
        # 2. Alpha Hardness
        alpha = img.split()[3]
        alpha_values = list(alpha.getdata())
        semi_transparent = [a for a in alpha_values if 0 < a < 255]
        if semi_transparent:
             print(f"  [FAIL] Found {len(semi_transparent)} semi-transparent pixels! (Dirty Alpha)")
        else:
             print("  [PASS] Alpha is binary (0 or 255).")
             
        # 3. Mode
        print(f"  Mode: {img.mode}")
        
    except Exception as e:
        print(f"  [ERROR] Could not analyze: {e}")

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("files", nargs="+")
    args = parser.parse_args()
    
    for f in args.files:
        if os.path.exists(f):
            analyze_image(f)
        else:
            print(f"File not found: {f}")

if __name__ == "__main__":
    main()
