from PIL import Image
import sys

def detect_sprites(path):
    try:
        img = Image.open(path).convert('RGBA')
        w, h = img.size
        print(f"Image: {w}x{h}")
        
        # simple blob detection by projecting to X and Y? 
        # or just scanning for alpha > 0
        
        # Let's find the bbox of the *entire* content first
        bbox = img.getbbox()
        if not bbox:
            print("Image is empty.")
            return

        print(f"Content Bounds: {bbox}")
        
        # Heuristic: Segment by finding empty columns/rows separating content
        # detailed implementation omitted for brevity, just getting total content area usually hints at structure
        # If it's a grid, we usually see repeated structures.
        
        # Let's assume it might be a single large frame if it's 1888x2240, or a few large ones.
        # Let's count how many distinct islands we can find with a flood fill logic is expensive in pure python without cv2.
        # We'll approximate by checking center lines.
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    detect_sprites(sys.argv[1])
