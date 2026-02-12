# Performance Budget

## Description
Defines frame-time, memory, and load targets for performance evaluation and release readiness.


## Target Hardware
- Mid-tier laptop CPU/GPU (integrated graphics acceptable)
- Browser: current Chrome/Edge/Firefox

## Frame Time Targets
- Gameplay p50: <= 8ms
- Gameplay p95: <= 14ms
- Gameplay p99: <= 18ms

## Memory Targets
- Runtime JS heap target: <= 120 MB
- Asset footprint target: <= 10 MB for MVP placeholders

## Load Targets
- Initial scene load: <= 2.0s on warm cache
- Restart cycle: <= 1.0s

## Measurement Notes
- Capture using browser performance tools with a 60s traversal run.
- Record p50/p95/p99 and note major spikes.
