# Performance Budget

## Target Platform
- Mid-tier laptop (integrated graphics), modern Chromium/Firefox.
- Viewport: `960x540`, pixel-art rendering enabled.

## Scene-Specific Frame Budgets (60 FPS target)
- **Play scene traversal (normal world)**
  - p50 <= 8.0 ms
  - p95 <= 14.0 ms
  - p99 <= 18.0 ms
- **Play scene stress (final castle, heavy enemies/projectiles)**
  - p50 <= 9.5 ms
  - p95 <= 16.5 ms
  - p99 <= 22.0 ms
- **Level select/menu scenes**
  - p50 <= 4.0 ms
  - p95 <= 7.0 ms
  - p99 <= 10.0 ms

## Memory Budgets
- Runtime JS heap p95 <= 140 MB over a 10-minute run.
- Asset payload loaded at boot <= 14 MB.

## Load/Transition Budgets
- Cold boot to title <= 2.2 s on warm local npm dev environment.
- Level transition (clear -> next play start) <= 1.4 s.
- Pause/resume transition <= 150 ms.

## Measurement Protocol
- Use browser performance panel plus `window.capture_perf_snapshot()` every ~10 seconds.
- Record p50/p95/p99 from at least 60-second play samples.
- Run both a normal world route and final-castle stress route.

## Failure Handling
- Any p95 or p99 breach is release-blocking until mitigated or explicitly waived.
- Record mitigation action and rerun measurements before merge.
