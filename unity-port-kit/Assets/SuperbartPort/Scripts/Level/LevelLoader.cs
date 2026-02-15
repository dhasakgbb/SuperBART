using System;
using System.Collections;
using System.Collections.Generic;
using System.Linq;
using System.IO;
using Newtonsoft.Json;
using UnityEngine;
using UnityEngine.Networking;
using UnityEngine.Tilemaps;
using Superbart.Core;
using Superbart.Gameplay;
using Superbart.Runtime;
using Superbart.Save;

namespace Superbart.Level
{
    public sealed class LevelLoader : MonoBehaviour
    {
        [Header("Input")]
        [Tooltip("If provided, this JSON is used directly.")]
        public TextAsset levelJson;

        [Tooltip("If levelJson is empty, loads StreamingAssets/levels/<fileName>.")]
        public string streamingAssetsFileName = "w1_l1.json";

        [Header("Output")]
        public Tilemap solidTilemap;
        public TilePalette tilePalette;
        public EntityPrefabRegistry prefabRegistry;

        [Header("Optional References")]
        [Tooltip("If set, a 'spawn' entity will teleport this transform instead of instantiating a prefab.")]
        public Transform playerTransform;
        [Tooltip("Optional scene-level service registry for spawn effects and audio/hud hooks.")]
        public RuntimeRegistry runtimeRegistry;

        [Header("Runtime Options")]
        public bool clearBeforeBuild = true;
        [Tooltip("If false, unknown entity types fail-open and continue.")]
        public bool strictUnknownEntityType = false;

        public event Action<string, LevelEntity> OnUnknownEntity;

        private readonly HashSet<string> observedUnknownTypes = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

        private void Awake()
        {
            observedUnknownTypes.Clear();
        }

        private void Start()
        {
            if (levelJson != null)
            {
                BuildFromJson(levelJson.text);
                return;
            }

            StartCoroutine(LoadFromStreamingAssetsAndBuild());
        }

        private IEnumerator LoadFromStreamingAssetsAndBuild()
        {
            string path = Path.Combine(Application.streamingAssetsPath, "levels", streamingAssetsFileName);

            // UnityWebRequest works for WebGL + desktop.
            using (var req = UnityWebRequest.Get(path))
            {
                yield return req.SendWebRequest();

#if UNITY_2020_2_OR_NEWER
                if (req.result != UnityWebRequest.Result.Success)
#else
                if (req.isNetworkError || req.isHttpError)
#endif
                {
                    Debug.LogError($"Failed to load level JSON from {path}: {req.error}");
                    yield break;
                }

                BuildFromJson(req.downloadHandler.text);
            }
        }

        public void BuildFromJson(string json)
        {
            if (solidTilemap == null)
            {
                Debug.LogError("LevelLoader: solidTilemap is not assigned.");
                return;
            }

            if (tilePalette == null)
            {
                Debug.LogError("LevelLoader: tilePalette is not assigned.");
                return;
            }

            GeneratedLevel level;
            try
            {
                level = JsonConvert.DeserializeObject<GeneratedLevel>(json);
            }
            catch (Exception e)
            {
                Debug.LogError($"Failed to parse level JSON: {e}");
                return;
            }

            if (level?.tileGrid == null)
            {
                Debug.LogError("Level JSON parsed, but tileGrid is null.");
                return;
            }
            if (prefabRegistry == null)
            {
                Debug.LogError("LevelLoader: prefabRegistry is not assigned. Entity fallback will still attempt hardcoded behavior.");
            }

            if (clearBeforeBuild)
            {
                solidTilemap.ClearAllTiles();
                foreach (Transform child in transform)
                {
                    Destroy(child.gameObject);
                }
            }

            BuildSolidTiles(level);
            SpawnEntities(level);
            SpawnOneWayPlatforms(level);
            SpawnMovingPlatforms(level);
        }

        private void BuildSolidTiles(GeneratedLevel level)
        {
            int h = level.tileGrid.Length;
            for (int y = 0; y < h; y++)
            {
                int[] row = level.tileGrid[y];
                if (row == null) continue;

                for (int x = 0; x < row.Length; x++)
                {
                    if (row[x] != 1) continue;

                    bool hasAbove = y > 0 && level.tileGrid[y - 1] != null && level.tileGrid[y - 1].Length > x && level.tileGrid[y - 1][x] == 1;
                    bool hasBelow = y < h - 1 && level.tileGrid[y + 1] != null && level.tileGrid[y + 1].Length > x && level.tileGrid[y + 1][x] == 1;

                    TileBase tile = tilePalette.PickSolid(hasAbove, hasBelow);
                    // Phaser grid: y grows downward. Use -y in Unity cell coords.
                    solidTilemap.SetTile(new Vector3Int(x, -y, 0), tile);
                }
            }
        }

