using System.Collections.Generic;
using UnityEngine;

namespace Superbart.FX
{
    [CreateAssetMenu(menuName = "Superbart/Particle Bank", fileName = "ParticleBank")]
    public sealed class ParticleBank : ScriptableObject
    {
        [System.Serializable]
        public sealed class Entry
        {
            public string id;
            public ParticleSystem prefab;
            public int preloadCount = 2;
        }

        [SerializeField] private List<Entry> entries = new List<Entry>();
        private readonly Dictionary<string, Queue<ParticleSystem>> poolById = new Dictionary<string, Queue<ParticleSystem>>();

        public ParticleSystem Spawn(string id, Vector3 worldPosition, Quaternion worldRotation, Transform parent = null)
        {
            if (string.IsNullOrWhiteSpace(id) || entries == null)
            {
                return null;
            }

            EnsurePool(id);
            if (!poolById.TryGetValue(id, out var pool))
            {
                return null;
            }

            ParticleSystem instance = null;
            while (pool.Count > 0 && instance == null)
            {
                instance = pool.Dequeue();
                if (instance == null)
                {
                    continue;
                }
                if (!instance.gameObject.activeSelf)
                {
                    break;
                }
            }

            if (instance == null)
            {
                instance = CreateInstance(id, worldPosition, worldRotation, parent);
            }

            if (instance == null)
            {
                return null;
            }

            instance.transform.SetParent(parent);
            instance.transform.position = worldPosition;
            instance.transform.rotation = worldRotation;
            instance.gameObject.SetActive(true);
            instance.Play(true);

            return instance;
        }

        private void EnsurePool(string id)
        {
            if (poolById.ContainsKey(id))
            {
                return;
            }

            var entry = entries.Find(item => string.Equals(item.id, id));
            if (entry == null || entry.prefab == null)
            {
                return;
            }

            var queue = new Queue<ParticleSystem>();
            for (int i = 0; i < Mathf.Max(1, entry.preloadCount); i++)
            {
                var particle = CreateInstance(id, Vector3.zero, Quaternion.identity, null);
                if (particle != null)
                {
                    particle.Stop(true, ParticleSystemStopBehavior.StopEmittingAndClear);
                    particle.gameObject.SetActive(false);
                    queue.Enqueue(particle);
                }
            }

            poolById[id] = queue;
        }

        private ParticleSystem CreateInstance(string id, Vector3 position, Quaternion rotation, Transform parent)
        {
            var entry = entries.Find(item => string.Equals(item.id, id));
            if (entry == null || entry.prefab == null)
            {
                return null;
            }

            var instance = Object.Instantiate(entry.prefab, position, rotation, parent);
            instance.gameObject.name = $"FX::{id}";
            return instance;
        }
    }
}

