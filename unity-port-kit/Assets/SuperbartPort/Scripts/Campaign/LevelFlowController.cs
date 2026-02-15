using System;
using System.Text.RegularExpressions;
using Superbart.Combat;
using Superbart.Runtime;
using Superbart.Save;
using Superbart.Campaign;
using UnityEngine;

namespace Superbart.Campaign
{
    public sealed class LevelFlowController : MonoBehaviour
    {
        [SerializeField] private CampaignManager campaignManager;
        [SerializeField] private SceneRouter sceneRouter;
        [SerializeField] private RuntimeRegistry runtimeRegistry;

        private CombatEventBus combatBus;
        private CombatEventData lastRunSummary = new CombatEventData();

        private void OnEnable()
        {
            UnregisterEvents();
            if (runtimeRegistry != null && runtimeRegistry.CombatEvents != null)
            {
                combatBus = runtimeRegistry.CombatEvents;
                combatBus.GoalReached += OnGoalReached;
                combatBus.CheckpointReached += OnCheckpointReached;
                combatBus.CollectiblePicked += OnCollectiblePicked;
                combatBus.RunFailed += OnRunFailed;
            }
        }

        private void OnDisable()
        {
            UnregisterEvents();
        }

        public void Initialize(CampaignManager manager, SceneRouter router, RuntimeRegistry registry)
        {
            if (manager != null)
            {
                campaignManager = manager;
            }

            if (router != null)
            {
                sceneRouter = router;
            }

            if (registry != null)
            {
                runtimeRegistry = registry;
            }

            UnregisterEvents();
            if (runtimeRegistry != null && runtimeRegistry.CombatEvents != null)
            {
                combatBus = runtimeRegistry.CombatEvents;
                combatBus.GoalReached += OnGoalReached;
                combatBus.CheckpointReached += OnCheckpointReached;
                combatBus.CollectiblePicked += OnCollectiblePicked;
                combatBus.RunFailed += OnRunFailed;
            }
        }

        public void OpenMenu()
        {
            campaignManager?.InitializeIfNeeded();
            var context = campaignManager?.GetCurrentSession() ?? SessionContext.Empty;
            context.fromMenu = true;
            context.fromDeath = false;
            sceneRouter?.RouteToMainMenu(context);
        }

        public void OpenWorldMap()
        {
            campaignManager?.InitializeIfNeeded();
            var context = campaignManager?.GetCurrentSession() ?? SessionContext.Empty;
            context.fromMenu = false;
            context.fromDeath = false;
            sceneRouter?.RouteToWorldMap(context);
        }

        public void StartLevel(int world, int stage, string bonusRouteId = "")
        {
            campaignManager?.InitializeIfNeeded();
            if (campaignManager == null)
            {
                return;
            }

            var next = campaignManager.GetNextSession(world, stage, bonusRouteId);
            next.fromMenu = false;
            next.fromMaintenance = false;
            campaignManager.UpdateActiveRoute(next.world, next.stage, next.bonusRouteId, next.fromMaintenance);
            sceneRouter?.RouteToLevelPlay(next);
            Debug.Log($"LevelFlow: start {next.LevelKey} (bonus:{next.bonusRouteId})");
        }

        public void ContinueCurrentLevelFromCheckpoint()
        {
            var state = UnitySaveStore.LoadOrCreate();
            if (state?.checkpoint != null && state.checkpoint.hasCheckpoint)
            {
                var context = new SessionContext
                {
                    world = state.checkpoint.world,
                    stage = state.checkpoint.stage,
                    bonusRouteId = state.campaign?.bonusRouteId ?? string.Empty,
                    fromDeath = true,
                };
                sceneRouter?.RouteToLevelPlay(context);
            }
            else
            {
                OpenWorldMap();
            }
        }

        public void RequestResultScreen(bool clear)
        {
            var context = campaignManager?.GetCurrentSession() ?? SessionContext.Empty;
            context.fromMenu = false;
            if (clear)
            {
                context.fromDeath = false;
            }

            sceneRouter?.RouteToLevelResult(context);
        }

        private void OnGoalReached(CombatEventData obj)
        {
            lastRunSummary = obj;
            campaignManager?.InitializeIfNeeded();
            int stars = Mathf.Max(1, obj?.Value ?? 1);
            campaignManager?.MarkLevelComplete(stars, 0, 0, 0f, 0);
            RequestResultScreen(clear: true);
            runtimeRegistry?.HudPresenter?.ShowPopup($"Level complete: {obj.LevelKey ?? obj.WorldKey ?? \"unknown\"}", 2f);
        }