        private void SpawnEntities(GeneratedLevel level)
        {
            if (level.entities == null) return;

            var sessionContext = SceneRouter.ActiveContext;
            var activeLevelKey = sessionContext != null ? sessionContext.LevelKey : "w1_l1";
            var activeWorldKey = sessionContext != null ? $"w{sessionContext.world}" : "w1";
            var activeRouteId = sessionContext != null ? sessionContext.bonusRouteId : string.Empty;

            foreach (var e in level.entities)
            {
                if (e == null) continue;

                string entityType = (e.type ?? string.Empty).Trim().ToLowerInvariant();
                if (string.IsNullOrWhiteSpace(entityType))
                {
                    continue;
                }

                Vector2 pos = GameConstants.PhaserPxToUnity(e.x, e.y);
                string resolvedRouteId = ResolveRouteId(e, activeRouteId);

                switch (entityType)
                {
                    case "spawn":
                        SpawnAtPlayerTransform(e, pos);
                        continue;
                    case "goal":
                        var goal = SpawnSimpleEntity(e, pos, "goal");
                        AddGoalTrigger(goal, e, activeLevelKey, activeWorldKey, resolvedRouteId);
                        continue;
                    case "checkpoint":
                        var checkpoint = SpawnSimpleEntity(e, pos, "checkpoint");
                        AddCheckpointTrigger(checkpoint, e, activeLevelKey, activeWorldKey, resolvedRouteId);
                        continue;
                    case "coin":
                    case "token":
                    case "star":
                    case "eval":
                    case "question_block":
                    case "gpu_allocation":
                    case "copilot_mode":
                    case "semantic_kernel":
                    case "deploy_to_prod":
                    case "works_on_my_machine":
                        SpawnCollectible(e, pos);
                        continue;
                    case "spike":
                    case "spring":
                    case "thwomp":
                    case "walker":
                    case "shell":
                    case "flying":
                    case "spitter":
                    case "boss":
                    case "technical_debt":
                    case "compliance_officer":
                    case "compliance":
                    case "hallucination":
                    case "legacy_system":
                    case "hot_take":
                    case "analyst":
                    case "tethered_debt":
                    case "snowman_sentry":
                    case "cryo_drone":
                    case "qubit_swarm":
                    case "crawler":
                    case "glitch_phantom":
                    case "fungal_node":
                    case "ghost_process":
                    case "tape_wraith":
                    case "resume_bot":
                        var enemyOrHazard = SpawnSimpleEntity(e, pos, entityType);
                        AddHazardTriggerIfNeeded(entityType, enemyOrHazard, e, activeLevelKey, activeWorldKey, resolvedRouteId);
                        continue;
                    default:
                        SpawnUnknownOrFallback(e, pos, entityType);
                        continue;
                }
            }
        }

        private GameObject SpawnSimpleEntity(LevelEntity e, in Vector2 pos, in string entityType)
        {
            var prefab = prefabRegistry != null ? prefabRegistry.Get(entityType) : null;
            if (prefab == null)
            {
                EmitUnknownEntity(entityType, e, $"No prefab mapping for entity '{entityType}'.");
                return null;
            }

            var instance = Instantiate(prefab, new Vector3(pos.x, pos.y, 0), Quaternion.identity);
            return instance;
        }

        private void SpawnCollectible(LevelEntity e, in Vector2 pos)
        {
            string collectibleType = (e.type ?? string.Empty).Trim().ToLowerInvariant();
            var prefab = prefabRegistry != null ? prefabRegistry.Get(collectibleType) : null;
            if (prefab == null)
            {
                EmitUnknownEntity(collectibleType, e, "Collectible prefab mapping missing.");
                return;
            }

            var instance = Instantiate(prefab, new Vector3(pos.x, pos.y, 0), Quaternion.identity);
            if (runtimeRegistry != null && runtimeRegistry.CollectibleEffect != null)
            {
                runtimeRegistry.CollectibleEffect.OnCollectibleSpawned(collectibleType, instance);
            }

            var sessionContext = SceneRouter.ActiveContext;
            var activeLevelKey = sessionContext != null ? sessionContext.LevelKey : "w1_l1";
            var activeWorldKey = sessionContext != null ? $"w{sessionContext.world}" : "w1";
            var activeRouteId = sessionContext != null ? sessionContext.bonusRouteId : string.Empty;
            AddCollectibleTrigger(instance, e, activeLevelKey, activeWorldKey, ResolveRouteId(e, activeRouteId));
        }

