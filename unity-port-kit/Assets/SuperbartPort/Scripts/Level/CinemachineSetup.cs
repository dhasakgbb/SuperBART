using UnityEngine;

namespace Superbart.Level
{
    /// <summary>
    /// Configures a Cinemachine Virtual Camera for platformer follow behavior.
    /// Attach to the same GameObject as CinemachineVirtualCamera.
    ///
    /// This component auto-configures the camera on Awake when Cinemachine is available.
    /// If Cinemachine is not installed, it falls back to a simple transform follow.
    /// </summary>
    public sealed class CinemachineSetup : MonoBehaviour
    {
        [Header("Follow Target")]
        [Tooltip("The player transform to follow. Auto-finds PlayerMotor2D if not set.")]
        public Transform followTarget;

        [Header("Camera Settings")]
        [Tooltip("Horizontal lookahead time in seconds.")]
        public float lookaheadTime = 0.3f;
        [Tooltip("Lookahead smoothing factor.")]
        public float lookaheadSmoothing = 5f;
        [Tooltip("Horizontal damping.")]
        public float xDamping = 0.5f;
        [Tooltip("Vertical damping.")]
        public float yDamping = 0.3f;

        [Header("Dead Zone")]
        [Tooltip("Dead zone width (0-1, fraction of screen).")]
        public float deadZoneWidth = 0.15f;
        [Tooltip("Dead zone height (0-1, fraction of screen).")]
        public float deadZoneHeight = 0.1f;

        [Header("Screen Offset")]
        [Tooltip("Vertical screen offset (positive = look ahead downward).")]
        public float screenY = 0.35f;

        [Header("Screen Shake")]
        [Tooltip("Maximum shake strength in units.")]
        public float screenShakeStrength = 0.16f;
        [Tooltip("Maximum random jitter per axis while shaking.")]
        public float screenShakeJitter = 0.04f;
        [Tooltip("Shake recovery speed multiplier.")]
        public float screenShakeRecover = 24f;

        [Header("Fallback (no Cinemachine)")]
        [Tooltip("Smooth follow speed when Cinemachine is not installed.")]
        public float fallbackSmoothSpeed = 8f;
        [Tooltip("Vertical offset for the camera.")]
        public float fallbackOffsetY = 2f;
        [Tooltip("Horizontal lookahead distance.")]
        public float fallbackLookaheadX = 1.5f;

        private bool usingCinemachine;
        private Camera mainCamera;
        private float shakeRemaining;
        private Vector3 shakeOffset;

        public void TriggerShake(float strength, float duration)
        {
            screenShakeStrength = Mathf.Max(0.01f, strength);
            shakeRemaining = Mathf.Max(shakeRemaining, Mathf.Max(0.01f, duration));
            shakeOffset = Vector3.zero;
        }

        private void Awake()
        {
            if (followTarget == null)
            {
                var motor = FindObjectOfType<Player.PlayerMotor2D>();
                if (motor != null) followTarget = motor.transform;
            }

            usingCinemachine = TryConfigureCinemachine();

            if (!usingCinemachine)
            {
                mainCamera = Camera.main;
                Debug.Log("CinemachineSetup: Cinemachine not found, using fallback follow camera.");
            }
        }

        private bool TryConfigureCinemachine()
        {
#if CINEMACHINE_AVAILABLE
            var vcam = GetComponent<Cinemachine.CinemachineVirtualCamera>();
            if (vcam == null) return false;

            vcam.Follow = followTarget;

            var framingTransposer = vcam.GetCinemachineComponent<Cinemachine.CinemachineFramingTransposer>();
            if (framingTransposer == null)
            {
                vcam.AddCinemachineComponent<Cinemachine.CinemachineFramingTransposer>();
                framingTransposer = vcam.GetCinemachineComponent<Cinemachine.CinemachineFramingTransposer>();
            }

            if (framingTransposer != null)
            {
                framingTransposer.m_LookaheadTime = lookaheadTime;
                framingTransposer.m_LookaheadSmoothing = lookaheadSmoothing;
                framingTransposer.m_XDamping = xDamping;
                framingTransposer.m_YDamping = yDamping;
                framingTransposer.m_DeadZoneWidth = deadZoneWidth;
                framingTransposer.m_DeadZoneHeight = deadZoneHeight;
                framingTransposer.m_ScreenY = screenY;
            }

            return true;
#else
            return false;
#endif
        }

        private void LateUpdate()
        {
            if (usingCinemachine || followTarget == null || mainCamera == null) return;

            // Simple smooth follow fallback
            Vector3 targetPos = followTarget.position;
            targetPos.y += fallbackOffsetY;
            targetPos.z = mainCamera.transform.position.z;

            // Add horizontal lookahead based on velocity
            var rb = followTarget.GetComponent<Rigidbody2D>();
            if (rb != null)
            {
                targetPos.x += Mathf.Sign(rb.velocity.x) * fallbackLookaheadX;
            }

            mainCamera.transform.position = Vector3.Lerp(
                mainCamera.transform.position,
                targetPos,
                fallbackSmoothSpeed * Time.deltaTime
            );

            UpdateShake();
        }

        private void UpdateShake()
        {
            if (shakeRemaining <= 0f)
            {
                if (shakeOffset != Vector3.zero)
                {
                    mainCamera.transform.position -= shakeOffset;
                    shakeOffset = Vector3.zero;
                }
                return;
            }

            shakeRemaining -= Time.deltaTime;
            float t = Mathf.Clamp01(shakeRemaining * screenShakeRecover * 0.1f);
            Vector3 offset = new Vector3(
                Random.Range(-screenShakeJitter, screenShakeJitter),
                Random.Range(-screenShakeJitter, screenShakeJitter),
                0f
            ) * (screenShakeStrength * t);

            Vector3 delta = offset - shakeOffset;
            mainCamera.transform.position += delta;
            shakeOffset = offset;
        }
    }
}
