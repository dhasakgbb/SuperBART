from PIL import Image, ImageDraw
import sys

# Standard Union-Find (Disjoint Set) for component labeling would be slow in Python for 4MPix.
# We'll use a coarse grid approach or just a scanline blob merger.
# actually, let's just use a recursive flood fill with a large stack, or iterative.

def segment_components(path):
    sys.setrecursionlimit(20000) # Bump limit just in case, though iterative is better.
    
    try:
        img = Image.open(path).convert('RGBA')
        w, h = img.size
        print(f"Image: {w}x{h}")
        pixels = img.load()
        bg = pixels[0, 0]
        
        # 1. Create a boolean map of "content"
        # 0 = background, 1 = content
        # We'll implement a simple 2-pass labeling (Hoshen-Kopelman algorithm basics)
        # To avoid massive memory, we'll map to a smaller grid first? 
        # No, precision matters.
        
        # Let's simplify: Scan for blobs.
        # We will scan line by line.
        
        labels = {} # (x, y) -> label_id
        equivalences = {} 
        next_label = 1
        
        # To save memory/time, let's downscale by 4x first? 
        # If sprites are 64px, 16px blobs are fine.
        scale_factor = 4
        
        small_w, small_h = w // scale_factor, h // scale_factor
        small = img.resize((small_w, small_h), Image.NEAREST)
        s_pixels = small.load()
        s_bg = s_pixels[0, 0]
        
        grid = [[0] * small_w for _ in range(small_h)]
        
        print("First pass labeling...")
        for y in range(small_h):
            for x in range(small_w):
                p = s_pixels[x, y]
                diff = sum([abs(c1 - c2) for c1, c2 in zip(p, s_bg)])
                if diff > 30:
                    # It's content. Check neighbors (Left, Top)
                    # We are in 4-connectivity or 8? 4 is easier.
                    
                    left = grid[y][x-1] if x > 0 else 0
                    top = grid[y-1][x] if y > 0 else 0
                    
                    if left and top:
                        # Conflict?
                        grid[y][x] = left
                        if left != top:
                            # Union
                            # Simplest: mapping
                            root_left = left
                            while root_left in equivalences: root_left = equivalences[root_left]
                            root_top = top
                            while root_top in equivalences: root_top = equivalences[root_top]
                            
                            if root_left != root_top:
                                # Merge larger to smaller?
                                equivalences[max(root_left, root_top)] = min(root_left, root_top)
                    elif left:
                        grid[y][x] = left
                    elif top:
                        grid[y][x] = top
                    else:
                        grid[y][x] = next_label
                        next_label += 1

        print(f"Resolving {next_label} potential labels...")
        
        # Resolve equivalences
        def get_root(i):
            path = []
            while i in equivalences:
                path.append(i)
                i = equivalences[i]
            for node in path:
                equivalences[node] = i
            return i

        # Calculate bounding boxes
        components = {} # root_label -> {min_x, max_x, min_y, max_y, count}
        
        for y in range(small_h):
            for x in range(small_w):
                lbl = grid[y][x]
                if lbl:
                    root = get_root(lbl)
                    if root not in components:
                        components[root] = {'min_x': x, 'max_x': x, 'min_y': y, 'max_y': y, 'count': 0}
                    
                    c = components[root]
                    c['min_x'] = min(c['min_x'], x)
                    c['max_x'] = max(c['max_x'], x)
                    c['min_y'] = min(c['min_y'], y)
                    c['max_y'] = max(c['max_y'], y)
                    c['count'] += 1
        
        # Sort by size
        sorted_comps = sorted(components.values(), key=lambda c: c['count'], reverse=True)
        
        print(f"Found {len(sorted_comps)} components.")
        for i, c in enumerate(sorted_comps[:15]):
            # Scale back up
            bx = c['min_x'] * scale_factor
            by = c['min_y'] * scale_factor
            bw = (c['max_x'] - c['min_x'] + 1) * scale_factor
            bh = (c['max_y'] - c['min_y'] + 1) * scale_factor
            print(f"Comp {i}: {bw}x{bh} at ({bx},{by}) - Area: {c['count']}")

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    segment_components(sys.argv[1])
