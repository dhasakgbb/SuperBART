using System;
using Superbart.Runtime;
using UnityEngine;

namespace Superbart.Save
{
    public static class UnitySaveStore
    {
        public const int CurrentVersion = 1;
        public const string PlayerPrefsKey = "super_bart_unity_save_v1";
        public const string EncryptedPlayerPrefsKey = "super_bart_unity_save_v1_enc";

        private static UnitySaveState cached;
        private static bool initialized;

        public static UnitySaveState LoadOrCreate()
        {
            if (initialized && cached != null)
            {
                return cached;
            }

            cached = Load();
            if (cached == null)
            {
                cached = NewFresh();
                Save(cached, "hard");
            }

            MigrateVersionIfNeeded(cached);
            EnsureCanonical(cached);
            initialized = true;
            return cached;
        }

        public static UnitySaveState Load()
        {
            try
            {
                if (!PlayerPrefs.HasKey(PlayerPrefsKey))
                {
                    return null;
                }

                string payload = PlayerPrefs.GetString(PlayerPrefsKey);
                if (string.IsNullOrWhiteSpace(payload))
                {
                    return null;
                }

                var parsed = JsonUtility.FromJson<UnitySaveState>(payload);
                MigrateVersionIfNeeded(parsed);
                return parsed;
            }
            catch (Exception ex)
            {
                Debug.LogWarning($"UnitySaveStore: failed to load save payload, starting fresh. {ex.Message}");
                return null;
            }
        }

        public static void Save(UnitySaveState state, string saveType = "autosave")
        {
            if (state == null)
            {
                return;
            }

            EnsureCanonical(state);
            state.updatedAtMs = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
            state.lastSaveType = string.IsNullOrWhiteSpace(saveType) ? "autosave" : saveType;

            string payload = JsonUtility.ToJson(state);
            PlayerPrefs.SetString(PlayerPrefsKey, payload);
            PlayerPrefs.Save();
            cached = state;
            initialized = true;
        }

        public static void SaveAutosave(UnitySaveState state)
        {
            if (state == null)
            {
                return;
            }

            state.lastSaveType = "autosave";
            Save(state, "autosave");
        }

        public static void SaveHard(UnitySaveState state)
        {
            if (state == null)
            {
                return;
            }

            state.lastSaveType = "hard";
            Save(state, "hard");
        }

        public static void SaveCheckpoint(UnitySaveState state, SessionContext context, Vector2 worldPosition = default)
        {
            if (state == null || context == null)
            {
                return;
            }

            state.checkpoint = new UnityCheckpointState
            {
                hasCheckpoint = true,
                world = context.world,
                stage = context.stage,
                checkpointId = context.LevelKey,
                worldX = worldPosition.x,
                worldY = worldPosition.y,
                savedAtMs = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds(),
            };

            state.lastSaveType = "checkpoint";
            Save(state, "checkpoint");
        }

        public static void Reset()
        {
            cached = null;
            initialized = false;
            PlayerPrefs.DeleteKey(PlayerPrefsKey);
            PlayerPrefs.DeleteKey(EncryptedPlayerPrefsKey);
            PlayerPrefs.Save();
        }

        public static bool HasAnySave()
        {
            return PlayerPrefs.HasKey(PlayerPrefsKey);
        }

        public static UnitySaveState NewFresh()
        {
            var fresh = new UnitySaveState
            {
                version = CurrentVersion,
                updatedAtMs = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds(),
                activeRouteKey = "w1_l1",
                lastRunId = Guid.NewGuid().ToString("N"),
            };
            EnsureCanonical(fresh);
            return fresh;
        }

        public static void EnsureCanonical(UnitySaveState state)
        {
            if (state == null)
            {
                return;
            }

            MigrateVersionIfNeeded(state);
            state.version = CurrentVersion;
            state.campaign ??= new UnityCampaignProfile();
            state.campaign.EnsureBaseline();
            state.runStats ??= new UnityRunStats();
            state.unlockState ??= new UnityUnlockState();
            state.unlockState.EnsureDefaults();
            state.playerSettings ??= new UnityPlayerSettings();
            state.collectibles ??= new UnityCollectibleState();
            state.checkpoint ??= new UnityCheckpointState();

            if (state.campaign.world < 1)
            {
                state.campaign.world = 1;
            }

            if (state.campaign.stage < 1)
            {
                state.campaign.stage = 1;
            }
        }

        private static void MigrateVersionIfNeeded(UnitySaveState state)
        {
            if (state == null)
            {
                return;
            }

            if (state.version == CurrentVersion)
            {
                return;
            }

            // Current migration surface is additive; old payload fields are safely dropped by
            // EnsureCanonical defaults and null-safe initialization.
            state.version = CurrentVersion;
        }
    }
}
