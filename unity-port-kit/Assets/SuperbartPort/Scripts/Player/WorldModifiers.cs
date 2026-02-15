using System;

namespace Superbart.Player
{
    [Serializable]
    public struct WorldModifiers
    {
        // 1.0 = normal
        public float frictionMultiplier;   // slippery if < 1
        public float gravityMultiplier;
        public float speedMultiplier;
        public float tokenBurnRate;

        public static WorldModifiers Default => new WorldModifiers
        {
            frictionMultiplier = 1f,
            gravityMultiplier = 1f,
            speedMultiplier = 1f,
            tokenBurnRate = 1f,
        };
    }
}
