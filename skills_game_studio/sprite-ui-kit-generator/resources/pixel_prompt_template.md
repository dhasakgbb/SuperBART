# Pixel Asset Prompt Template

Use this prompt skeleton when regenerating a consistent pixel-art UI pack:

1. Target look reference: `public/assets/target_look.png`
2. Required assets:
   - `public/assets/tiles/tileset.png`
   - `public/assets/sprites/coin.png`
   - `public/assets/sprites/question_block.png`
   - `public/assets/sprites/cloud_1.png`
   - `public/assets/sprites/cloud_2.png`
   - `public/assets/fonts/bitmap_font.png`
3. Avatar source and outputs:
   - source `public/assets/bart_source.png`
   - outputs `bart_head_32/48/64`, `bart_portrait_96`
4. Validation gate: `npm run lint:assets`
