# Runtime Snapshot Commands

Use these in browser devtools console during active play scene:

```js
window.capture_perf_snapshot()
window.render_game_to_text()
window.__SUPER_BART__.getState()
```

Recommended cadence:
1. Capture every ~10 seconds during normal-world traversal.
2. Capture every ~5 seconds during final-castle stress traversal.
3. Record snapshots before and after pause/resume.
