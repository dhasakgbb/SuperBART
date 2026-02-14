import argparse
import json
import os
from PIL import Image

def hex_code(rgb):
    return '#{:02X}{:02X}{:02X}'.format(*rgb)

def extract_and_update(image_path, json_path, category='player'):
    print(f"Reading {image_path}...")
    img = Image.open(image_path).convert('RGBA')
    # Get unique colors (ignoring fully transparent)
    colors = set()
    for r, g, b, a in img.getdata():
        if a > 0:
            colors.add((r, g, b))
    
    unique_hex = sorted([hex_code(c) for c in colors])
    print(f"Found {len(unique_hex)} unique colors.")

    with open(json_path, 'r') as f:
        data = json.load(f)
    
    # Update category
    data['global'][category] = unique_hex
    
    with open(json_path, 'w') as f:
        json.dump(data, f, indent=2)
    print(f"Updated {category} palette in {json_path}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--image", required=True)
    parser.add_argument("--json", required=True)
    parser.add_argument("--category", default="player")
    args = parser.parse_args()
    extract_and_update(args.image, args.json, args.category)
