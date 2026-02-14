from PIL import Image, ImageDraw, ImageFont
import sys
import math

def create_contact_sheet(input_path, output_path, tile_w=32, tile_h=32, max_frames=200):
    img = Image.open(input_path)
    sheet_w, sheet_h = img.size
    cols = sheet_w // tile_w
    rows = sheet_h // tile_h
    
    # We want to show the first N frames to find the animations
    # Let's make a contact sheet of 10 cols x N rows
    
    contact_cols = 10
    contact_rows = math.ceil(max_frames / contact_cols)
    
    contact_w = contact_cols * (tile_w + 2)
    contact_h = contact_rows * (tile_h + 12) # Extra space for label
    
    contact = Image.new('RGBA', (contact_w, contact_h), (50, 50, 50, 255))
    draw = ImageDraw.Draw(contact)
    
    for i in range(min(max_frames, cols * rows)):
        # Source coords
        src_col = i % cols
        src_row = i // cols
        sx = src_col * tile_w
        sy = src_row * tile_h
        
        tile = img.crop((sx, sy, sx + tile_w, sy + tile_h))
        
        # Dest coords
        dst_col = i % contact_cols
        dst_row = i // contact_cols
        dx = dst_col * (tile_w + 2)
        dy = dst_row * (tile_h + 12)
        
        contact.paste(tile, (dx, dy))
        # Draw Label
        draw.text((dx, dy + tile_h), str(i), fill="white")
        
    contact.save(output_path)
    print(f"Saved contact sheet to {output_path}")

if __name__ == "__main__":
    create_contact_sheet(sys.argv[1], sys.argv[2])
