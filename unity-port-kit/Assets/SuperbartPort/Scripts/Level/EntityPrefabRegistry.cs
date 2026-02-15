using System;
using System.Collections.Generic;
using UnityEngine;

namespace Superbart.Level
{
    [CreateAssetMenu(menuName = "Superbart/Entity Prefab Registry", fileName = "EntityPrefabRegistry")]
    public sealed class EntityPrefabRegistry : ScriptableObject
    {
        [Serializable]
        public sealed class Entry
        {
            public string type;
            public GameObject prefab;
        }

        [SerializeField] private List<Entry> entries = new List<Entry>();

        private Dictionary<string, GameObject> cache;

        public GameObject Get(string type)
        {
            if (string.IsNullOrWhiteSpace(type)) return null;
            EnsureCache();
            cache.TryGetValue(type, out var prefab);
            return prefab;
        }

        private void EnsureCache()
        {
            if (cache != null) return;
            cache = new Dictionary<string, GameObject>(StringComparer.OrdinalIgnoreCase);
            foreach (var e in entries)
            {
                if (e == null || string.IsNullOrWhiteSpace(e.type) || e.prefab == null) continue;
                cache[e.type.Trim()] = e.prefab;
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
