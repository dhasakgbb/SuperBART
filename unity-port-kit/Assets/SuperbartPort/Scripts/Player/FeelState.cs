using System;

namespace Superbart.Player
{
    [Serializable]
    public struct FeelState
    {
        public float coyoteMsLeft;
        public float jumpBufferMsLeft;
        public bool jumpCutApplied;
        public float jumpCutWindowMsLeft;
        public bool prevJumpHeld;
        public float runChargeMs;
        public DesiredState desiredState;
        public float skidMsLeft;

        public static FeelState Create()
        {
            return new FeelState
            {
                coyoteMsLeft = 0,
                jumpBufferMsLeft = 0,
                jumpCutApplied = false,
                jumpCutWindowMsLeft = 0,
                prevJumpHeld = false,
                runChargeMs = 0,
                desiredState = DesiredState.Walk,
                skidMsLeft = 0,
            };
        }
    }

    public enum DesiredState
    {
        Walk,
        Run
    }

    public enum MotionHint
    {
        Air,
        Walk,
        Run,
        Skid
    }
}
