#!/bin/bash
# SuperBART Root Directory Cleanup Script
# Run this from the repository root to remove accumulated cruft.
# Review each section before uncommenting if desired.

set -e
echo "SuperBART Cleanup Script"
echo "========================"

# 1. Vite cache/temp files (safe to delete, will regenerate)
echo "Removing Vite timestamp cache files..."
rm -f vite.config.js.timestamp*.mjs
rm -f vite.config.ts.timestamp*.mjs

# 2. Redundant vite.config.js (vite.config.ts is the real config)
echo "Removing redundant vite.config.js..."
rm -f vite.config.js

# 3. Junk/placeholder files
echo "Removing junk files..."
rm -f cloud_test.png current_state.png .DS_Store

# 4. Empty/stale directories
echo "Removing stale directories..."
rm -rf telemetry/
rm -rf test-results/
rm -rf .playwright-mcp/
rm -rf dist_check/

# 5. Build artifacts from old build system
echo "Removing old build system artifacts..."
rm -rf build/

# 6. Temp directory (debug images, imagegen scratch)
echo "Removing tmp/ directory..."
rm -rf tmp/

# 7. Output directory (stale imagegen outputs)
echo "Removing output/ directory..."
rm -rf output/

# 8. Debug source file (never imported, just console.log diagnostics)
echo "Removing debug_imports.ts..."
rm -f src/debug_imports.ts

# 9. Move internal working documents to docs/
echo "Moving working docs to docs/dev-notes/..."
mkdir -p docs/dev-notes
[ -f AUDIT_SCRIPT_VS_CODE.md ] && mv AUDIT_SCRIPT_VS_CODE.md docs/dev-notes/
[ -f IMPLEMENTATION_PLAN.md ] && mv IMPLEMENTATION_PLAN.md docs/dev-notes/

# 10. Archive old tickets into docs
echo "Moving tickets/ to docs/dev-tickets/..."
[ -d tickets/ ] && mv tickets/ docs/dev-tickets/

# 11. Archive skills reference
echo "Moving skills_game_studio/ to docs/skills-reference/..."
[ -d skills_game_studio/ ] && mv skills_game_studio/ docs/skills-reference/

echo ""
echo "Cleanup complete. Verify with: git status"
echo ""
echo "Root should now contain only:"
echo "  .claude/  .git/  .gitattributes  .gitignore"
echo "  CLAUDE.md  README.md  SCRIPT.md"
echo "  docs/  node_modules/  public/  scripts/  src/  tests/  tools/"
echo "  index.html  package.json  package-lock.json"
echo "  playwright.config.ts  tsconfig.json  vite.config.ts"
