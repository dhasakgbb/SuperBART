namespace Superbart.Player
{
    // Ported from src/core/constants.ts (PLAYER_CONSTANTS)
    public static class PlayerConstants
    {
        public const float RunAcceleration = 2200f;
        public const float RunDrag = 1600f;
        public const float MaxSpeed = 260f;
        public const float RunSpeedMultiplier = 1.38f;
        public const float JumpCutWindowMs = 90f;
        public const float RunTransitionMs = 120f;
        public const float SkidThresholdPxPerSec = 120f;
        public const float SkidDurationMs = 96f;
        public const float JumpVelocity = -460f;
        public const float JumpCutMultiplier = 0.52f;
        public const float AirControlMultiplier = 0.7f;
        public const float AirDragMultiplier = 0.45f;
        public const float GravityY = 980f;
        public const float CoyoteMs = 100f;
        public const float JumpBufferMs = 100f;
        public const float MaxFallSpeed = 700f;
    }
}
