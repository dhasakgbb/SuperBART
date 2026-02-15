using Superbart.Campaign;
using Superbart.Runtime;
using UnityEngine;

namespace Superbart.UI
{
    public sealed class MenuSystemController : MonoBehaviour
    {
        [SerializeField] private LevelFlowController flowController;

        private void Start()
        {
            if (flowController == null)
            {
                flowController = FindObjectOfType<LevelFlowController>();
            }
        }

        public void OpenMenu()
        {
            flowController?.OpenMenu();
        }

        public void OpenWorldMap()
        {
            flowController?.OpenWorldMap();
        }

        public void StartWorldOne()
        {
            flowController?.StartLevel(1, 1);
        }

        public void StartWorldTwo()
        {
            flowController?.StartLevel(2, 1);
        }

        public void RetryFromCheckpoint()
        {
            flowController?.ContinueCurrentLevelFromCheckpoint();
        }
    }
}

