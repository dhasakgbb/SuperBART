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
        public string world;
        public string[] tags;
        public string variant;
        public string routeId;
        public LevelEntityData data;
        public Dictionary<string, object> fallback;
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
        public string variant;
        public string routeId;
        public string world;
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
        public LevelMetadataFlags flags;
        public BenchmarkAutoScroll[] benchmarkAutoScroll;
    }

    [Serializable]
    public sealed class LevelMetadataFlags
    {
        public bool maintenanceRoute;
        public bool bonusRoute;
        public string bonusRouteId;
        public string worldThemeAlias;
        public string checkpointStyle;
        public bool cinematicIntro;
        public bool worldHasBoss;
        public string progressionHint;
    }

    [Serializable]
    public sealed class LevelEntityData
    {
        public float? score;
        public float? value;
        public float? damage;
        public float? patrol;
        public float? amp;
        public float? topY;
        public float? bottomY;
        public float? behaviorBias;
        public string spawnReason;
        public string checkpointId;
        public string fileId;
        public string world;
        public string stage;
        public string channel;

        // Enemy/collectible behavior extension hooks
        public float? moveSpeedPxPerSec;
        public float? gravityScale;
        public float? jumpBoostPxPerSec;
        public string variant;
        public bool? singleUse;
        public bool? required;
        public string collectableId;
        public bool? maintenanceRoute;
        public bool? bonusRoute;
        public string worldId;
        public string stageId;
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
