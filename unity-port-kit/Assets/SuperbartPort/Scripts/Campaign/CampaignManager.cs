using System;
using Superbart.Combat;
using Superbart.Runtime;
using Superbart.Save;
using UnityEngine;

namespace Superbart.Campaign
{
    public sealed class CampaignManager : MonoBehaviour
    {
        [Header("Campaign Shape")]
        [SerializeField] private int worldCount = 7;
        [SerializeField] private int levelsPerWorld = 6;

        [Header("Progression Rule")]
        [Tooltip("When true, unlock order is enforced by completion order.")]
        [SerializeField] private bool deterministicProgression = true;

        public UnitySaveState State { get; private set; }
        public RuntimeRegistry RuntimeRegistry { get; private set; }

        public event Action<UnityCampaignProfile> OnProfileUpdated;

        public void Initialize(UnitySaveState state)
        {
            State = state ?? UnitySaveStore.NewFresh();
            UnitySaveStore.EnsureCanonical(State);
            NormalizeProfile();
        }

        public void InitializeIfNeeded()
        {
            if (State == null)
            {
                Initialize(UnitySaveStore.LoadOrCreate());
            }
        }

        public bool IsLevelUnlocked(int world, int stage)
        {
            if (world < 1 || stage < 1)
            {
                return false;
            }

            var key = GetLevelKey(world, stage);
            return State == null ? false : State.campaign.IsUnlocked(key);
        }

        public bool IsWorldCompleted(int world)
        {
            if (State == null || world < 1 || world > worldCount)
            {
                return false;
            }

            int completedInWorld = 0;
            for (int stage = 1; stage <= levelsPerWorld; stage++)
            {
                if (State.campaign.completedLevels.Contains(GetLevelKey(world, stage)))
                {
                    completedInWorld += 1;
                }
            }

            return completedInWorld >= levelsPerWorld;
        }

        public SessionContext GetNextSession(int world, int stage, string bonusRouteId = "")
        {
            return new SessionContext
            {
                world = Mathf.Clamp(world, 1, worldCount),
                stage = Mathf.Clamp(stage, 1, levelsPerWorld),
                bonusRouteId = ResolveBonusRouteId(bonusRouteId),
                fromMenu = false,
                fromDeath = false,
                fromMaintenance = false,
            };
        }

        private string ResolveBonusRouteId(string requestedBonusRoute)
        {
            if (!deterministicProgression)
            {
                return requestedBonusRoute ?? string.Empty;
            }

            return string.IsNullOrWhiteSpace(requestedBonusRoute) ? State.campaign.bonusRouteId : requestedBonusRoute;
        }

        public SessionContext GetCurrentSession()
        {
            if (State == null)
            {
                return SessionContext.Empty;
            }

            return new SessionContext
            {
                world = State.campaign.world,
                stage = State.campaign.stage,
                bonusRouteId = State.campaign.bonusRouteId,
            };
        }

        public void UpdateActiveRoute(int world, int stage, string bonusRouteId = "", bool fromMaintenance = false)
        {
            InitializeIfNeeded();
            State.campaign.world = Mathf.Clamp(world, 1, worldCount);
            State.campaign.stage = Mathf.Clamp(stage, 1, levelsPerWorld);
            State.campaign.bonusRouteId = bonusRouteId ?? string.Empty;
            State.activeRouteKey = State.campaign.LevelKey;
            UnitySaveStore.SaveAutosave(State);
            OnProfileUpdated?.Invoke(State.campaign);
        }

        public void MarkLevelComplete(int stageStars, int bonusCoins, int bonusScore, float runSeconds, int deaths)
        {
            InitializeIfNeeded();
            if (State?.campaign == null)
            {
                return;
            }

            string levelKey = State.campaign.LevelKey;
            if (!State.campaign.completedLevels.Contains(levelKey))
            {
                State.campaign.completedLevels.Add(levelKey);
            }

            EnsureNextWorldRouteUnlocked();

            State.runStats.coins += bonusCoins;
            State.runStats.stars += stageStars;
            State.runStats.score += bonusScore;
            State.runStats.timeSeconds += Mathf.Max(0f, runSeconds);
            State.runStats.deaths += deaths;

            UnitySaveStore.SaveHard(State);
            OnProfileUpdated?.Invoke(State.campaign);
        }

        public void MarkMaintenanceRouteVisited(int world, int stage, bool maintenanceOpen)
        {
            UpdateActiveRoute(world, stage, maintenanceOpen ? "maintenance" : string.Empty, true);
        }

        public void RegisterCollectible(int fileCount, string worldId)
        {
            InitializeIfNeeded();
            State.collectibles.files += fileCount;

            var bucket = State.collectibles.filesByWorld.Find(item => string.Equals(item.world, worldId, StringComparison.OrdinalIgnoreCase));
            if (bucket == null)
            {
                bucket = new UnityCollectibleWorldCounter { world = worldId ?? "w0" };
                State.collectibles.filesByWorld.Add(bucket);
            }

            bucket.filesCollected += fileCount;
            UnitySaveStore.SaveAutosave(State);
        }

        private void NormalizeProfile()
        {
            if (State == null)
            {
                State = UnitySaveStore.NewFresh();
            }

            State.campaign ??= new UnityCampaignProfile();
            State.runStats ??= new UnityRunStats();
            State.unlockState ??= new UnityUnlockState();
            State.playerSettings ??= new UnityPlayerSettings();
            State.collectibles ??= new UnityCollectibleState();

            if (State.campaign.world < 1)
            {
                State.campaign.world = 1;
            }

            if (State.campaign.stage < 1)
            {
                State.campaign.stage = 1;
            }
        }

        private void EnsureNextWorldRouteUnlocked()
        {
            int currentWorld = State.campaign.world;
            int currentStage = State.campaign.stage;
            string completed = GetLevelKey(currentWorld, currentStage);
            if (!State.campaign.completedLevels.Contains(completed))
            {
                State.campaign.completedLevels.Add(completed);
            }

            if (!State.campaign.unlockedLevels.Contains(completed))
            {
                State.campaign.unlockedLevels.Add(completed);
            }

            if (currentStage < levelsPerWorld)
            {
                string next = GetLevelKey(currentWorld, currentStage + 1);
                if (!State.campaign.unlockedLevels.Contains(next))
                {
                    State.campaign.unlockedLevels.Add(next);
                }
                State.campaign.stage = currentStage + 1;
            }
            else if (currentWorld < worldCount)
            {
                string next = GetLevelKey(currentWorld + 1, 1);
                if (!State.campaign.unlockedLevels.Contains(next))
                {
                    State.campaign.unlockedLevels.Add(next);
                }

                State.campaign.world = currentWorld + 1;
                State.campaign.stage = 1;
            }
            else
            {
                State.campaign.stage = Mathf.Min(currentStage, levelsPerWorld);
                State.campaign.world = worldCount;
            }
        }

        private string GetLevelKey(int world, int stage)
        {
            return $"w{Mathf.Clamp(world, 1, worldCount)}_l{Mathf.Clamp(stage, 1, levelsPerWorld)}";
        }
    }
}
