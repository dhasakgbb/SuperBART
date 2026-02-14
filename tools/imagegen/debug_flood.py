from PIL import Image
import sys

def debug_flood(path):
    img = Image.open(path).convert("RGBA")
    pixels = img.load()
    w, h = img.size
    
    seeds = [(0, 0), (w-1, 0), (0, h-1), (w-1, h-1)]
    queue = []
    visited = set()
    
    for s in seeds:
        if 0 <= s[0] < w and 0 <= s[1] < h:
            queue.append(s)
            visited.add(s)
            
    print(f"Seeds: {queue}")
    ref = pixels[0,0]
    print(f"Ref color at (0,0): {ref}")
    
    count = 0
    threshold_sq = 2500 # Increased tolerance
    
    while queue:
        x, y = queue.pop(0)
        pixels[x, y] = (0, 0, 0, 0)
        count += 1
        
                # Compare against NEIGHBOR (x,y) which we just popped
                # This handles gradients better.
                curr_r, curr_g, curr_b, _ = pixels[x, y] # This is 0,0,0,0 now? No, we set it to transparent.
                # We need the original color. But we overwrote it!
                # We need to store formatted image or keep a copy.
                # Actually, if we set it to transparent, we can't use it as reference for the next step.
                # We must use a copy or a "visited" set with original values?
                # Or just load the original again?
                # Let's keep a duplicate for reading.
                pass

    # Re-impl with read-only copy
    src_pixels = img.copy().load()
    
    while queue:
        x, y = queue.pop(0)
        pixels[x, y] = (0, 0, 0, 0) # Write to the output image
        count += 1
        
        pr, pg, pb, _ = src_pixels[x, y]
        
        for dx, dy in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
            nx, ny = x + dx, y + dy
            if 0 <= nx < w and 0 <= ny < h and (nx, ny) not in visited:
                r, g, b, a = src_pixels[nx, ny]
                
                # Neighbor diff
                dist = (r - pr)**2 + (g - pg)**2 + (b - pb)**2
                
                if dist < threshold_sq:
                    visited.add((nx, ny))
                    queue.append((nx, ny))
                else:
                    if count % 1000 == 0:
                        print(f"Blocked at ({nx},{ny}) color {r},{g},{b} dist {dist}")

    print(f"Filled {count} pixels out of {w*h}")
    img.save("tmp/debug_flood_out.png")

if __name__ == "__main__":
    debug_flood(sys.argv[1])
