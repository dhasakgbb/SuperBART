#!/usr/bin/env python3
from __future__ import annotations

import argparse
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable

import numpy as np
import soundfile as sf
from mutagen import File
from scipy.signal import resample_poly


TRACK_IDS = [
    'world-1',
    'world-2',
    'world-3',
    'world-4',
    'world-5',
    'world-6',
    'boss-1',
    'boss-2',
    'boss-3',
    'boss-4',
    'boss-5',
    'boss-6',
    'title',
    'world-map'
]


@dataclass(frozen=True)
class TrackNormalizationProfile:
    target_sr: int
    target_channels: int
    target_format: str
    min_duration: float


def infer_profile(track_id: str) -> TrackNormalizationProfile:
    return TrackNormalizationProfile(
        target_sr=44100,
        target_channels=2,
        target_format='flac',
        min_duration=50.0 if track_id in {'title', 'world-map'} else 47.0
    )


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description='Normalize AI music tracks to consistent production settings.')
    parser.add_argument('--input-dir', default='public/music/ai', help='Directory containing generated AI music files.')
    parser.add_argument('--output-dir', default='public/music/ai', help='Output directory for normalized files.')
    parser.add_argument(
        '--tracks',
        default=','.join(TRACK_IDS),
        help='Comma-separated track IDs to normalize (default: all AI tracks).'
    )
    parser.add_argument('--dry-run', action='store_true', help='Resolve tracks and report what would be done.')
    return parser.parse_args()


def parse_tracks(tracks_arg: str) -> list[str]:
    requested = [entry.strip() for entry in tracks_arg.split(',') if entry.strip()]
    if not requested:
        return list(TRACK_IDS)
    return requested


def check_mutagen_format(path: Path, expected_format: str) -> None:
    media = File(path)
    if media is None:
        raise RuntimeError(f'File could not be parsed by mutagen: {path.name}')
    if expected_format.lower() != 'flac':
        return
    if media.__class__.__name__.lower() == 'flac':
        return
    if not media.mime or 'flac' not in ''.join(media.mime).lower():
        raise RuntimeError(f'Expected FLAC container for {path.name}, detected {media.mime}')


def normalize_channels(data: np.ndarray, target_channels: int) -> np.ndarray:
    if data.ndim == 1:
        data = data[:, None]

    current_channels = data.shape[1]
    if current_channels == target_channels:
        return data

    if target_channels == 1:
        return np.mean(data, axis=1, keepdims=True)

    if current_channels == 1:
        return np.repeat(data, target_channels, axis=1)

    if current_channels > target_channels:
        return data[:, :target_channels]

    repeats = (target_channels + current_channels - 1) // current_channels
    tiled = np.tile(data, (1, repeats))
    return tiled[:, :target_channels]


def normalize_track(
    input_path: Path,
    output_path: Path,
    profile: TrackNormalizationProfile,
    dry_run: bool
) -> None:
    if not input_path.exists():
        raise RuntimeError(f'Missing input track: {input_path.name}')

    data, sample_rate = sf.read(input_path, dtype='float32', always_2d=True)
    if data.size == 0:
        raise RuntimeError(f'Empty track: {input_path.name}')

    if sample_rate != profile.target_sr:
        data = resample_poly(data, profile.target_sr, sample_rate, axis=0)

    data = normalize_channels(data, profile.target_channels)

    peak = float(np.max(np.abs(data)))
    if peak > 0:
        data = data * min(0.98 / peak, 10.0)

    duration = data.shape[0] / profile.target_sr
    if duration < profile.min_duration:
        raise RuntimeError(
            f'Track duration {duration:.2f}s is below minimum {profile.min_duration:.2f}s for {input_path.name}. '
            'Regeneration is required; normalization cannot stretch content.'
        )

    if dry_run:
        print(
            f'[DRY-RUN] would normalize {input_path.name}: '
            f'{duration:.2f}s, {sample_rate}Hz->{profile.target_sr}Hz, {data.shape[1]}ch->{profile.target_channels}ch'
        )
        return

    output_path.parent.mkdir(parents=True, exist_ok=True)
    sf.write(
        output_path,
        data,
        profile.target_sr,
        format=profile.target_format.upper(),
        subtype='PCM_24'
    )
    check_mutagen_format(output_path, profile.target_format)
    print(
        f'[NORMALIZED] {output_path.name} -> '
        f'{profile.target_format.upper()} {profile.target_sr}Hz {profile.target_channels}ch ({duration:.2f}s)'
    )


def build_file_paths(input_dir: Path, output_dir: Path, track_ids: Iterable[str]) -> list[tuple[Path, Path, str]]:
    return [
        (input_dir / f'{track_id}.flac', output_dir / f'{track_id}.flac', track_id)
        for track_id in track_ids
    ]


def main() -> None:
    args = parse_args()
    input_dir = Path(args.input_dir)
    output_dir = Path(args.output_dir)
    track_ids = parse_tracks(args.tracks)

    failures: list[str] = []

    for input_path, output_path, track_id in build_file_paths(input_dir, output_dir, track_ids):
        profile = infer_profile(track_id)
        try:
            normalize_track(input_path, output_path, profile, args.dry_run)
        except Exception as error:
            failures.append(f'{track_id}: {error}')
            if args.dry_run:
                print(f'[ERROR] {track_id}: {error}')

    if failures:
        print('Normalization failed:')
        for entry in failures:
            print(f' - {entry}')
        raise SystemExit(1)

    print('Music normalization complete.')


if __name__ == '__main__':
    main()
