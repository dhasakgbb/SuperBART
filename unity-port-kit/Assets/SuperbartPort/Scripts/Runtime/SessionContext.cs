using UnityEngine;

namespace Superbart.Runtime
{
    public sealed class SessionContext
    {
        public int world = 1;
        public int stage = 1;
        public string bonusRouteId = string.Empty;
        public bool fromMenu;
        public bool fromDeath;
        public bool fromMaintenance;
        public bool hasSeedOverride;
        public int seedOverride;

        public static SessionContext Empty => new SessionContext();

        public string LevelKey => $"w{world}_l{stage}";

        public string SeedDescription => hasSeedOverride ? seedOverride.ToString() : "auto";

        public SessionContext Copy()
        {
            return new SessionContext
            {
                world = world,
                stage = stage,
                bonusRouteId = bonusRouteId,
                fromMenu = fromMenu,
                fromDeath = fromDeath,
                fromMaintenance = fromMaintenance,
                hasSeedOverride = hasSeedOverride,
                seedOverride = seedOverride,
            };
        }
    }

    public static class SessionContextExtensions
    {
        public static string GetSceneSeedLabel(this SessionContext context)
        {
            return context == null || !context.hasSeedOverride ? "randomized-seed" : context.seedOverride.ToString();
        }
    }
}

