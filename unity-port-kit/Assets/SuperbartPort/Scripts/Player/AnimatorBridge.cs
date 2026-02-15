using UnityEngine;

namespace Superbart.Player
{
    /// <summary>
    /// Maps PlayerMotor2D.LastMotionHint to Animator parameters each frame.
    /// Attach to the same GameObject as PlayerMotor2D with an Animator component.
    ///
    /// Expected Animator parameters:
    ///   - MotionState (int): 0=Air, 1=Walk, 2=Run, 3=Skid
    ///   - SpeedX (float): absolute horizontal speed in Phaser px/sec
    ///   - IsGrounded (bool): whether the player is on the ground
    ///   - VelocityY (float): vertical velocity (Unity convention: positive = up)
    /// </summary>
    [RequireComponent(typeof(PlayerMotor2D))]
    public sealed class AnimatorBridge : MonoBehaviour
    {
        private PlayerMotor2D motor;
        private Animator animator;
        private Rigidbody2D rb;

        // Cached parameter hashes for performance
        private static readonly int MotionStateHash = Animator.StringToHash("MotionState");
        private static readonly int SpeedXHash = Animator.StringToHash("SpeedX");
        private static readonly int IsGroundedHash = Animator.StringToHash("IsGrounded");
        private static readonly int VelocityYHash = Animator.StringToHash("VelocityY");

        private void Awake()
        {
            motor = GetComponent<PlayerMotor2D>();
            animator = GetComponentInChildren<Animator>();
            rb = GetComponent<Rigidbody2D>();
        }

        private void LateUpdate()
        {
            if (animator == null || motor == null) return;

            int motionState = motor.LastMotionHint switch
            {
                MotionHint.Air => 0,
                MotionHint.Walk => 1,
                MotionHint.Run => 2,
                MotionHint.Skid => 3,
                _ => 0,
            };

            animator.SetInteger(MotionStateHash, motionState);
            animator.SetBool(IsGroundedHash, motor.IsGrounded);

            if (rb != null)
            {
                float absSpeedX = Mathf.Abs(rb.velocity.x) * Core.GameConstants.PixelsPerUnit;
                animator.SetFloat(SpeedXHash, absSpeedX);
                animator.SetFloat(VelocityYHash, rb.velocity.y);
            }

            // Flip sprite based on movement direction
            if (rb != null && Mathf.Abs(rb.velocity.x) > 0.01f)
            {
                Vector3 scale = transform.localScale;
                scale.x = rb.velocity.x < 0 ? -Mathf.Abs(scale.x) : Mathf.Abs(scale.x);
                transform.localScale = scale;
            }
        }
    }
}
