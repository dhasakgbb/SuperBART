using System;
using System.Collections;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;
using Newtonsoft.Json;
using NUnit.Framework;
using Superbart.Core;
using Superbart.Level;
using Superbart.Tests;
using UnityEngine;
using UnityEngine.Tilemaps;

namespace Superbart.Tests.EditMode
{
    public sealed class LevelLoaderEditModeTests
    {
        private readonly List<UnityEngine.Object> teardown = new List<UnityEngine.Object>();

        [TearDown]
        public void TearDown()
        {
            EntityProbeMarker[] probes = UnityEngine.Object.FindObjectsOfType<EntityProbeMarker>();
            foreach (EntityProbeMarker probe in probes)
            {
                if (probe != null)
                {
                    UnityEngine.Object.DestroyImmediate(probe.gameObject);
                }
            }

            for (int i = teardown.Count - 1; i >= 0; i -= 1)
            {
                UnityEngine.Object obj = teardown[i];
                if (obj != null)
                {
                    UnityEngine.Object.DestroyImmediate(obj);
                }
            }
            teardown.Clear();
        }

        [Test]
        public void BuildFromJson_UsesW1L2Fixture_BuildsTiles_AndTeleportsSpawn()
        {
            string json = TestFixtureLoader.ReadResourceText("Fixtures/levels/w1_l2.json");
            GeneratedLevel level = JsonConvert.DeserializeObject<GeneratedLevel>(json);

            Assert.NotNull(level);

            LevelLoader loader = CreateLoaderWithTilemap();
            loader.playerTransform = CreateTrackedGameObject("Player").transform;

            loader.BuildFromJson(json);

            Assert.Greater(loader.solidTilemap.GetUsedTilesCount(), 0, "Expected tilemap to be populated from fixture.");

            LevelEntity spawn = level.entities.First((entity) =>
                string.Equals(entity.type, "spawn", StringComparison.OrdinalIgnoreCase)
            );
            Vector2 expected = GameConstants.PhaserPxToUnity(spawn.x, spawn.y);
            Vector2 actual = loader.playerTransform.position;
            Assert.Less(Vector2.Distance(actual, expected), 0.001f, "Spawn teleport should match Phaser->Unity conversion.");
        }

        [Test]
        public void BuildFromJson_InstantiatesMappedEntities_FromSyntheticFixture()
        {
            string json = TestFixtureLoader.ReadResourceText("Fixtures/levels/synthetic_moving_platform.json");
            GeneratedLevel level = JsonConvert.DeserializeObject<GeneratedLevel>(json);

            Assert.NotNull(level);

            LevelLoader loader = CreateLoaderWithTilemap();
            loader.prefabRegistry = CreateRegistryForTypes(level.entities.Select((entity) => entity.type));

            int before = UnityEngine.Object.FindObjectsOfType<EntityProbeMarker>().Length;
            loader.BuildFromJson(json);
            int after = UnityEngine.Object.FindObjectsOfType<EntityProbeMarker>().Length;

            Assert.AreEqual(level.entities.Length, after - before, "Each mapped entity type should instantiate one probe prefab instance.");
            Assert.Greater(loader.solidTilemap.GetUsedTilesCount(), 0, "Expected solid tiles from synthetic fixture.");
        }

        private LevelLoader CreateLoaderWithTilemap()
        {
            GameObject gridGo = CreateTrackedGameObject("Grid", typeof(Grid));
            GameObject tilemapGo = CreateTrackedGameObject("SolidTilemap", typeof(Tilemap), typeof(TilemapRenderer));
            tilemapGo.transform.SetParent(gridGo.transform, false);

            Tilemap tilemap = tilemapGo.GetComponent<Tilemap>();
            TilePalette palette = CreateTilePalette();

            GameObject loaderGo = CreateTrackedGameObject("LevelLoader");
            LevelLoader loader = loaderGo.AddComponent<LevelLoader>();
            loader.solidTilemap = tilemap;
            loader.tilePalette = palette;
            loader.clearBeforeBuild = true;

            return loader;
        }

        private TilePalette CreateTilePalette()
        {
            TilePalette palette = ScriptableObject.CreateInstance<TilePalette>();
            teardown.Add(palette);
            palette.solidTop = ScriptableObject.CreateInstance<Tile>();
            palette.solidMid = ScriptableObject.CreateInstance<Tile>();
            palette.solidBottom = ScriptableObject.CreateInstance<Tile>();
            palette.oneWay = ScriptableObject.CreateInstance<Tile>();
            teardown.Add(palette.solidTop);
            teardown.Add(palette.solidMid);
            teardown.Add(palette.solidBottom);
            teardown.Add(palette.oneWay);
            return palette;
        }

        private EntityPrefabRegistry CreateRegistryForTypes(IEnumerable<string> entityTypes)
        {
            EntityPrefabRegistry registry = ScriptableObject.CreateInstance<EntityPrefabRegistry>();
            teardown.Add(registry);

            FieldInfo entriesField = typeof(EntityPrefabRegistry).GetField("entries", BindingFlags.Instance | BindingFlags.NonPublic);
            Assert.NotNull(entriesField, "Expected private serialized 'entries' field on EntityPrefabRegistry.");

            IList entries = entriesField.GetValue(registry) as IList;
            Assert.NotNull(entries, "Expected entries list to be initialized.");

            foreach (string type in entityTypes.Distinct(StringComparer.OrdinalIgnoreCase))
            {
                GameObject prefab = CreateTrackedGameObject($"EntityProbePrefab_{type}");
                prefab.AddComponent<EntityProbeMarker>();

                EntityPrefabRegistry.Entry entry = new EntityPrefabRegistry.Entry
                {
                    type = type,
                    prefab = prefab,
                };
                entries.Add(entry);
            }

            return registry;
        }

        private GameObject CreateTrackedGameObject(string name, params Type[] components)
        {
            GameObject go = components == null || components.Length == 0
                ? new GameObject(name)
                : new GameObject(name, components);

            teardown.Add(go);
            return go;
        }
    }
}
