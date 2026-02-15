using System.Collections;
using Superbart.Runtime;
using UnityEngine;
using UnityEngine.SceneManagement;

namespace Superbart.UI
{
    public sealed class CutsceneFlow : MonoBehaviour
    {
        [SerializeField] private SceneRouter sceneRouter;
        [SerializeField] private float introHoldSeconds = 2.4f;
        [SerializeField] private string startupMusicId = "world-start";

        public void PlayIntro(SessionContext context)
        {
            StartCoroutine(PlayIntroRoutine(context));
        }

        private IEnumerator PlayIntroRoutine(SessionContext context)
        {
            Debug.Log("CutsceneFlow: cinematic intro started");
            yield return new WaitForSecondsRealtime(introHoldSeconds);

            sceneRouter ??= FindObjectOfType<SceneRouter>();
            if (sceneRouter != null)
            {
                sceneRouter.RouteToLevelPlay(context);
            }
            else
            {
                SceneManager.LoadScene("LevelPlay");
            }
        }
    }
}

