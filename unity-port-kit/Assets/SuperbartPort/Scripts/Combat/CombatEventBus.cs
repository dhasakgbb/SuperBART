using System;
using UnityEngine;

namespace Superbart.Combat
{
    [Serializable]
    public sealed class CombatEventData
    {
        public string EventType;
        public string EntityType;
        public string EntityId;
        public string WorldKey;
        public string RouteId;
        public string LevelKey;
        public float WorldX;
        public float WorldY;
        public int Value;
        public string Message;
        public float TimestampSeconds;

        public CombatEventData()
        {
            TimestampSeconds = Time.time;
        }
    }

    public sealed class CombatEventBus
    {
        public event Action<CombatEventData> PlayerDamaged;
        public event Action<CombatEventData> EnemyKilled;
        public event Action<CombatEventData> CollectiblePicked;
        public event Action<CombatEventData> GoalReached;
        public event Action<CombatEventData> CheckpointReached;
        public event Action<CombatEventData> RunFailed;
        public event Action<CombatEventData> RunStarted;

        public void EmitPlayerDamaged(CombatEventData payload)
        {
            PlayerDamaged?.Invoke(payload);
        }

        public void EmitEnemyKilled(CombatEventData payload)
        {
            EnemyKilled?.Invoke(payload);
        }

        public void EmitCollectiblePicked(CombatEventData payload)
        {
            CollectiblePicked?.Invoke(payload);
        }

        public void EmitGoalReached(CombatEventData payload)
        {
            GoalReached?.Invoke(payload);
        }

        public void EmitCheckpointReached(CombatEventData payload)
        {
            CheckpointReached?.Invoke(payload);
        }

        public void EmitRunFailed(CombatEventData payload)
        {
            RunFailed?.Invoke(payload);
        }

        public void EmitRunStarted(CombatEventData payload)
        {
            RunStarted?.Invoke(payload);
        }
    }
}

