using System;
using System.Collections.Generic;
using Newtonsoft.Json;
using NUnit.Framework;
using Superbart.Player;
using Superbart.Tests;

namespace Superbart.Tests.PlayMode
{
    public sealed class MovementParityPlayModeTests
    {
        private const float DtMs = 16f;

        [Serializable]
        private sealed class MovementMetricsArtifact
        {
            public MovementMetricTolerances tolerances;
            public MovementMetricValues metrics;
        }

        [Serializable]
        private sealed class MovementMetricTolerances
        {
            public float scalarPct;
            public int frameCount;
            public bool booleanExact;
        }

        [Serializable]
        private sealed class MovementMetricValues
        {
            public int runTransitionFrames;
            public float runToWalkSpeedRatio;
            public float airGroundAccelRatio;
            public bool jumpBufferLandingSuccess;
            public int jumpCutOneShotCount;
            public int? jumpCutFirstFrame;
            public int? jumpCutSecondFrame;
            public int? skidFirstFrame;
            public int skidDurationFrames;
            public int skidDurationMs;
        }

        private sealed class RuntimeMetrics
        {
            public int runTransitionFrames;
            public float runToWalkSpeedRatio;
            public float airGroundAccelRatio;
            public bool jumpBufferLandingSuccess;
            public int jumpCutOneShotCount;
            public int? jumpCutFirstFrame;
            public int? jumpCutSecondFrame;
            public int? skidFirstFrame;
            public int skidDurationFrames;
            public int skidDurationMs;
        }

        [Test]
        public void MovementModel_MatchesCommittedMetricArtifactWithinTolerance()
        {
            string json = TestFixtureLoader.ReadResourceText("Fixtures/parity/movement_metrics.json");
            MovementMetricsArtifact artifact = JsonConvert.DeserializeObject<MovementMetricsArtifact>(json);

            Assert.NotNull(artifact);
            Assert.NotNull(artifact.metrics);
            Assert.NotNull(artifact.tolerances);

            RuntimeMetrics runtime = ComputeRuntimeMetrics();

            AssertFrameClose(runtime.runTransitionFrames, artifact.metrics.runTransitionFrames, artifact.tolerances.frameCount, "runTransitionFrames");
            AssertScalarClose(runtime.runToWalkSpeedRatio, artifact.metrics.runToWalkSpeedRatio, artifact.tolerances.scalarPct, "runToWalkSpeedRatio");
            AssertScalarClose(runtime.airGroundAccelRatio, artifact.metrics.airGroundAccelRatio, artifact.tolerances.scalarPct, "airGroundAccelRatio");

            if (artifact.tolerances.booleanExact)
            {
                Assert.AreEqual(artifact.metrics.jumpBufferLandingSuccess, runtime.jumpBufferLandingSuccess, "jumpBufferLandingSuccess");
                Assert.AreEqual(artifact.metrics.jumpCutOneShotCount, runtime.jumpCutOneShotCount, "jumpCutOneShotCount");
                Assert.AreEqual(artifact.metrics.jumpCutSecondFrame, runtime.jumpCutSecondFrame, "jumpCutSecondFrame");
            }

            AssertNullableFrameClose(runtime.jumpCutFirstFrame, artifact.metrics.jumpCutFirstFrame, artifact.tolerances.frameCount, "jumpCutFirstFrame");
            AssertNullableFrameClose(runtime.skidFirstFrame, artifact.metrics.skidFirstFrame, artifact.tolerances.frameCount, "skidFirstFrame");
            AssertFrameClose(runtime.skidDurationFrames, artifact.metrics.skidDurationFrames, artifact.tolerances.frameCount, "skidDurationFrames");
            AssertFrameClose(runtime.skidDurationMs, artifact.metrics.skidDurationMs, artifact.tolerances.frameCount * (int)DtMs, "skidDurationMs");
        }

