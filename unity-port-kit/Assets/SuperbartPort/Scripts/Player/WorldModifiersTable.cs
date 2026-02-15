using System.Collections.Generic;

namespace Superbart.Player
{
    /// <summary>
    /// Static lookup table for per-world physics modifiers.
    /// Mirrors the Phaser-side world modifier configuration from CLAUDE.md and worldRules.ts.
    /// </summary>
    public static class WorldModifiersTable
    {
        private static readonly Dictionary<int, WorldModifiers> Table = new()
        {
            // W1: The City (Prologue) - Standard physics
            [1] = new WorldModifiers
            {
                frictionMultiplier = 1.0f,
                gravityMultiplier = 1.0f,
                speedMultiplier = 1.0f,
                tokenBurnRate = 1.0f,
            },
            // W2: Cryo-Server Tundra - Standard (ice handled by surface friction)
            [2] = new WorldModifiers
            {
                frictionMultiplier = 1.0f,
                gravityMultiplier = 1.0f,
                speedMultiplier = 1.0f,
                tokenBurnRate = 1.0f,
            },
            // W3: Quantum Void - Low gravity
            [3] = new WorldModifiers
            {
                frictionMultiplier = 1.0f,
                gravityMultiplier = 0.82f,
                speedMultiplier = 1.0f,
                tokenBurnRate = 1.0f,
            },
            // W4: Deep Web Catacombs - Signal drift (reduced friction)
            [4] = new WorldModifiers
            {
                frictionMultiplier = 0.6f,
                gravityMultiplier = 1.0f,
                speedMultiplier = 1.0f,
                tokenBurnRate = 1.0f,
            },
            // W5: Digital Graveyard - Heavier gravity, faster token burn
            [5] = new WorldModifiers
            {
                frictionMultiplier = 1.0f,
                gravityMultiplier = 1.15f,
                speedMultiplier = 1.0f,
                tokenBurnRate = 1.2f,
            },
            // W6: Singularity Core - Standard (final boss gauntlet)
            [6] = new WorldModifiers
            {
                frictionMultiplier = 1.0f,
                gravityMultiplier = 1.0f,
                speedMultiplier = 1.0f,
                tokenBurnRate = 1.0f,
            },
            // W7: Omega's Domain - Standard (boss fight only)
            [7] = new WorldModifiers
            {
                frictionMultiplier = 1.0f,
                gravityMultiplier = 1.0f,
                speedMultiplier = 1.0f,
                tokenBurnRate = 1.0f,
            },
        };

        /// <summary>
        /// Returns the world modifiers for the given world number.
        /// Falls back to default (all 1.0) for unknown worlds.
        /// </summary>
        public static WorldModifiers ForWorld(int worldNumber)
        {
            return Table.TryGetValue(worldNumber, out var mods) ? mods : WorldModifiers.Default;
        }
    }
}
