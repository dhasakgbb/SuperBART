using UnityEngine;

namespace Superbart.Core
{
    public static class GameConstants
    {
        // Phaser uses TILE_SIZE=16 pixels. Recommended Unity import: Pixels Per Unit = 16.
        public const int TileSizePx = 16;
        public const float PixelsPerUnit = 16f;

        public static float PxToUnits(float px) => px / PixelsPerUnit;
        public static float UnitsToPx(float units) => units * PixelsPerUnit;

        // If you want to keep Phaser's "y grows downward" coordinate conventions,
        // you can map y to negative in Unity.
        public static Vector2 PhaserPxToUnity(float xPx, float yPx)
        {
            return new Vector2(PxToUnits(xPx), -PxToUnits(yPx));
        }
    }
}
