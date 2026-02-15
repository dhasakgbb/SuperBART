using Superbart.Combat;
using UnityEngine;

namespace Superbart.Audio
{
    [DisallowMultipleComponent]
    public sealed class AudioBus : MonoBehaviour, IAudioChannelBus
    {
        [Header("Audio Sources")]
        [SerializeField] private AudioSource musicSource;
        [SerializeField] private AudioSource sfxSource;

        [Header("Duck Behavior")]
        [SerializeField] private float duckRecoverSeconds = 0.5f;
        [SerializeField] private float duckSfxVolume = 0.65f;

        private float musicDuckTarget;
        private float sfxDuckTarget;
        private float fadeStartTime = -1f;
        private float fadeFromMusic;
        private float fadeFromSfx;

        private float currentDuck;

        private void Awake()
        {
            if (musicSource == null)
            {
                musicSource = gameObject.AddComponent<AudioSource>();
                musicSource.playOnAwake = false;
            }

            if (sfxSource == null)
            {
                sfxSource = gameObject.AddComponent<AudioSource>();
                sfxSource.playOnAwake = false;
            }
        }

        private void Update()
        {
            if (fadeStartTime < 0f)
            {
                return;
            }

            float elapsed = Time.unscaledTime - fadeStartTime;
            float t = Mathf.Clamp01(duckRecoverSeconds <= 0f ? 1f : elapsed / duckRecoverSeconds);
            currentDuck = Mathf.Lerp(currentDuck, 0f, t);

            if (t >= 1f)
            {
                fadeStartTime = -1f;
                musicSource.volume = fadeFromMusic;
                sfxSource.volume = fadeFromSfx;
                return;
            }

            float targetMusic = Mathf.Lerp(musicDuckTarget, fadeFromMusic, t);
            float targetSfx = Mathf.Lerp(duckSfxVolume, fadeFromSfx, t);
            musicSource.volume = targetMusic;
            sfxSource.volume = targetSfx;
        }

        public void PlaySfx(string sfxId, float volume = 1f)
        {
            if (string.IsNullOrWhiteSpace(sfxId) || sfxSource == null)
            {
                return;
            }

            // Keep this deterministic and resilient: if no clip mapping exists, no-op.
            string resourcePath = $"Audio/SFX/{sfxId}";
            var clip = Resources.Load<AudioClip>(resourcePath);
            if (clip == null)
            {
                return;
            }

            sfxSource.PlayOneShot(clip, volume);
        }

        public void PlayMusic(string musicId, float volume = 1f, bool loop = true)
        {
            if (string.IsNullOrWhiteSpace(musicId) || musicSource == null)
            {
                return;
            }

            string resourcePath = $"Audio/Music/{musicId}";
            var clip = Resources.Load<AudioClip>(resourcePath);
            if (clip == null)
            {
                return;
            }

            musicSource.clip = clip;
            musicSource.loop = loop;
            musicSource.volume = volume;
            musicSource.Play();
        }

        public void StopMusic(float fadeSeconds = 0.2f)
        {
            if (musicSource == null || !musicSource.isPlaying)
            {
                return;
            }

            if (fadeSeconds <= 0f)
            {
                musicSource.Stop();
                return;
            }

            StartCoroutine(StopMusicAsync(fadeSeconds));
        }

        public void DuckMusic(float duckVolume, float durationSeconds)
        {
            if (musicSource == null || sfxSource == null)
            {
                return;
            }

            fadeFromMusic = musicSource.volume;
            fadeFromSfx = sfxSource.volume;
            musicDuckTarget = Mathf.Clamp01(duckVolume);
            currentDuck = 0f;
            fadeStartTime = Time.unscaledTime;
            musicSource.volume *= musicDuckTarget;
            sfxSource.volume *= duckSfxVolume;
        }

        public void SetMasterVolume(float volume)
        {
            volume = Mathf.Clamp01(volume);
            AudioListener.volume = volume;
        }

        public void SetMusicVolume(float volume)
        {
            musicSource.volume = Mathf.Clamp01(volume);
        }

        public void SetSfxVolume(float volume)
        {
            sfxSource.volume = Mathf.Clamp01(volume);
        }

        private System.Collections.IEnumerator StopMusicAsync(float fadeSeconds)
        {
            float start = musicSource.volume;
            float startTime = Time.unscaledTime;
            while (true)
            {
                float elapsed = Time.unscaledTime - startTime;
                float t = Mathf.Clamp01(fadeSeconds <= 0f ? 1f : elapsed / fadeSeconds);
                musicSource.volume = Mathf.Lerp(start, 0f, t);
                if (t >= 1f)
                {
                    musicSource.Stop();
                    musicSource.volume = start;
                    yield break;
                }

                yield return null;
            }
        }
    }
}

