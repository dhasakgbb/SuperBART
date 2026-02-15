using System;
using System.Collections.Generic;

namespace Superbart.Save
{
    [Serializable]
    public sealed class UnitySaveState
    {
        public int version = UnitySaveStore.CurrentVersion;
        public long updatedAtMs;
        public string activeRouteKey = string.Empty;
        public string lastRunId = string.Empty;
        public UnityCampaignProfile campaign = new UnityCampaignProfile();
        public UnityRunStats runStats = new UnityRunStats();
        public UnityUnlockState unlockState = new UnityUnlockState();
        public UnityPlayerSettings playerSettings = new UnityPlayerSettings();
        public UnityCollectibleState collectibles = new UnityCollectibleState();
        public UnityCheckpointState checkpoint = new UnityCheckpointState();
        public string lastSaveType = "none";
    }

    [Serializable]
    public sealed class UnityCampaignProfile
    {
        public int world = 1;
        public int stage = 1;
        public string bonusRouteId = string.Empty;
        public List<string> unlockedLevels = new List<string>(capacity: 32);
        public List<string> completedLevels = new List<string>(capacity: 128);

        public string LevelKey => $"w{world}_l{stage}";

        public bool IsUnlocked(string levelKey)
        {
            return string.Equals(levelKey, "w1_l1", StringComparison.OrdinalIgnoreCase)
                || unlockedLevels.Contains(levelKey)
                || completedLevels.Contains(levelKey);
        }

        public void EnsureBaseline()
        {
            if (unlockedLevels == null)
            {
                unlockedLevels = new List<string>(capacity: 32);
            }
            if (completedLevels == null)
            {
                completedLevels = new List<string>(capacity: 128);
            }

            if (!unlockedLevels.Contains("w1_l1"))
            {
                unlockedLevels.Add("w1_l1");
            }
        }
    }

    [Serializable]
    public sealed class UnityRunStats
    {
        public int coins;
        public int stars;
        public int score;
        public float timeSeconds;
        public int deaths;
    }

    [Serializable]
    public sealed class UnityUnlockState
    {
        public bool doubleJump;
        public bool omegaLogs;
        public List<string> perks = new List<string>(capacity: 24);

        public void EnsureDefaults()
        {
            if (perks == null)
            {
                perks = new List<string>(capacity: 24);
            }
        }
    }

    [Serializable]
    public sealed class UnityPlayerSettings
    {
        public bool audioEnabled = true;
        public bool screenShakeEnabled = true;
        public bool uiEnabled = true;
        public float musicVolume = 0.9f;
        public float sfxVolume = 0.95f;
        public float masterVolume = 1f;
    }

    [Serializable]
    public sealed class UnityCollectibleState
    {
        public int files;
        public bool evalCompleted;
        public List<UnityCollectibleWorldCounter> filesByWorld = new List<UnityCollectibleWorldCounter>(capacity: 16);
    }

    [Serializable]
    public sealed class UnityCollectibleWorldCounter
    {
        public string world = string.Empty;
        public int filesCollected;
    }

    [Serializable]
    public sealed class UnityCheckpointState
    {
        public bool hasCheckpoint;
        public int world;
        public int stage;
        public string checkpointId = string.Empty;
        public float worldX;
        public float worldY;
        public long savedAtMs;
    }
}

