import os
import shutil

# Unify naming
mapping = {
    0: 'idle_00.png',
    1: 'walk_00.png',
    2: 'walk_01.png',
    3: 'walk_02.png',
    4: 'run_start_00.png',
    5: 'run_start_01.png',
    6: 'run_start_02.png',
    7: 'skid_00.png',
    8: 'jump_00.png',
    9: 'fall_00.png',
    10: 'land_00.png',
    11: 'hurt_00.png',
    12: 'win_00.png',
    13: 'dead_00.png'
}

base_dir = "tmp/imagegen/bart_final"
staging_dir = "tmp/imagegen/bart_staging"

if os.path.exists(staging_dir):
    shutil.rmtree(staging_dir)
os.makedirs(staging_dir)

for i in range(14):
    src_name = mapping.get(i)
    if not src_name:
        print(f"Missing mapping for {i}")
        continue
        
    src_path = os.path.join(base_dir, src_name)
    dst_name = f"frame_{i:02d}.png"
    dst_path = os.path.join(staging_dir, dst_name)
    
    if os.path.exists(src_path):
        shutil.copy(src_path, dst_path)
        print(f"Mapped {src_name} -> {dst_name}")
    else:
        print(f"Source not found: {src_path}")
