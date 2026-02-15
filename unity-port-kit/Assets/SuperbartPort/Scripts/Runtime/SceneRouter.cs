using System;
using System.Collections;
using UnityEngine;
using UnityEngine.SceneManagement;

namespace Superbart.Runtime
{
    public enum SceneName
    {
        Boot,
        MainMenu,
        WorldMap,
        LevelPlay,
        LevelResult,
    }

    public sealed class SceneRouter : MonoBehaviour
    {
        public static SessionContext ActiveContext { get; private set; } = SessionContext.Empty;

        public static event Action<SceneName, SessionContext> SceneLoading;

        private static readonly string[] SceneNames = {
            [0] = "Boot",
            [1] = "MainMenu",
            [2] = "WorldMap",
            [3] = "LevelPlay",
            [4] = "LevelResult",
        };

        [Header("Router")]
        [Tooltip("Optional scene load timeout in seconds.")]
        [SerializeField] private float loadTimeoutSeconds = 30f;

        private void Awake()
        {
            DontDestroyOnLoad(gameObject);
        }

        public void RouteToBoot(SessionContext context = null)
        {
            LoadScene(SceneName.Boot, context, false);
        }

        public void RouteToMainMenu(SessionContext context = null)
        {
            LoadScene(SceneName.MainMenu, context, false);
        }

        public void RouteToWorldMap(SessionContext context = null)
        {
            LoadScene(SceneName.WorldMap, context, false);
        }

        public void RouteToLevelPlay(SessionContext context = null)
        {
            LoadScene(SceneName.LevelPlay, context, false);
        }

        public void RouteToLevelResult(SessionContext context = null)
        {
            LoadScene(SceneName.LevelResult, context, false);
        }

        public void LoadScene(SceneName scene, SessionContext context, bool additive)
        {
            if (string.IsNullOrWhiteSpace(GetSceneName(scene)))
            {
                Debug.LogError("SceneRouter: invalid scene requested.");
                return;
            }

            ActiveContext = context != null ? context.Copy() : SessionContext.Empty;
            StartCoroutine(LoadSceneRoutine(scene, GetSceneName(scene), additive));
        }

        public SceneName? ResolveActiveSceneName()
        {
            string active = SceneManager.GetActiveScene().name;
            for (int i = 0; i < SceneNames.Length; i++)
            {
                if (string.Equals(SceneNames[i], active, StringComparison.OrdinalIgnoreCase))
                {
                    return (SceneName)i;
                }
            }

            return null;
        }

        private IEnumerator LoadSceneRoutine(SceneName sceneName, string scenePath, bool additive)
        {
            var mode = additive ? LoadSceneMode.Additive : LoadSceneMode.Single;
            float startedAt = Time.realtimeSinceStartup;
            SceneLoading?.Invoke(sceneName, ActiveContext);

            var op = SceneManager.LoadSceneAsync(scenePath, mode);
            if (op == null)
            {
                Debug.LogError($"SceneRouter: failed to start async load for {scenePath}");
                yield break;
            }

            while (!op.isDone)
            {
                if (loadTimeoutSeconds > 0f && Time.realtimeSinceStartup - startedAt > loadTimeoutSeconds)
                {
                    Debug.LogError($"SceneRouter: timed out while loading scene '{sceneName}'");
                    yield break;
                }

                yield return null;
            }

            var loaded = SceneManager.GetSceneByName(scenePath);
            if (!loaded.isLoaded)
            {
                Debug.LogWarning($"SceneRouter: '{scenePath}' completed loading but scene is not loaded according to API.");
            }
        }

        private static string GetSceneName(SceneName scene)
        {
            int index = (int)scene;
            if (index < 0 || index >= SceneNames.Length)
            {
                return string.Empty;
            }

            return SceneNames[index];
        }
    }
}