        private void SpawnAtPlayerTransform(LevelEntity e, in Vector2 pos)
        {
            if (playerTransform == null)
            {
                Debug.LogWarning("LevelLoader: playerTransform is not assigned; spawn will be dropped.");
                EmitUnknownEntity("spawn", e, "Spawn requires playerTransform reference.");
                return;
            }

            float z = playerTransform.position.z;
            playerTransform.position = new Vector3(pos.x, pos.y, z);
        }

        private void SpawnUnknownOrFallback(LevelEntity e, in Vector2 pos, in string entityType)
        {
            var sessionContext = SceneRouter.ActiveContext;
            var activeLevelKey = sessionContext != null ? sessionContext.LevelKey : "w1_l1";
            var activeWorldKey = sessionContext != null ? $"w{sessionContext.world}" : "w1";
            var activeRouteId = sessionContext != null ? sessionContext.bonusRouteId : string.Empty;

            if (prefabRegistry != null)
            {
                var prefab = prefabRegistry.Get(entityType);
                if (prefab != null)
                {
                    var fallback = Instantiate(prefab, new Vector3(pos.x, pos.y, 0), Quaternion.identity);
                    AttachInteractionMarker(entityType, fallback, e, activeLevelKey, activeWorldKey, ResolveRouteId(e, activeRouteId));
                    return;
                }
            }

            EmitUnknownEntity(entityType, e, "Unknown entity type and no fallback prefab.");
            if (strictUnknownEntityType)
            {
                throw new InvalidOperationException($"Unknown entity type '{entityType}' and strictUnknownEntityType is enabled.");
            }
        }

        private void EmitUnknownEntity(string entityType, LevelEntity entity, string message)
        {
            if (!observedUnknownTypes.Contains(entityType))
            {
                observedUnknownTypes.Add(entityType);
                Debug.LogWarning($"LevelLoader: {message} ({entityType})\nEntityId={entity?.id ?? \"<missing>\"}");
                OnUnknownEntity?.Invoke(message, entity);
            }
        }

        private void SpawnOneWayPlatforms(GeneratedLevel level)
        {
            if (level.oneWayPlatforms == null) return;

            foreach (var p in level.oneWayPlatforms)
            {
                if (p == null) continue;

                // Generator provides TILE coords. Build collider geometry in Unity units.
                float tileUnit = 1f; // with PPU=16 and tileSize=16px, 1 tile = 1 unit.

                float widthUnits = p.w * tileUnit;
                float heightUnits = 0.25f * tileUnit;

                // Position: center on the platform top surface.
                float xPx = (p.x * level.tileSize) + (p.w * level.tileSize) * 0.5f;
                float yPx = (p.y * level.tileSize) + (level.tileSize * 0.5f);
                Vector2 pos = GameConstants.PhaserPxToUnity(xPx, yPx);

                var go = new GameObject($"OneWay_{p.x}_{p.y}");
                go.transform.position = new Vector3(pos.x, pos.y, 0);

                var rb = go.AddComponent<Rigidbody2D>();
                rb.bodyType = RigidbodyType2D.Static;

                var box = go.AddComponent<BoxCollider2D>();
                box.size = new Vector2(widthUnits, heightUnits);

                var effector = go.AddComponent<PlatformEffector2D>();
                effector.useOneWay = true;
                effector.useSideBounce = false;
                box.usedByEffector = true;

                // Vanish timing: toggle collider visibility on a cycle
                if (p.vanish != null && p.vanish.visibleMs > 0 && p.vanish.hiddenMs > 0)
                {
                    var vanish = go.AddComponent<VanishPlatformBehaviour>();
                    vanish.visibleMs = p.vanish.visibleMs;
                    vanish.hiddenMs = p.vanish.hiddenMs;
                    vanish.phaseOffsetMs = p.vanish.phaseOffsetMs;
                }
            }
        }

        private void SpawnMovingPlatforms(GeneratedLevel level)
        {
            if (level.movingPlatforms == null) return;

            foreach (var mp in level.movingPlatforms)
            {
                if (mp == null) continue;

                var prefab = prefabRegistry != null ? prefabRegistry.Get("moving_platform") : null;
                if (prefab == null)
                {
                    // fallback: create a placeholder object
                    var placeholder = GameObject.CreatePrimitive(PrimitiveType.Cube);
                    placeholder.name = $"MovingPlatform_{mp.id}";
                    placeholder.transform.localScale = new Vector3(2f, 0.25f, 1f);
                    prefab = placeholder;
                }

                Vector2 pos = GameConstants.PhaserPxToUnity(mp.x, mp.y);
                var go = Instantiate(prefab, new Vector3(pos.x, pos.y, 0), Quaternion.identity);
                go.name = $"MovingPlatform_{mp.id}";

                var motor = go.GetComponent<MovingPlatformMotor>();
                if (motor == null) motor = go.AddComponent<MovingPlatformMotor>();
                motor.minXPx = mp.minX;
                motor.maxXPx = mp.maxX;
                motor.speedPxPerSec = mp.speed;
            }
        }

