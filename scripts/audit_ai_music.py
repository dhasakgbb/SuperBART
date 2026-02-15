#!/usr/bin/env python3
from __future__ import annotations

import argparse
from pathlib import Path

import numpy as np
import soundfile as sf

from mutagen.flac import FLAC


TRACK_IDS = [
    'world-1',
    'world-2',
    'world-3',
    'world-4',
    'world-5',
    'world-6',
    'world-7',
    'boss-1',
    'boss-2',
    'boss-3',
    'boss-4',
    'boss-5',
    'boss-6',
    'boss-7',
    'title',
    'world-map'
]

TITLE_WORLD_MAP_MIN = 50.0
WORLD_BOSS_MIN = 47.0
TARGET_SR = 44100
TARGET_CHANNELS = 2
TARGET_FORMAT = 'flac'


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description='Audit AI music assets for production quality expectations.')
    parser.add_argument('--input-dir', default='public/music/ai', help='Directory containing AI music files.')
    parser.add_argument(
        '--tracks',
        default=','.join(TRACK_IDS),
        help='Comma-separated track IDs to validate (default: all expected tracks).'
    )
    return parser.parse_args()


def parse_tracks(tracks_arg: str) -> list[str]:
    requested = [entry.strip() for entry in tracks_arg.split(',') if entry.strip()]
    if not requested:
        return list(TRACK_IDS)
    return requested


def expected_min_duration(track_id: str) -> float:
    return TITLE_WORLD_MAP_MIN if track_id in {'title', 'world-map'} else WORLD_BOSS_MIN


def check_track(path: Path, track_id: str) -> bool:
    if not path.exists():
        print(f'FAIL {track_id}: missing file {path}')
        return False

    try:
        FLAC(str(path))
    except Exception as error:
        print(f'FAIL {track_id}: mutagen could not parse FLAC container ({error})')
        return False

    info = sf.info(str(path))
    if info.format.lower() != TARGET_FORMAT:
        print(f'FAIL {track_id}: format={info.format} != {TARGET_FORMAT}')
        return False

    if info.samplerate != TARGET_SR:
        print(f'FAIL {track_id}: sample rate {info.samplerate} != {TARGET_SR}')
        return False

    if info.channels != TARGET_CHANNELS:
        print(f'FAIL {track_id}: channels {info.channels} != {TARGET_CHANNELS}')
        return False

    if info.frames <= 0:
        print(f'FAIL {track_id}: empty or zero-frame audio')
        return False

    duration = float(info.frames) / float(info.samplerate)
    min_duration = expected_min_duration(track_id)
    if duration < min_duration:
        print(f'FAIL {track_id}: duration {duration:.2f}s < {min_duration:.2f}s')
        return False

    data, _ = sf.read(str(path), dtype='float32')
    if data.size == 0:
        print(f'FAIL {track_id}: no audio data')
        return False

    if np.max(np.abs(data)) <= 0:
        print(f'FAIL {track_id}: zero-energy output')
        return False

    print(f'PASS {track_id}: {duration:.2f}s {info.samplerate}Hz {info.channels}ch {path.stat().st_size} bytes')
    return True


def main() -> None:
    args = parse_args()
    input_dir = Path(args.input_dir)
    track_ids = parse_tracks(args.tracks)
    files_to_check = [(input_dir / f'{track_id}.flac', track_id) for track_id in track_ids]

    failures = []
    for path, track_id in files_to_check:
        if not check_track(path, track_id):
            failures.append(track_id)

    if failures:
        print(f'{len(failures)} track(s) failed quality gate.')
        raise SystemExit(1)

    print('All AI music tracks passed quality gate.')


if __name__ == '__main__':
    main()
