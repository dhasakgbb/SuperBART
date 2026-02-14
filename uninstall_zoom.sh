#!/bin/bash
# Zoom Uninstaller for macOS
# Run with: bash uninstall_zoom.sh

set -euo pipefail

echo "=== Zoom Uninstaller ==="
echo ""

# Quit Zoom if running
if pgrep -x "zoom.us" > /dev/null 2>&1; then
    echo "Quitting Zoom..."
    osascript -e 'quit app "zoom.us"' 2>/dev/null || true
    sleep 2
fi

TARGETS=(
    # App bundle
    "/Applications/zoom.us.app"

    # User data and preferences
    "$HOME/Library/Application Support/zoom.us"
    "$HOME/Library/Caches/us.zoom.xos"
    "$HOME/Library/Logs/zoom.us"
    "$HOME/Library/Cookies/us.zoom.xos.binarycookies"
    "$HOME/Library/Saved Application State/us.zoom.xos.savedState"
    "$HOME/Library/WebKit/us.zoom.xos"

    # Preferences
    "$HOME/Library/Preferences/us.zoom.xos.plist"
    "$HOME/Library/Preferences/us.zoom.xos.Hotkey.plist"
    "$HOME/Library/Preferences/ZoomChat.plist"

    # Internet plugins
    "$HOME/Library/Internet Plug-Ins/ZoomUsPlugIn.plugin"

    # Launch agents
    "$HOME/Library/LaunchAgents/us.zoom.launcher.plist"

    # Group containers
    "$HOME/Library/Group Containers/BJ4HAAB9B3.ZoomClient3rd"

    # Receipts
    "/var/db/receipts/us.zoom.pkg.videmeeting.bom"
    "/var/db/receipts/us.zoom.pkg.videmeeting.plist"

    # Audio plugin
    "/Library/Audio/Plug-Ins/HAL/ZoomAudioDevice.driver"

    # Privacy daemon
    "/Library/PrivilegedHelperTools/us.zoom.ZoomDaemon"
    "/Library/LaunchDaemons/us.zoom.ZoomDaemon.plist"
)

removed=0
skipped=0

for target in "${TARGETS[@]}"; do
    if [ -e "$target" ]; then
        echo "  Removing: $target"
        rm -rf "$target" 2>/dev/null || sudo rm -rf "$target"
        ((removed++))
    else
        ((skipped++))
    fi
done

# Forget package receipts
pkgutil --pkgs 2>/dev/null | grep -i zoom | while read -r pkg; do
    echo "  Forgetting package: $pkg"
    sudo pkgutil --forget "$pkg" 2>/dev/null || true
done

echo ""
echo "Done. Removed $removed items, $skipped already gone."
echo "You may want to restart your Mac to clear any cached processes."