        private static RuntimeMetrics ComputeRuntimeMetrics()
        {
            MovementStepOutput walk = MovementModel.Step(new MovementStepInput
            {
                dtMs = DtMs,
                vx = 0f,
                vy = 0f,
                inputX = 1,
                jumpPressed = false,
                jumpHeld = false,
                runHeld = false,
                onGround = true,
                feel = FeelState.Create(),
                modifiers = WorldModifiers.Default,
            });

            int runFrames = -1;
            MovementStepOutput runOutput = default;
            {
                FeelState feel = FeelState.Create();
                float vx = 0f;
                float vy = 0f;
                for (int frame = 0; frame < 60; frame += 1)
                {
                    runOutput = MovementModel.Step(new MovementStepInput
                    {
                        dtMs = DtMs,
                        vx = vx,
                        vy = vy,
                        inputX = 1,
                        jumpPressed = false,
                        jumpHeld = false,
                        runHeld = true,
                        onGround = true,
                        feel = feel,
                        modifiers = WorldModifiers.Default,
                    });

                    feel = runOutput.feel;
                    vx = runOutput.vx;
                    vy = runOutput.vy;

                    if (runOutput.motionHint == MotionHint.Run)
                    {
                        runFrames = frame + 1;
                        break;
                    }
                }
            }

            float groundAccel;
            float airAccel;
            {
                MovementStepOutput ground = MovementModel.Step(new MovementStepInput
                {
                    dtMs = DtMs,
                    vx = 0f,
                    vy = 0f,
                    inputX = 1,
                    jumpPressed = false,
                    jumpHeld = true,
                    runHeld = false,
                    onGround = true,
                    feel = FeelState.Create(),
                    modifiers = WorldModifiers.Default,
                });

                MovementStepOutput air = MovementModel.Step(new MovementStepInput
                {
                    dtMs = DtMs,
                    vx = 0f,
                    vy = 0f,
                    inputX = 1,
                    jumpPressed = false,
                    jumpHeld = true,
                    runHeld = false,
                    onGround = false,
                    feel = FeelState.Create(),
                    modifiers = WorldModifiers.Default,
                });

                float dtSec = DtMs / 1000f;
                groundAccel = ground.vx / dtSec;
                airAccel = air.vx / dtSec;
            }

            bool jumpBufferLandingSuccess;
            {
                FeelState feel = FeelState.Create();
                MovementStepOutput first = MovementModel.Step(new MovementStepInput
                {
                    dtMs = 16f,
                    vx = 0f,
                    vy = 50f,
                    inputX = 0,
                    jumpPressed = true,
                    jumpHeld = true,
                    runHeld = false,
                    onGround = false,
                    feel = feel,
                    modifiers = WorldModifiers.Default,
                });

                MovementStepOutput second = MovementModel.Step(new MovementStepInput
                {
                    dtMs = 50f,
                    vx = first.vx,
                    vy = first.vy,
                    inputX = 0,
                    jumpPressed = false,
                    jumpHeld = true,
                    runHeld = false,
                    onGround = true,
                    feel = first.feel,
                    modifiers = WorldModifiers.Default,
                });

                jumpBufferLandingSuccess = second.jumped && second.vy < 0f;
            }

            int jumpCutCount = 0;
            int? jumpCutFirstFrame = null;
            int? jumpCutSecondFrame = null;
            {
                MovementStepOutput launch = MovementModel.Step(new MovementStepInput
                {
                    dtMs = DtMs,
                    vx = 0f,
                    vy = 120f,
                    inputX = 0,
                    jumpPressed = true,
                    jumpHeld = true,
                    runHeld = false,
                    onGround = true,
                    feel = FeelState.Create(),
                    modifiers = WorldModifiers.Default,
                });

                List<bool> jumpHeldFrames = new List<bool>();
                // holdForFrames=1 -> no extra holds
                // firstReleaseFrames=3
                jumpHeldFrames.Add(false);
                jumpHeldFrames.Add(false);
                jumpHeldFrames.Add(false);
                // rePressFrames=2
                jumpHeldFrames.Add(true);
                jumpHeldFrames.Add(true);
                // secondReleaseFrames=4
                jumpHeldFrames.Add(false);
                jumpHeldFrames.Add(false);
                jumpHeldFrames.Add(false);
                jumpHeldFrames.Add(false);

                float vx = launch.vx;
                float vy = launch.vy;
                FeelState feel = launch.feel;
                bool previousCut = launch.feel.jumpCutApplied;

                for (int frame = 0; frame < jumpHeldFrames.Count; frame += 1)
                {
                    MovementStepOutput outStep = MovementModel.Step(new MovementStepInput
                    {
                        dtMs = DtMs,
                        vx = vx,
                        vy = vy,
                        inputX = 0,
                        jumpPressed = false,
                        jumpHeld = jumpHeldFrames[frame],
                        runHeld = false,
                        onGround = false,
                        feel = feel,
                        modifiers = WorldModifiers.Default,
                    });

                    bool currentCut = outStep.feel.jumpCutApplied;
                    if (currentCut && !previousCut)
                    {
                        jumpCutCount += 1;
                        if (!jumpCutFirstFrame.HasValue)
                        {
                            jumpCutFirstFrame = frame;
                        }
                        else if (!jumpCutSecondFrame.HasValue)
                        {
                            jumpCutSecondFrame = frame;
                        }
                    }

                    previousCut = currentCut;
                    feel = outStep.feel;
                    vx = outStep.vx;
                    vy = outStep.vy;
                }
            }

            int? skidFirstFrame = null;
            int skidDurationFrames = 0;
            {
                FeelState feel = FeelState.Create();
                float vx = 0f;
                float vy = 0f;

                for (int i = 0; i < 12; i += 1)
                {
                    MovementStepOutput outStep = MovementModel.Step(new MovementStepInput
                    {
                        dtMs = DtMs,
                        vx = vx,
                        vy = vy,
                        inputX = 1,
                        jumpPressed = false,
                        jumpHeld = false,
                        runHeld = true,
                        onGround = true,
                        feel = feel,
                        modifiers = WorldModifiers.Default,
                    });

                    feel = outStep.feel;
                    vx = outStep.vx;
                    vy = outStep.vy;
                }

                bool hadSkid = false;
                for (int frame = 0; frame < 16; frame += 1)
                {
                    MovementStepOutput outStep = MovementModel.Step(new MovementStepInput
                    {
                        dtMs = DtMs,
                        vx = vx,
                        vy = vy,
                        inputX = -1,
                        jumpPressed = false,
                        jumpHeld = false,
                        runHeld = false,
                        onGround = true,
                        feel = feel,
                        modifiers = WorldModifiers.Default,
                    });

                    if (outStep.motionHint == MotionHint.Skid)
                    {
                        if (!hadSkid)
                        {
                            skidFirstFrame = frame;
                            hadSkid = true;
                        }
                        skidDurationFrames += 1;
                    }
                    else if (hadSkid)
                    {
                        break;
                    }

                    feel = outStep.feel;
                    vx = outStep.vx;
                    vy = outStep.vy;
                }
            }

            return new RuntimeMetrics
            {
                runTransitionFrames = runFrames,
                runToWalkSpeedRatio = runOutput.vx / Math.Max(Math.Abs(walk.vx), float.Epsilon),
                airGroundAccelRatio = airAccel / Math.Max(groundAccel, float.Epsilon),
                jumpBufferLandingSuccess = jumpBufferLandingSuccess,
                jumpCutOneShotCount = jumpCutCount,
                jumpCutFirstFrame = jumpCutFirstFrame,
                jumpCutSecondFrame = jumpCutSecondFrame,
                skidFirstFrame = skidFirstFrame,
                skidDurationFrames = skidDurationFrames,
                skidDurationMs = (int)(skidDurationFrames * DtMs),
            };
        }

        private static void AssertScalarClose(float actual, float expected, float pctTolerance, string label)
        {
            float tolerance = Math.Abs(expected) * pctTolerance;
            if (tolerance < 0.0001f)
            {
                tolerance = 0.0001f;
            }

            Assert.LessOrEqual(Math.Abs(actual - expected), tolerance, $"{label} expected {expected} +/- {tolerance}, got {actual}");
        }

        private static void AssertFrameClose(int actual, int expected, int frameTolerance, string label)
        {
            Assert.LessOrEqual(Math.Abs(actual - expected), frameTolerance, $"{label} expected {expected} +/- {frameTolerance}, got {actual}");
        }

        private static void AssertNullableFrameClose(int? actual, int? expected, int frameTolerance, string label)
        {
            if (!actual.HasValue || !expected.HasValue)
            {
                Assert.AreEqual(expected, actual, $"{label} nullability mismatch");
                return;
            }

            AssertFrameClose(actual.Value, expected.Value, frameTolerance, label);
        }
    }
}
