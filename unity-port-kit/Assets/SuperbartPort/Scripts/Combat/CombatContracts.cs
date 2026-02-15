using UnityEngine;

namespace Superbart.Combat
{
    public interface ICollectibleEffect
    {
        void OnCollectibleSpawned(string collectibleType, GameObject instance);
        void OnCollectiblePicked(string collectibleType, GameObject instance);
    }

    public interface IAudioChannelBus
    {
        void PlaySfx(string sfxId, float volume = 1f);
        void PlayMusic(string musicId, float volume = 1f, bool loop = true);
        void StopMusic(float fadeSeconds = 0.2f);
        void DuckMusic(float duckVolume, float durationSeconds);
        void SetMusicVolume(float volume);
        void SetSfxVolume(float volume);
        void SetMasterVolume(float volume);
    }

    public interface IHudPresenter
    {
        void SetRunStats(int coins, int stars, int score, int deaths, float timeSeconds);
        void SetBonusRoute(string bonusRouteId);
        void SetMaintenanceRoute(bool active);
        void ShowPopup(string message, float durationSeconds = 2f);
        void HidePopup();
    }

    public interface IEnemyFactory
    {
        GameObject Spawn(string enemyType, Vector3 worldPosition, object data, Transform parent);
    }

    public interface IDamageable
    {
        void ApplyDamage(int amount, GameObject source);
        bool IsAlive { get; }
        void Kill();
    }

    public interface IStompable
    {
        void OnStomp(GameObject stomper);
    }

    public interface IProjectile
    {
        void Fire(Vector2 direction, float speed);
        void SetDamage(int damage);
    }
}

