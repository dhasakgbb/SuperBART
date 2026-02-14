from PIL import Image
import numpy as np
import sys

def discover_grid(path):
    try:
        img = Image.open(path).convert('RGBA')
        w, h = img.size
        print(f"Image: {w}x{h}")

        arr = np.array(img)
        
        # Check (0,0) color
        bg_color = arr[0, 0]
        print(f"Background Color at (0,0): {bg_color}")
        
        # Create mask: True where pixel != bg_color
        # (Compare all channels)
        diff = np.abs(arr - bg_color)
        # Sum differences across channels. If sum > tolerance, it's content.
        diff_sum = np.sum(diff, axis=2)
        has_content = diff_sum > 10
        
        # Project
        col_has_pixels = np.any(has_content, axis=0)
        row_has_pixels = np.any(has_content, axis=1)

        def find_gaps(bool_arr):
            # Returns list of (start, end) indices of continuous TRUE segments (Content)
            segments = []
            on_segment = False
            start = 0
            for i, val in enumerate(bool_arr):
                if val and not on_segment:
                    on_segment = True
                    start = i
                elif not val and on_segment:
                    on_segment = False
                    segments.append((start, i))
            if on_segment:
                segments.append((start, len(bool_arr)))
            return segments

        col_segments = find_gaps(col_has_pixels)
        row_segments = find_gaps(row_has_pixels)

        print(f"Found {len(col_segments)} content columns.")
        print(f"Found {len(row_segments)} content rows.")

        if col_segments:
            widths = [end - start for start, end in col_segments]
            median_w = np.median(widths)
            print(f"Median Sprite Width: {median_w:.1f}px")
            # print(f"Widths: {widths}")
            
        if row_segments:
            heights = [end - start for start, end in row_segments]
            median_h = np.median(heights)
            print(f"Median Sprite Height: {median_h:.1f}px")
            # print(f"Heights: {heights}")
            
        if len(col_segments) > 0 and len(row_segments) > 0:
             print(f"Estimated Grid: {len(col_segments)} cols x {len(row_segments)} rows")
             # Guess cell size based on first segment + gap?
             # Actually, if we found segments, we can just use the median + gap average.

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    discover_grid(sys.argv[1])
