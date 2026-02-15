using System;
using System.Collections.Generic;

namespace Superbart.Level
{
    // Model mirrors src/types/levelgen.ts::GeneratedLevel (enough for loading + spawning)

    [Serializable]
    public sealed class GeneratedLevel
    {
        public int tileSize;
        public int width;
        public int height;
        public int[][] tileGrid;

        public OneWayPlatform[] oneWayPlatforms;
        public MovingPlatformSpec[] movingPlatforms;

        public LevelEntity[] entities;
        public LevelCheckpoint[] checkpoints;
        public LevelGoal goal;

        public LevelMetadata metadata;
    }

    [Serializable]
    public sealed class OneWayPlatform
    {
        // NOTE: in your TS generator, these are TILE coordinates.
        public int x;
        public int y;
        public int w;
        public VanishSpec vanish;
    }

    [Serializable]
    public sealed class VanishSpec
    {
        public int visibleMs;
        public int hiddenMs;
        public int phaseOffsetMs;
    }

    [Serializable]
    public sealed class MovingPlatformSpec
    {
        public string id;
        // NOTE: in your TS generator, these are PIXELS.
        public float x;
        public float y;
        public float minX;
        public float maxX;
        public float speed;
    }

    [Serializable]
    public sealed class LevelEntity
    {
        public string id;
        public string type;
        // NOTE: in your TS generator, these are PIXELS (centered)
        public float x;
        public float y;
        public Dictionary<string, object> data;
    }

    [Serializable]
    public sealed class LevelCheckpoint
    {
        public string id;
        public float x;
        public float y;
    }

    [Serializable]
    public sealed class LevelGoal
    {
        // NOTE: generator uses PIXELS (top-left-ish), not centered.
        public float x;
        public float y;
    }

    [Serializable]
    public sealed class LevelMetadata
    {
        public int world;
        public int levelIndex;
        public string theme;
        public int difficultyTier;
        public string[] chunksUsed;
        public string[] pacing;
        public int seed;
        public SetPieceSpec setPiece;
        public BenchmarkAutoScroll[] benchmarkAutoScroll;
    }

    [Serializable]
    public sealed class SetPieceSpec
    {
        public string mode;
        public string description;
    }

    [Serializable]
    public sealed class BenchmarkAutoScroll
    {
        public float speedPxPerSec;
        public int durationMs;
        public float startX;
    }
}
