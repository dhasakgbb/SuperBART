from PIL import Image, ImageDraw
import sys
import os
import shutil

def extract_sprites(path, out_dir, target_w=64, target_h=64):
    try:
        if os.path.exists(out_dir):
            shutil.rmtree(out_dir)
        os.makedirs(out_dir)

        img = Image.open(path).convert('RGBA')
        w, h = img.size
        print(f"Image: {w}x{h}")
        
        # 1. Downscale for component finding (4x faster)
        scale_input = 4
        small_w, small_h = w // scale_input, h // scale_input
        small = img.resize((small_w, small_h), Image.NEAREST)
        s_pixels = small.load()
        s_bg = s_pixels[0, 0]
        
        grid = [[0] * small_w for _ in range(small_h)]
        equivalences = {} 
        next_label = 1
        
        print("Labeling...")
        for y in range(small_h):
            for x in range(small_w):
                p = s_pixels[x, y]
                diff = sum([abs(c1 - c2) for c1, c2 in zip(p, s_bg)])
                if diff > 30:
                    left = grid[y][x-1] if x > 0 else 0
                    top = grid[y-1][x] if y > 0 else 0
                    
                    if left and top:
                        grid[y][x] = left
                        if left != top:
                            root_left = left
                            while root_left in equivalences: root_left = equivalences[root_left]
                            root_top = top
                            while root_top in equivalences: root_top = equivalences[root_top]
                            if root_left != root_top:
                                equivalences[max(root_left, root_top)] = min(root_left, root_top)
                    elif left:
                        grid[y][x] = left
                    elif top:
                        grid[y][x] = top
                    else:
                        grid[y][x] = next_label
                        next_label += 1

        def get_root(i):
            while i in equivalences:
                i = equivalences[i]
            return i

        components = {} 
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
        
        # Filter components
        valid_comps = []
        for c in components.values():
            # Filter outliers (too small or the Giant Poster Bart)
            # Poster Bart was ~24000 area. Frames are ~4000.
            if c['count'] < 100: continue # Noise
            if c['count'] > 15000: 
                print(f"Skipping giant component (Area: {c['count']})")
                continue 
            
            # Scale up bbox
            bx = c['min_x'] * scale_input
            by = c['min_y'] * scale_input
            bw = (c['max_x'] - c['min_x'] + 1) * scale_input
            bh = (c['max_y'] - c['min_y'] + 1) * scale_input
            
            # Expand slightly to avoid cutting edges
            padding = 4
            bx = max(0, bx - padding)
            by = max(0, by - padding)
            bw += padding * 2
            bh += padding * 2
            
            valid_comps.append({'x': bx, 'y': by, 'w': bw, 'h': bh, 'cx': bx + bw/2, 'cy': by + bh/2})
            
        # SORT by Grid Order (Row-major)
        # We need to cluster Ys to rows.
        # Simple heuristic: Sort by Y, then grouped by Y threshold (~half height)
        
        valid_comps.sort(key=lambda c: c['y'])
        
        rows = []
        if valid_comps:
            current_row = [valid_comps[0]]
            row_y = valid_comps[0]['y']
            row_h = valid_comps[0]['h']
            
            for c in valid_comps[1:]:
                # If overlap in Y is significant, same row
                if c['y'] < row_y + row_h * 0.5:
                    current_row.append(c)
                else:
                    # New row
                    rows.append(sorted(current_row, key=lambda i: i['x']))
                    current_row = [c]
                    row_y = c['y']
                    row_h = c['h']
            rows.append(sorted(current_row, key=lambda i: i['x']))
            
        final_list = []
        for r in rows:
            final_list.extend(r)
            
        print(f"Extracted {len(final_list)} sprite frames.")
        
        for i, c in enumerate(final_list):
            sprite = img.crop((c['x'], c['y'], c['x'] + c['w'], c['y'] + c['h']))
            
            # Resize preserving aspect ratio to fit in target box
            # Fit into target_w x target_h
            
            ratio = min(target_w / sprite.width, target_h / sprite.height)
            new_w = int(sprite.width * ratio)
            new_h = int(sprite.height * ratio)
            
            resized = sprite.resize((new_w, new_h), Image.LANCZOS) # High quality
            
            # Center in target canvas
            canvas = Image.new('RGBA', (target_w, target_h), (0,0,0,0))
            off_x = (target_w - new_w) // 2
            off_y = (target_h - new_h) // 2 # Center vertically? Or Align Bottom?
            # Character sprites usually align bottom.
            off_y = target_h - new_h 
            
            canvas.paste(resized, (off_x, off_y))
            
            out_p = os.path.join(out_dir, f"frame_{i:02d}.png")
            canvas.save(out_p)
            print(f"Saved {out_p}")

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    # Usage: python extract_sprites.py input output_dir width height
    extract_sprites(sys.argv[1], sys.argv[2], int(sys.argv[3]), int(sys.argv[4]))
