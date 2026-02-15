using UnityEngine;
using Superbart.Combat;

namespace Superbart.Runtime
{
    public sealed class RuntimeRegistry : MonoBehaviour
    {
        [Header("Drop-in services")]
        [Tooltip("Optional enemy spawn service.")]
        [SerializeField] private MonoBehaviour enemyFactorySource;

        [Tooltip("Optional collectible side-effect service.")]
        [SerializeField] private MonoBehaviour collectibleEffectSource;

        [Tooltip("Optional audio service (SFX/music bus).")]
        [SerializeField] private MonoBehaviour audioChannelBusSource;

        [Tooltip("Optional HUD presenter.")]
        [SerializeField] private MonoBehaviour hudPresenterSource;

        [Header("Debug")]
        public bool keepUnknownEntityTelemetry = true;

        public IEnemyFactory EnemyFactory { get; private set; }
        public ICollectibleEffect CollectibleEffect { get; private set; }
        public IAudioChannelBus AudioBus { get; private set; }
        public IHudPresenter HudPresenter { get; private set; }
        public CombatEventBus CombatEvents { get; private set; } = new CombatEventBus();

        private void Awake()
        {
            RegisterDefaults();
        }

        private void RegisterDefaults()
        {
            EnemyFactory = ResolveInterface(enemyFactorySource, new NullEnemyFactory());
            CollectibleEffect = ResolveInterface(collectibleEffectSource, new NullCollectibleEffect());
            AudioBus = ResolveInterface(audioChannelBusSource, new NullAudioChannelBus());
            HudPresenter = ResolveInterface(hudPresenterSource, new NullHudPresenter());
        }

        public void Register(ServiceSpec spec)
        {
            switch (spec)
            {
                case ServiceSpec.EnemyFactory:
                    EnemyFactory = ResolveInterface(enemyFactorySource, EnemyFactory);
                    break;
                case ServiceSpec.CollectibleEffect:
                    CollectibleEffect = ResolveInterface(collectibleEffectSource, CollectibleEffect);
                    break;
                case ServiceSpec.Audio:
                    AudioBus = ResolveInterface(audioChannelBusSource, AudioBus);
                    break;
                case ServiceSpec.Hud:
                    HudPresenter = ResolveInterface(hudPresenterSource, HudPresenter);
                    break;
            }
        }

        private static T ResolveInterface<T>(Object source, T fallback) where T : class
        {
            if (source == null)
            {
                return fallback;
            }

            if (source is T impl)
            {
                return impl;
            }

            return fallback;
        }

        public enum ServiceSpec
        {
            EnemyFactory,
            CollectibleEffect,
            Audio,
            Hud,
        }
    }

    public sealed class NullEnemyFactory : IEnemyFactory
    {
        public GameObject Spawn(string enemyType, Vector3 worldPosition, object data, Transform parent)
        {
            var placeholder = GameObject.CreatePrimitive(PrimitiveType.Capsule);
            placeholder.name = $"FallbackEnemy::{enemyType}";
            placeholder.transform.position = worldPosition;
            if (parent != null)
            {
                placeholder.transform.SetParent(parent);
            }

            return placeholder;
        }
    }

    public sealed class NullCollectibleEffect : ICollectibleEffect
    {
        public void OnCollectibleSpawned(string collectibleType, GameObject instance)
        {
            if (instance != null)
            {
                instance.name = $"Collectible::{collectibleType}";
            }
        }

        public void OnCollectiblePicked(string collectibleType, GameObject instance)
        {
            if (instance != null)
            {
                Object.Destroy(instance);
            }
        }
    }

    public sealed class NullAudioChannelBus : IAudioChannelBus
    {
        public void DuckMusic(float duckVolume, float durationSeconds)
        {
        }

        public void PlayMusic(string musicId, float volume = 1f, bool loop = true)
        {
        }

        public void PlaySfx(string sfxId, float volume = 1f)
        {
        }

        public void SetMasterVolume(float volume)
        {
        }

        public void SetMusicVolume(float volume)
        {
        }

        public void SetSfxVolume(float volume)
        {
        }

        public void StopMusic(float fadeSeconds = 0.2f)
        {
        }
    }

    public sealed class NullHudPresenter : IHudPresenter
    {
        public void HidePopup()
        {
        }

        public void SetBonusRoute(string bonusRouteId)
        {
            Debug.Log($"[RuntimeRegistry] Bonus route active: {bonusRouteId}");
        }

        public void SetMaintenanceRoute(bool active)
        {
            Debug.Log($"[RuntimeRegistry] Maintenance route active: {active}");
        }

        public void SetRunStats(int coins, int stars, int score, int deaths, float timeSeconds)
        {
            Debug.Log($"[RuntimeRegistry] Run Stats => Coins:{coins} Stars:{stars} Score:{score} Deaths:{deaths} Time:{timeSeconds:0.00}");
        }

        public void ShowPopup(string message, float durationSeconds = 2f)
        {
            Debug.Log($"[RuntimeRegistry] HUD popup ({durationSeconds:0.00}s): {message}");
        }
    }
}