        private void OnCheckpointReached(CombatEventData obj)
        {
            campaignManager?.InitializeIfNeeded();
            var state = UnitySaveStore.LoadOrCreate();
            var checkpointContext = SceneRouter.ActiveContext != null ? SceneRouter.ActiveContext.Copy() : SessionContext.Empty;
            ApplyCheckpointEventState(state, checkpointContext, obj);
            ApplyCampaignCheckpointProgress(state, checkpointContext);
            UnitySaveStore.SaveCheckpoint(state, checkpointContext, new Vector2(obj?.WorldX ?? 0f, obj?.WorldY ?? 0f));
        }

        private static void ApplyCheckpointEventState(UnitySaveState state, SessionContext checkpointContext, CombatEventData obj)
        {
            checkpointContext.bonusRouteId = !string.IsNullOrWhiteSpace(obj?.RouteId)
                ? obj.RouteId
                : checkpointContext.bonusRouteId;

            if (state?.campaign != null && !string.IsNullOrWhiteSpace(checkpointContext.bonusRouteId))
            {
                state.campaign.bonusRouteId = checkpointContext.bonusRouteId;
            }

            var (eventWorld, eventStage) = ResolveLevelKey(obj?.WorldKey);
            if (eventWorld > 0)
            {
                checkpointContext.world = eventWorld;
            }

            if (eventStage > 0)
            {
                checkpointContext.stage = eventStage;
            }
            else if (checkpointContext.stage <= 0 && state?.campaign != null && state.campaign.stage > 0)
            {
                checkpointContext.stage = state.campaign.stage;
            }

            if (checkpointContext.world <= 0 && state?.campaign != null && state.campaign.world > 0)
            {
                checkpointContext.world = state.campaign.world;
            }
        }

        private static void ApplyCampaignCheckpointProgress(UnitySaveState state, SessionContext checkpointContext)
        {
            if (state?.campaign != null)
            {
                state.campaign.world = checkpointContext.world > 0 ? checkpointContext.world : state.campaign.world;
                state.campaign.stage = checkpointContext.stage > 0 ? checkpointContext.stage : state.campaign.stage;
                if (!string.IsNullOrWhiteSpace(checkpointContext.bonusRouteId))
                {
                    state.campaign.bonusRouteId = checkpointContext.bonusRouteId;
                }
            }
        }

        private void OnRunFailed(CombatEventData obj)
        {
            var state = UnitySaveStore.LoadOrCreate();
            if (state != null)
            {
                state.runStats.deaths += 1;
            }
            UnitySaveStore.SaveAutosave(state);

            campaignManager?.InitializeIfNeeded();
            var context = campaignManager.GetCurrentSession();
            context.fromDeath = true;
            RequestResultScreen(clear: false);
        }

        private void OnCollectiblePicked(CombatEventData obj)
        {
            campaignManager?.InitializeIfNeeded();
            int amount = Mathf.Max(1, obj?.Value ?? 1);
            string worldKey = ResolveWorldKeyFromEvent(obj?.WorldKey);
            campaignManager?.RegisterCollectible(amount, worldKey);
            runtimeRegistry?.HudPresenter?.ShowPopup($"Collected {obj?.EntityType ?? \"collectible\"}", 1.2f);
        }

        private void UnregisterEvents()
        {
            if (combatBus == null)
            {
                return;
            }

            combatBus.GoalReached -= OnGoalReached;
            combatBus.CheckpointReached -= OnCheckpointReached;
            combatBus.CollectiblePicked -= OnCollectiblePicked;
            combatBus.RunFailed -= OnRunFailed;
            combatBus = null;
        }

        private static string ResolveWorldKeyFromEvent(string rawWorldKey)
        {
            if (!string.IsNullOrWhiteSpace(rawWorldKey))
            {
                return NormalizeWorldToken(rawWorldKey);
            }

            var worldFromScene = SceneRouter.ActiveContext?.world;
            return worldFromScene > 0 ? $"w{worldFromScene}" : "w1";
        }

        private static string NormalizeWorldToken(string value)
        {
            var normalized = value?.Trim().ToLowerInvariant();
            if (string.IsNullOrWhiteSpace(normalized))
            {
                return "w1";
            }

            Match m = Regex.Match(normalized, @"w(\d+)");
            return m.Success ? $"w{m.Groups[1].Value}" : normalized;
        }

        private static (int world, int stage) ResolveLevelKey(string levelKey)
        {
            if (string.IsNullOrWhiteSpace(levelKey))
            {
                return (0, 0);
            }

            int world = 0;
            int stage = 0;

            Match worldMatch = Regex.Match(levelKey, @"w(\d+)", RegexOptions.IgnoreCase);
            if (worldMatch.Success && int.TryParse(worldMatch.Groups[1].Value, out var parsedWorld))
            {
                world = parsedWorld;
            }

            Match stageMatch = Regex.Match(levelKey, @"_l(\d+)", RegexOptions.IgnoreCase);
            if (stageMatch.Success && int.TryParse(stageMatch.Groups[1].Value, out var parsedStage))
            {
                stage = parsedStage;
            }

            return (world, stage);
        }
    }
}
