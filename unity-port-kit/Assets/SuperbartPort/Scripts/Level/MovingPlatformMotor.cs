using UnityEngine;
using Superbart.Core;

namespace Superbart.Level
{
    public sealed class MovingPlatformMotor : MonoBehaviour
    {
        // All values in Phaser pixels
        public float minXPx;
        public float maxXPx;
        public float speedPxPerSec = 60f;

        public Vector2 LastDeltaUnits { get; private set; }

        private float startXPx;
        private float yPx;
        private float t;
        private Vector3 lastPosition;

        private void Start()
        {
            // Capture start in Phaser pixel coordinates
            startXPx = GameConstants.UnitsToPx(transform.position.x);
            yPx = -GameConstants.UnitsToPx(transform.position.y);

            lastPosition = transform.position;
            LastDeltaUnits = Vector2.zero;

            // If min/max aren't set, default to a small motion around start.
            if (Mathf.Approximately(minXPx, 0) && Mathf.Approximately(maxXPx, 0))
            {
                minXPx = startXPx - 64;
                maxXPx = startXPx + 64;
            }
        }

        private void FixedUpdate()
        {
            float span = Mathf.Max(1f, maxXPx - minXPx);
            t += (speedPxPerSec / span) * Time.fixedDeltaTime;

            // Ping-pong 0..1
            float u = Mathf.PingPong(t, 1f);
            float xPx = Mathf.Lerp(minXPx, maxXPx, u);

            Vector2 pos = GameConstants.PhaserPxToUnity(xPx, yPx);
            Vector3 next = new Vector3(pos.x, pos.y, transform.position.z);
            transform.position = next;

            Vector3 delta = next - lastPosition;
            LastDeltaUnits = new Vector2(delta.x, delta.y);
            lastPosition = next;
        }
    }
}
