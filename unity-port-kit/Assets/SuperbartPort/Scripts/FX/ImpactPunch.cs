using Superbart.Level;
using UnityEngine;

namespace Superbart.FX
{
    public sealed class ImpactPunch : MonoBehaviour
    {
        [SerializeField] private CinemachineSetup cameraSetup;
        [SerializeField] private float strength = 0.18f;
        [SerializeField] private float duration = 0.12f;

        private void Awake()
        {
            if (cameraSetup == null)
            {
                cameraSetup = FindObjectOfType<CinemachineSetup>();
            }
        }

        public void Trigger()
        {
            if (cameraSetup != null)
            {
                cameraSetup.TriggerShake(strength, duration);
            }
        }
    }
}

