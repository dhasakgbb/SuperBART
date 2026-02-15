using UnityEngine;

namespace Superbart.Level
{
    /// <summary>
    /// Toggles a one-way platform's collider on a visible/hidden cycle.
    /// Attach to a one-way platform GameObject with a Collider2D.
    /// </summary>
    public sealed class VanishPlatformBehaviour : MonoBehaviour
    {
        [Tooltip("Duration the platform is visible and solid (ms).")]
        public int visibleMs = 3000;

        [Tooltip("Duration the platform is hidden and non-solid (ms).")]
        public int hiddenMs = 1500;

        [Tooltip("Phase offset from the global cycle start (ms).")]
        public int phaseOffsetMs;

        private Collider2D platformCollider;
        private SpriteRenderer spriteRenderer;
        private float cycleTimeSeconds;
        private float visibleDurationSeconds;
        private float phaseOffsetSeconds;

        private void Awake()
        {
            platformCollider = GetComponent<Collider2D>();
            spriteRenderer = GetComponent<SpriteRenderer>();

            visibleDurationSeconds = visibleMs / 1000f;
            float hiddenDurationSeconds = hiddenMs / 1000f;
            cycleTimeSeconds = visibleDurationSeconds + hiddenDurationSeconds;
            phaseOffsetSeconds = phaseOffsetMs / 1000f;
        }

        private void Update()
        {
            if (cycleTimeSeconds <= 0f) return;

            float t = Mathf.Repeat(Time.time + phaseOffsetSeconds, cycleTimeSeconds);
            bool visible = t < visibleDurationSeconds;

            if (platformCollider != null)
            {
                platformCollider.enabled = visible;
            }

            if (spriteRenderer != null)
            {
                // Fade to semi-transparent before vanishing for visual feedback
                float fadeWindow = 0.3f;
                if (visible && t > visibleDurationSeconds - fadeWindow)
                {
                    float fadeProgress = (visibleDurationSeconds - t) / fadeWindow;
                    Color c = spriteRenderer.color;
                    c.a = Mathf.Lerp(0.3f, 1f, fadeProgress);
                    spriteRenderer.color = c;
                }
                else
                {
                    Color c = spriteRenderer.color;
                    c.a = visible ? 1f : 0f;
                    spriteRenderer.color = c;
                }
            }
        }
    }
}
