using System.Collections;
using System.Collections.Generic;
using NUnit.Framework;
using Superbart.Core;
using Superbart.Level;
using Superbart.Player;
using UnityEngine;
using UnityEngine.TestTools;

namespace Superbart.Tests.PlayMode
{
    public sealed class MovingPlatformPlayModeTests
    {
        [UnityTest]
        public IEnumerator MovingPlatform_StaysWithinBounds_AndReversesDirection()
        {
            const float minXPx = 128f;
            const float maxXPx = 224f;

            GameObject go = new GameObject("MovingPlatform_Test");
            MovingPlatformMotor motor = go.AddComponent<MovingPlatformMotor>();
            motor.minXPx = minXPx;
            motor.maxXPx = maxXPx;
            motor.speedPxPerSec = 96f;
            go.transform.position = new Vector3(GameConstants.PxToUnits(176f), -2f, 0f);

            // Wait one frame so Start() captures initial values.
            yield return null;

            List<float> observedXPx = new List<float>();
            for (int frame = 0; frame < 220; frame += 1)
            {
                yield return null;
                observedXPx.Add(GameConstants.UnitsToPx(go.transform.position.x));
            }

            foreach (float xPx in observedXPx)
            {
                Assert.GreaterOrEqual(xPx, minXPx - 1f, "Platform should not move below minX.");
                Assert.LessOrEqual(xPx, maxXPx + 1f, "Platform should not move above maxX.");
            }

            int directionChanges = 0;
            int lastSign = 0;
            for (int i = 1; i < observedXPx.Count; i += 1)
            {
                float delta = observedXPx[i] - observedXPx[i - 1];
                int sign = delta > 0.01f ? 1 : (delta < -0.01f ? -1 : 0);
                if (sign == 0)
                {
                    continue;
                }

                if (lastSign != 0 && sign != lastSign)
                {
                    directionChanges += 1;
                }
                lastSign = sign;
            }

            Assert.GreaterOrEqual(directionChanges, 1, "Expected at least one direction reversal during ping-pong movement.");

            UnityEngine.Object.Destroy(go);
        }

        [UnityTest]
        public IEnumerator MovingPlatform_CarriesGroundedPlayer()
        {
            float originalFixed = Time.fixedDeltaTime;
            Time.fixedDeltaTime = 1f / 60f;

            try
            {
                GameObject platform = new GameObject("MovingPlatform_Carry", typeof(BoxCollider2D));
                platform.transform.position = new Vector3(GameConstants.PxToUnits(176f), 0f, 0f);

                BoxCollider2D platformCollider = platform.GetComponent<BoxCollider2D>();
                platformCollider.size = new Vector2(6f, 0.2f);

                MovingPlatformMotor motor = platform.AddComponent<MovingPlatformMotor>();
                motor.minXPx = 128f;
                motor.maxXPx = 224f;
                motor.speedPxPerSec = 72f;

                GameObject player = new GameObject("Player_Carry", typeof(Rigidbody2D), typeof(BoxCollider2D));
                player.transform.position = new Vector3(platform.transform.position.x, 0.6f, 0f);
                Rigidbody2D playerRb = player.GetComponent<Rigidbody2D>();
                playerRb.gravityScale = 0f;
                playerRb.freezeRotation = true;

                PlayerMotor2D playerMotor = player.AddComponent<PlayerMotor2D>();
                playerMotor.GroundCheck = null;
                playerMotor.GroundCheckRadiusUnits = 0.12f;
                playerMotor.GroundMask = LayerMask.GetMask("Default");

                yield return null;

                float startPlayerX = playerRb.position.x;

                // Step a handful of FixedUpdates. Platform should move right from its mid-point,
                // and player should be carried by platformDelta.
                for (int i = 0; i < 30; i += 1)
                {
                    yield return new WaitForFixedUpdate();
                }

                float endPlayerX = playerRb.position.x;
                Assert.Greater(endPlayerX, startPlayerX + 0.05f, "Expected player to be carried forward by moving platform.");

                UnityEngine.Object.Destroy(player);
                UnityEngine.Object.Destroy(platform);
            }
            finally
            {
                Time.fixedDeltaTime = originalFixed;
            }
        }
    }
}
