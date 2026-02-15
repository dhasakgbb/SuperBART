using System.Collections.Generic;
using UnityEngine;

namespace Superbart.Enemies
{
    [CreateAssetMenu(menuName = "Superbart/Enemy Registry", fileName = "EnemyRegistry")]
    public sealed class EnemyRegistry : ScriptableObject
    {
        [System.Serializable]
        public sealed class Entry
        {
            public string enemyType;
            public GameObject prefab;
        }

        [SerializeField] private List<Entry> entries = new List<Entry>();
        private Dictionary<string, GameObject> cache;

        public GameObject Get(string enemyType)
        {
            if (string.IsNullOrWhiteSpace(enemyType))
            {
                return null;
            }

            EnsureCache();
            cache.TryGetValue(enemyType.Trim().ToLowerInvariant(), out var prefab);
            return prefab;
        }

        private void EnsureCache()
        {
            if (cache != null)
            {
                return;
            }

            cache = new Dictionary<string, GameObject>(System.StringComparer.OrdinalIgnoreCase);
            foreach (var entry in entries)
            {
                if (entry == null || string.IsNullOrWhiteSpace(entry.enemyType) || entry.prefab == null)
                {
                    continue;
                }

                cache[entry.enemyType.Trim().ToLowerInvariant()] = entry.prefab;
            }
        }

#if UNITY_EDITOR
        private void OnValidate()
        {
            cache = null;
        }
#endif
    }
}

