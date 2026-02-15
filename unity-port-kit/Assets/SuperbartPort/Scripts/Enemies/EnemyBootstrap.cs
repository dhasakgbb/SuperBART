using Superbart.Combat;
using Superbart.Save;
using UnityEngine;

namespace Superbart.Enemies
{
    public sealed class EnemyBootstrap : MonoBehaviour, IEnemyFactory
    {
        [SerializeField] private EnemyRegistry registry;

        public GameObject Spawn(string enemyType, Vector3 worldPosition, object data, Transform parent)
        {
            var prefab = registry != null ? registry.Get(enemyType) : null;
            GameObject instance = prefab != null ? Instantiate(prefab, worldPosition, Quaternion.identity) : CreateFallback(enemyType);
            if (instance == null)
            {
                return null;
            }

            if (parent != null)
            {
                instance.transform.SetParent(parent);
            }

            return instance;
        }

        private static GameObject CreateFallback(string enemyType)
        {
            var marker = GameObject.CreatePrimitive(PrimitiveType.Cube);
            marker.name = $"FallbackEnemy::{enemyType}";
            return marker;
        }
    }
}

