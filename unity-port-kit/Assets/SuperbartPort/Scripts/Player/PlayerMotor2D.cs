using UnityEngine;
using Superbart.Core;
using Superbart.Level;

namespace Superbart.Player
{
    [RequireComponent(typeof(Rigidbody2D))]
    public class PlayerMotor2D : MonoBehaviour
    {
        [Header("Grounding")]
        [SerializeField] private Transform groundCheck;
        [SerializeField] private float groundCheckRadiusUnits = 0.10f;
        [SerializeField] private LayerMask groundMask;

        public Transform GroundCheck
        {
            get => groundCheck;
            set => groundCheck = value;
        }

        public float GroundCheckRadiusUnits
        {
            get => groundCheckRadiusUnits;
            set => groundCheckRadiusUnits = value;
        }

        public LayerMask GroundMask
        {
            get => groundMask;
            set => groundMask = value;
        }

        [Header("World Modifiers")]
        public WorldModifiers worldModifiers = WorldModifiers.Default;

        public MotionHint LastMotionHint { get; private set; } = MotionHint.Air;
        public bool IsGrounded { get; private set; }

        private Rigidbody2D rb;
        private FeelState feel;

        // Input snapshot (captured in Update, consumed in FixedUpdate)
        private int inputX;
        private bool runHeld;
        private bool jumpHeld;
        private bool jumpPressedEdge;

        private void Awake()
        {
            rb = GetComponent<Rigidbody2D>();
            rb.gravityScale = 0f; // we apply gravity ourselves (ported constants)
            rb.freezeRotation = true;
            feel = FeelState.Create();
        }

        private void Update()
        {
            // Input: prefer Input System if enabled, fallback otherwise.
#if ENABLE_INPUT_SYSTEM
            var kb = UnityEngine.InputSystem.Keyboard.current;
            if (kb != null)
            {
                int x = 0;
                if (kb.aKey.isPressed || kb.leftArrowKey.isPressed) x -= 1;
                if (kb.dKey.isPressed || kb.rightArrowKey.isPressed) x += 1;
                inputX = Mathf.Clamp(x, -1, 1);

                runHeld = kb.leftShiftKey.isPressed || kb.rightShiftKey.isPressed;

                bool jumpNow = kb.spaceKey.isPressed || kb.wKey.isPressed || kb.upArrowKey.isPressed;
                jumpPressedEdge = jumpNow && !jumpHeld;
                jumpHeld = jumpNow;
                return;
            }
#endif
            // Legacy Input Manager fallback
            float axis = Input.GetAxisRaw("Horizontal");
            inputX = axis < -0.1f ? -1 : (axis > 0.1f ? 1 : 0);

            runHeld = Input.GetKey(KeyCode.LeftShift) || Input.GetKey(KeyCode.RightShift);

            bool jumpNowLegacy = Input.GetKey(KeyCode.Space) || Input.GetKey(KeyCode.W) || Input.GetKey(KeyCode.UpArrow);
            jumpPressedEdge = jumpNowLegacy && !jumpHeld;
            jumpHeld = jumpNowLegacy;
        }

        private void FixedUpdate()
        {
            Collider2D groundedCollider = CheckGroundedCollider();
            IsGrounded = groundedCollider != null;

            Vector2 platformDelta = Vector2.zero;
            if (IsGrounded && groundedCollider != null)
            {
                MovingPlatformMotor motor = groundedCollider.GetComponentInParent<MovingPlatformMotor>();
                if (motor != null)
                {
                    platformDelta = motor.LastDeltaUnits;
                }
            }

            // Convert Unity velocity -> Phaser coordinate velocity (y down positive)
            float vxPx = rb.velocity.x * GameConstants.PixelsPerUnit;
            float vyPx = -rb.velocity.y * GameConstants.PixelsPerUnit;

            var stepIn = new MovementStepInput
            {
                dtMs = Time.fixedDeltaTime * 1000f,
                vx = vxPx,
                vy = vyPx,
                inputX = inputX,
                jumpPressed = jumpPressedEdge,
                jumpHeld = jumpHeld,
                runHeld = runHeld,
                onGround = IsGrounded,
                feel = feel,
                modifiers = worldModifiers,
            };

            var stepOut = MovementModel.Step(stepIn);
            feel = stepOut.feel;
            LastMotionHint = stepOut.motionHint;

            // Consume edge-trigger.
            jumpPressedEdge = false;

            // Convert back to Unity velocity
            float vxUnits = stepOut.vx / GameConstants.PixelsPerUnit;
            float vyUnits = -stepOut.vy / GameConstants.PixelsPerUnit;

            rb.velocity = new Vector2(vxUnits, vyUnits);

            // Moving platform carry: apply platform translation when grounded on it.
            if (platformDelta != Vector2.zero)
            {
                rb.position += platformDelta;
            }
        }

        private Collider2D CheckGroundedCollider()
        {
            if (groundCheck == null)
            {
                // Fallback: ground check at feet
                Vector2 pos = transform.position;
                return Physics2D.OverlapCircle(pos + Vector2.down * 0.5f, groundCheckRadiusUnits, groundMask);
            }

            return Physics2D.OverlapCircle(groundCheck.position, groundCheckRadiusUnits, groundMask);
        }

#if UNITY_EDITOR
        private void OnDrawGizmosSelected()
        {
            Gizmos.color = Color.yellow;
            Vector3 p = groundCheck != null ? groundCheck.position : (transform.position + Vector3.down * 0.5f);
            Gizmos.DrawWireSphere(p, groundCheckRadiusUnits);
        }
#endif
    }
}
