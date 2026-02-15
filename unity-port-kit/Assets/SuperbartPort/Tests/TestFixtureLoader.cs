using UnityEngine;

namespace Superbart.Tests
{
    internal static class TestFixtureLoader
    {
        public static string ReadResourceText(string relativePath)
        {
            if (string.IsNullOrWhiteSpace(relativePath))
            {
                throw new System.ArgumentException("relativePath must be non-empty", nameof(relativePath));
            }

            string resourcesPath = relativePath.Trim();
            if (resourcesPath.EndsWith(".json", System.StringComparison.OrdinalIgnoreCase))
            {
                resourcesPath = resourcesPath.Substring(0, resourcesPath.Length - 5);
            }

            TextAsset asset = Resources.Load<TextAsset>(resourcesPath);
            if (asset == null)
            {
                throw new System.IO.FileNotFoundException($"Missing Resources TextAsset at path '{resourcesPath}'.");
            }

            return asset.text;
        }
    }
}
