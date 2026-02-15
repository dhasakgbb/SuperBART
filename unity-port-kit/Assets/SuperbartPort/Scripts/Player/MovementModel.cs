using UnityEngine;

namespace Superbart.Player
{
    public struct MovementStepInput
    {
        public float dtMs;
        public float vx;
        public float vy;
        public int inputX; // -1,0,1
        public bool jumpPressed;
        public bool jumpHeld;
        public bool runHeld;
        public bool onGround;
        public FeelState feel;
        public WorldModifiers modifiers;
    }

    public struct MovementStepOutput
    {
        public float vx;
        public float vy;
        public bool jumped;
        public MotionHint motionHint;
        public FeelState feel;
    }

    public static class MovementModel
    {
        // Direct port of src/player/movement.ts::stepMovement
        public static MovementStepOutput Step(MovementStepInput input)
        {
            float dt = input.dtMs / 1000f;
            WorldModifiers m = input.modifiers;
            FeelState next = input.feel;

            bool jumpReleased = !input.jumpHeld && next.prevJumpHeld;

            // Coyote time
            if (input.onGround)
            {
                next.coyoteMsLeft = PlayerConstants.CoyoteMs;
            }
            else
            {
                next.coyoteMsLeft = Mathf.Max(0, next.coyoteMsLeft - input.dtMs);
            }

            // Jump buffer
            if (input.jumpPressed)
            {
                next.jumpBufferMsLeft = PlayerConstants.JumpBufferMs;
            }
            else
            {
                next.jumpBufferMsLeft = Mathf.Max(0, next.jumpBufferMsLeft - input.dtMs);
            }

            bool hasGroundMoveInput = input.inputX != 0;

            // Run charge
            if (input.onGround)
            {
                float runChargeDelta = (input.runHeld && hasGroundMoveInput) ? input.dtMs : -input.dtMs;
                next.runChargeMs = Mathf.Clamp(next.runChargeMs + runChargeDelta, 0, PlayerConstants.RunTransitionMs);
            }
            else
            {
                next.runChargeMs = Mathf.Max(0, next.runChargeMs - input.dtMs);
            }

            float runChargeProgress = Mathf.Min(1f, next.runChargeMs / PlayerConstants.RunTransitionMs);
            bool runReady = input.onGround && input.runHeld && hasGroundMoveInput && runChargeProgress >= 1f;
            next.desiredState = (input.onGround && runReady) ? DesiredState.Run : DesiredState.Walk;

            float runProgress = input.runHeld ? runChargeProgress : 0f;
            float runMultiplier = 1f + (PlayerConstants.RunSpeedMultiplier - 1f) * runProgress;

            float target = input.inputX * PlayerConstants.MaxSpeed * m.speedMultiplier * (input.runHeld ? runMultiplier : 1f);

            float walkBaseAcceleration = PlayerConstants.RunAcceleration * 0.72f;
            float dragBase = input.onGround ? PlayerConstants.RunDrag : PlayerConstants.RunDrag * 0.92f;
            float drag = dragBase * m.frictionMultiplier;

            float runAccelBlend = PlayerConstants.RunAcceleration * (0.72f + 0.28f * runProgress);
            float groundAcceleration = input.runHeld ? runAccelBlend : walkBaseAcceleration;

            float baseAcceleration = (input.inputX == 0) ? drag : groundAcceleration;

            float controlMultiplier = input.onGround
                ? 1f
                : (input.inputX == 0 ? PlayerConstants.AirDragMultiplier : PlayerConstants.AirControlMultiplier);

            float accel = baseAcceleration * controlMultiplier;
            float vx = input.vx;

            // Skid
            bool reversing = input.onGround && input.inputX != 0 && !Mathf.Approximately(vx, 0) && Mathf.Sign(input.inputX) != Mathf.Sign(vx);
            bool hasSkidMomentum = Mathf.Abs(vx) >= PlayerConstants.SkidThresholdPxPerSec;
            bool newSkid = reversing && hasSkidMomentum && next.skidMsLeft <= 0;

            if (newSkid)
            {
                next.skidMsLeft = Mathf.Max(next.skidMsLeft, PlayerConstants.SkidDurationMs);
            }
            else if (next.skidMsLeft > 0)
            {
                next.skidMsLeft = Mathf.Max(0, next.skidMsLeft - input.dtMs);
            }

            // Approach target velocity
            if (vx < target)
            {
                vx = Mathf.Min(target, vx + accel * dt);
            }
            else if (vx > target)
            {
                float skidBrake = next.skidMsLeft > 0 ? 1.45f : 1f;
                float stopRate = accel * dt * skidBrake;
                vx = Mathf.Max(target, vx - stopRate);
            }

            // Vertical
            float vy = Mathf.Min(PlayerConstants.MaxFallSpeed, input.vy + PlayerConstants.GravityY * m.gravityMultiplier * dt);
            bool jumped = false;

            if (input.onGround)
            {
                next.jumpCutApplied = false;
                next.jumpCutWindowMsLeft = 0;
            }
            else if (next.jumpCutWindowMsLeft > 0)
            {
                next.jumpCutWindowMsLeft = Mathf.Max(0, next.jumpCutWindowMsLeft - input.dtMs);
            }

            if (next.jumpBufferMsLeft > 0 && next.coyoteMsLeft > 0)
            {
                vy = PlayerConstants.JumpVelocity;
                next.jumpBufferMsLeft = 0;
                next.coyoteMsLeft = 0;
                next.jumpCutApplied = false;
                next.jumpCutWindowMsLeft = PlayerConstants.JumpCutWindowMs;
                jumped = true;
            }

            next.prevJumpHeld = input.jumpHeld;

            // One-shot jump cut
            if (jumpReleased && !next.jumpCutApplied && next.jumpCutWindowMsLeft > 0 && vy < 0)
            {
                vy *= PlayerConstants.JumpCutMultiplier;
                next.jumpCutApplied = true;
            }

            // Motion hint (for animation)
            float absVx = Mathf.Abs(vx);
            float runHintVelocityThreshold = PlayerConstants.MaxSpeed * 0.65f * m.speedMultiplier;

            MotionHint hint = MotionHint.Air;
            if (input.onGround)
            {
                if (next.skidMsLeft > 0)
                {
                    hint = MotionHint.Skid;
                }
                else if (runReady && absVx >= runHintVelocityThreshold)
                {
                    hint = MotionHint.Run;
                }
                else
                {
                    hint = MotionHint.Walk;
                }
            }

            return new MovementStepOutput
            {
                vx = vx,
                vy = vy,
                jumped = jumped,
                motionHint = hint,
                feel = next,
            };
        }
    }
}