        private void AddGoalTrigger(GameObject goalInstance, LevelEntity source, string levelKey, string worldKey, string routeId)
        {
            if (goalInstance == null || source == null)
            {
                return;
            }

            var marker = goalInstance.GetComponent<GoalTriggerVolume>() ?? goalInstance.AddComponent<GoalTriggerVolume>();
            marker.Configure(source.type, source.id, levelKey, ResolveWorldKey(source, worldKey), routeId);
        }

        private void AddCheckpointTrigger(GameObject checkpointInstance, LevelEntity source, string levelKey, string worldKey, string routeId)
        {
            if (checkpointInstance == null || source == null)
            {
                return;
            }

            var marker = checkpointInstance.GetComponent<CheckpointTriggerVolume>() ?? checkpointInstance.AddComponent<CheckpointTriggerVolume>();
            marker.Configure(source.type, source.id, levelKey, ResolveWorldKey(source, worldKey), routeId);
        }

        private void AddCollectibleTrigger(GameObject collectibleInstance, LevelEntity source, string levelKey, string worldKey, string routeId)
        {
            if (collectibleInstance == null || source == null)
            {
                return;
            }

            int reward = 1;
            if (source.data != null && source.data.score != null)
            {
                reward = Mathf.Max(1, Mathf.RoundToInt(source.data.score.Value));
            }
            else if (source.data != null && source.data.value != null)
            {
                reward = Mathf.Max(1, Mathf.RoundToInt(source.data.value.Value));
            }

            var marker = collectibleInstance.GetComponent<CollectibleTriggerVolume>() ?? collectibleInstance.AddComponent<CollectibleTriggerVolume>();
            marker.Configure(source.type, source.id, levelKey, ResolveWorldKey(source, worldKey), routeId, reward);
        }

        private void AddHazardTriggerIfNeeded(string entityType, GameObject hazardInstance, LevelEntity source, string levelKey, string worldKey, string routeId)
        {
            if (hazardInstance == null || source == null)
            {
                return;
            }

            var marker = hazardInstance.GetComponent<HazardTriggerVolume>() ?? hazardInstance.AddComponent<HazardTriggerVolume>();
            marker.Configure(source.type, source.id, levelKey, ResolveWorldKey(source, worldKey), routeId);

            if (source?.data != null)
            {
                int damage = 1;
                if (source.data.damage != null)
                {
                    damage = Mathf.Max(1, Mathf.RoundToInt(source.data.damage.Value));
                }

                bool oneShot = string.Equals(entityType, "spike", System.StringComparison.OrdinalIgnoreCase);
                if (source.data.singleUse != null)
                {
                    oneShot = source.data.singleUse.Value;
                }

                marker.SetHazardMode(damage, oneShot);
            }
        }

        private void AttachInteractionMarker(string entityType, GameObject instance, LevelEntity source, string levelKey, string worldKey, string routeId)
        {
            if (instance == null || source == null)
            {
                return;
            }

            switch (entityType)
            {
                case "goal":
                    AddGoalTrigger(instance, source, levelKey, worldKey, routeId);
                    return;
                case "checkpoint":
                    AddCheckpointTrigger(instance, source, levelKey, worldKey, routeId);
                    return;
                case "coin":
                case "token":
                case "star":
                case "eval":
                case "question_block":
                case "gpu_allocation":
                case "copilot_mode":
                case "semantic_kernel":
                case "deploy_to_prod":
                case "works_on_my_machine":
                    AddCollectibleTrigger(instance, source, levelKey, worldKey, routeId);
                    return;
                default:
                    AddHazardTriggerIfNeeded(entityType, instance, source, levelKey, worldKey, routeId);
                    return;
            }
        }

        private string ResolveWorldKey(LevelEntity source, string fallbackWorldKey)
        {
            if (source?.data?.world != null && !string.IsNullOrWhiteSpace(source.data.world))
            {
                return source.data.world;
            }

            if (!string.IsNullOrWhiteSpace(source.world))
            {
                return source.world;
            }

            return fallbackWorldKey;
        }

        private static string ResolveRouteId(LevelEntity source, string fallbackRouteId)
        {
            if (source != null && !string.IsNullOrWhiteSpace(source.routeId))
            {
                return source.routeId;
            }

            return fallbackRouteId;
        }
    }
}
