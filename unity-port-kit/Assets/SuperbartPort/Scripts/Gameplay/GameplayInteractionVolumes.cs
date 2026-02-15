using UnityEngine;
using Superbart.Combat;
using Superbart.Runtime;

namespace Superbart.Gameplay
{
    [DisallowMultipleComponent]
    public abstract class PlayerInteractionVolume : MonoBehaviour
    {
        [Header("Common Marker State")]
        [SerializeField] protected string entityType = "collectible";
        [SerializeField] protected string entityId = string.Empty;
        [SerializeField] protected string levelKey = "w1_l1";
        [SerializeField] protected string worldKey = "w1";
        [SerializeField] protected string routeId = string.Empty;
        [SerializeField] protected int value = 1;

        [Header("Trigger Behavior")]
        [SerializeField] private bool singleUse = true;
        [SerializeField] private float cooldownSeconds = 0.15f;
        [SerializeField] private float autoDisableDelay = 0.05f;

        private float nextTriggerAt;
        private float disabledAt;

        protected CombatEventBus EventBus { get; private set; }

        protected virtual void Awake()
        {
            EventBus = FindObjectOfType<RuntimeRegistry>()?.CombatEvents;
            EnsureTriggerCollider();
        }

        protected virtual void Update()
        {
            if (disabledAt > 0f && Time.unscaledTime >= disabledAt)
            {
                gameObject.SetActive(false);
                disabledAt = 0f;
            }
        }

        public virtual void ConfigureCommon(string type, string id, string level, string world, string route, int markerValue = 1, bool oneShot = true)
        {
            entityType = string.IsNullOrWhiteSpace(type) ? entityType : type;
            entityId = string.IsNullOrWhiteSpace(id) ? entityId : id;
            levelKey = string.IsNullOrWhiteSpace(level) ? levelKey : level;
            worldKey = string.IsNullOrWhiteSpace(world) ? worldKey : world;
            routeId = string.IsNullOrWhiteSpace(route) ? routeId : route;
            value = markerValue <= 0 ? 1 : markerValue;
            singleUse = oneShot;
        }

        protected virtual void OnTriggerEnter2D(Collider2D other)
        {
            if (Time.unscaledTime < nextTriggerAt)
            {
                return;
            }

            if (other == null || other.GetComponentInParent<Superbart.Player.PlayerMotor2D>() == null)
            {
                return;
            }

            Emit();
            nextTriggerAt = Time.unscaledTime + cooldownSeconds;

            if (singleUse)
            {
                disabledAt = Time.unscaledTime + autoDisableDelay;
            }
        }

        protected abstract void Emit();

        protected CombatEventData CreatePayload(string eventType)
        {
            return new CombatEventData
            {
                EventType = eventType,
                EntityType = entityType,
                EntityId = entityId,
                WorldKey = worldKey,
                RouteId = routeId,
                LevelKey = levelKey,
                WorldX = transform.position.x,
                WorldY = transform.position.y,
                Value = value,
            };
        }

        protected void ResetCooldownAndFire()
        {
            nextTriggerAt = 0f;
        }

        private void EnsureTriggerCollider()
        {
            var collider = GetComponent<Collider2D>();
            if (collider == null)
            {
                var box = gameObject.AddComponent<BoxCollider2D>();
                box.isTrigger = true;
                box.size = Vector2.one;
                return;
            }

            collider.isTrigger = true;
        }
    }

    public sealed class GoalTriggerVolume : PlayerInteractionVolume
    {
        public void Configure(string type, string id, string levelKey, string worldKey, string routeId)
        {
            ConfigureCommon(type, id, levelKey, worldKey, routeId);
        }

        protected override void Emit()
        {
            EventBus?.EmitGoalReached(CreatePayload("goal"));
        }
    }

    public sealed class CheckpointTriggerVolume : PlayerInteractionVolume
    {
        public void Configure(string type, string id, string levelKey, string worldKey, string routeId)
        {
            ConfigureCommon(type, id, levelKey, worldKey, routeId, markerValue: 0, oneShot: false);
        }

        protected override void Emit()
        {
            EventBus?.EmitCheckpointReached(CreatePayload("checkpoint"));
        }
    }

    public sealed class CollectibleTriggerVolume : PlayerInteractionVolume
    {
        public void Configure(string type, string id, string levelKey, string worldKey, string routeId, int rewardValue = 1)
        {
            ConfigureCommon(type, id, levelKey, worldKey, routeId, markerValue: rewardValue, oneShot: true);
        }

        protected override void Emit()
        {
            EventBus?.EmitCollectiblePicked(CreatePayload("collectible"));
        }
    }

    public sealed class HazardTriggerVolume : PlayerInteractionVolume
    {
        [Header("Hazard Payload")]
        [SerializeField] private int playerDamage = 1;
        [SerializeField] private bool restartOnTouch = true;

        public void Configure(string type, string id, string levelKey, string worldKey, string routeId)
        {
            ConfigureCommon(type, id, levelKey, worldKey, routeId, markerValue: playerDamage, oneShot: false);
        }

        public void SetHazardMode(int damage, bool oneShotMode)
        {
            playerDamage = Mathf.Max(1, damage);
            ConfigureCommon(entityType, entityId, levelKey, worldKey, routeId, markerValue: playerDamage, oneShot: oneShotMode);
        }

        protected override void Emit()
        {
            EventBus?.EmitPlayerDamaged(CreatePayload("hazard"));

            if (restartOnTouch)
            {
                EventBus?.EmitRunFailed(CreatePayload("run-failed"));
            }
        }
    }
}
