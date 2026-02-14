import argparse
from PIL import Image
import numpy as np

def check_tileable(input_path, band_size=1):
    try:
        with Image.open(input_path) as img:
            width, height = img.size
            
            # Convert to numpy array
            arr = np.array(img)
            
            # Check left vs right edge
            left_edge = arr[:, 0:1]
            right_edge = arr[:, width-1:width]
            
            # For perfect tileability, left edge should visually match right edge (or wrap)
            # Standard game tiling usually means left edge matches right edge of *adjacent* tile
            # But if it's a single texture, top matches bottom, left matches right?
            # Prompt says: "Strict left/right edge equality check"
            
            # Actually, in most tiling, pixel (0,y) should neighbor pixel (width-1, y) seamlessly.
            # This usually means they shouldn't necessarily be identical, but visually continuous.
            # However, for a "check equality" tool, it implies they might be duplicating the edge 
            # or checking if the cut is seamless.
            # Let's simple check if left column and right column are identical? 
            # A seamless tile usually does NOT have identical edges, but rather compatible edges.
            # BUT if the user asked for "Strict left/right edge equality check", I will implement that.
            # Wait, if left == right, then you have a 1px repeat when tiling. 
            # Maybe they mean "Seamless check"? 
            # Let's interpret "Strict left/right edge equality" literal for now as a first pass tool.
            
            if np.array_equal(left_edge, right_edge):
                print(f"[PASS] {input_path} edges match.")
            else:
                 # Check difference
                diff = np.abs(left_edge.astype(int) - right_edge.astype(int))
                mean_diff = np.mean(diff)
                if mean_diff < 5:
                    print(f"[WARN] {input_path} edges are close (diff {mean_diff:.2f}), but not identical.")
                else:
                    print(f"[FAIL] {input_path} edges do not match (diff {mean_diff:.2f}).")
                    
    except Exception as e:
        print(f"Error checking {input_path}: {e}")

def main():
    parser = argparse.ArgumentParser(description="Check Tileable Tool")
    parser.add_argument("--input", required=True, help="Input image path")
    parser.add_argument("--band", type=int, default=1, help="Band size to check")
    
    args = parser.parse_args()
    check_tileable(args.input, args.band)

if __name__ == "__main__":
    main()
