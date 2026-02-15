using UnityEngine;
using Superbart.Combat;
using Superbart.Runtime;

namespace Superbart.Hazards
{
    [DisallowMultipleComponent]
    public sealed class HazardVolume : MonoBehaviour
    {
        [Header("Hazard settings")]
        public string hazardType = "spike";
        public bool killOnTouch = true;
        public int damage = 1;
        public bool oneWayOnly;
        public float respawnHoldSeconds = 0.25f;
        [SerializeField] private bool killAndFail = true;
        [SerializeField] private float eventCooldownSeconds = 0.2f;

        private float nextEventAt;
        private CombatEventBus eventBus;

        private void Awake()
        {
            eventBus = FindObjectOfType<RuntimeRegistry>()?.CombatEvents;
        }

        private void OnEnable()
        {
            var collider = GetComponent<Collider2D>();
            if (collider != null && !collider.isTrigger)
            {
                collider.isTrigger = true;
            }
        }

        private bool CanEmit()
        {
            return Time.time >= nextEventAt;
        }

        public void SetHazardType(string value)
        {
            hazardType = value;
        }

        private void OnTriggerEnter2D(Collider2D other)
        {
            if (!killOnTouch)
            {
                return;
            }

            var player = other.GetComponentInParent<Superbart.Player.PlayerMotor2D>();
            if (player == null || !CanEmit())
            {
                return;
            }

            nextEventAt = Time.time + eventCooldownSeconds;
            var payload = new CombatEventData
            {
                EventType = "hazard",
                EntityType = hazardType,
                EntityId = name,
                LevelKey = SceneRouter.ActiveContext?.LevelKey,
                WorldX = transform.position.x,
                WorldY = transform.position.y,
                Value = damage,
            };
            eventBus?.EmitPlayerDamaged(payload);
            if (killAndFail)
            {
                eventBus?.EmitRunFailed(payload);
            }

            Debug.Log($"HazardVolume: {hazardType} hit player at {transform.position}");
        }
    }
}
