using System;
using Superbart.Combat;
using Superbart.Campaign;
using Superbart.Save;
using UnityEngine;
using UnityEngine.SceneManagement;

namespace Superbart.Runtime
{
    public sealed class Bootstrapper : MonoBehaviour
    {
        [Header("Root Services")]
        [SerializeField] private RuntimeRegistry runtimeRegistry;
        [SerializeField] private SceneRouter sceneRouter;
        [SerializeField] private CampaignManager campaignManager;
        [SerializeField] private LevelFlowController levelFlowController;

        [Header("Startup")]
        [Tooltip("Force load the canonical main menu immediately when boot scene is open.")]
        [SerializeField] private bool forceMainMenuOnBoot = true;
        [Tooltip("Whether campaign warmup should auto-create a default profile before first route.")]
        [SerializeField] private bool autoCreateProfiles = true;

        private UnitySaveState saveState;

        private void Start()
        {
            EnsureCoreServices();
            LoadOrCreateSave();
            InitializeCampaign();
            InitializeFlow();

            PublishStartupTelemetry();
            PerformStartupRouting();
        }

        private void EnsureCoreServices()
        {
            if (runtimeRegistry == null)
            {
                runtimeRegistry = FindObjectOfType<RuntimeRegistry>();
                if (runtimeRegistry == null)
                {
                    var host = new GameObject("RuntimeRegistry");
                    runtimeRegistry = host.AddComponent<RuntimeRegistry>();
                    DontDestroyOnLoad(host);
                }
            }

            if (sceneRouter == null)
            {
                sceneRouter = FindObjectOfType<SceneRouter>();
                if (sceneRouter == null)
                {
                    sceneRouter = gameObject.AddComponent<SceneRouter>();
                }
            }

            if (campaignManager == null)
            {
                campaignManager = FindObjectOfType<CampaignManager>();
                if (campaignManager == null)
                {
                    var host = new GameObject("CampaignManager");
                    campaignManager = host.AddComponent<CampaignManager>();
                    DontDestroyOnLoad(host);
                }
            }

            if (levelFlowController == null)
            {
                levelFlowController = FindObjectOfType<LevelFlowController>();
                if (levelFlowController == null)
                {
                    var host = new GameObject("LevelFlowController");
                    levelFlowController = host.AddComponent<LevelFlowController>();
                    DontDestroyOnLoad(host);
                }
            }
        }

        private void LoadOrCreateSave()
        {
            saveState = UnitySaveStore.LoadOrCreate();
            if (autoCreateProfiles && saveState?.campaign != null && saveState.campaign.world <= 0)
            {
                saveState.campaign.world = 1;
            }
        }

        private void InitializeCampaign()
        {
            if (campaignManager == null)
            {
                return;
            }

            campaignManager.Initialize(saveState);
        }

        private void InitializeFlow()
        {
            if (levelFlowController != null)
            {
                levelFlowController.Initialize(campaignManager, sceneRouter, runtimeRegistry);
            }
        }

        private void PublishStartupTelemetry()
        {
            if (runtimeRegistry != null)
            {
                var launchEvent = new CombatEventData
                {
                    EventType = "bootstrap",
                    EntityType = "system",
                    LevelKey = saveState?.campaign != null ? saveState.campaign.LevelKey : "boot",
                    Message = "bootstrap-start",
                };
                runtimeRegistry.CombatEvents?.EmitRunStarted(launchEvent);
            }
        }

        private void PerformStartupRouting()
        {
            if (!forceMainMenuOnBoot)
            {
                return;
            }

            var active = SceneManager.GetActiveScene().name;
            if (!string.Equals(active, "Boot", StringComparison.OrdinalIgnoreCase))
            {
                return;
            }

            var start = new SessionContext
            {
                world = saveState?.campaign != null ? saveState.campaign.world : 1,
                stage = saveState?.campaign != null ? saveState.campaign.stage : 1,
                fromMenu = true,
            };
            sceneRouter?.RouteToMainMenu(start);
        }
    }
}

