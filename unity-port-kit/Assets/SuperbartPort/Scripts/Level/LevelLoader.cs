using System;
using System.Collections;
using System.IO;
using Newtonsoft.Json;
using UnityEngine;
using UnityEngine.Networking;
using UnityEngine.Tilemaps;
using Superbart.Core;

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

        [Header("Runtime Options")]
        public bool clearBeforeBuild = true;

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

            if (clearBeforeBuild)
            {
                solidTilemap.ClearAllTiles();
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
            if (prefabRegistry == null || level.entities == null) return;

            foreach (var e in level.entities)
            {
                if (e == null) continue;

                // Special-case: move an existing player to the spawn point.
                if (playerTransform != null && string.Equals(e.type, "spawn", StringComparison.OrdinalIgnoreCase))
                {
                    Vector2 spawnPos = GameConstants.PhaserPxToUnity(e.x, e.y);
                    playerTransform.position = new Vector3(spawnPos.x, spawnPos.y, playerTransform.position.z);
                    continue;
                }

                GameObject prefab = prefabRegistry.Get(e.type);
                if (prefab == null) continue;

                Vector2 pos = GameConstants.PhaserPxToUnity(e.x, e.y);
                Instantiate(prefab, new Vector3(pos.x, pos.y, 0), Quaternion.identity);
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
    }
}
