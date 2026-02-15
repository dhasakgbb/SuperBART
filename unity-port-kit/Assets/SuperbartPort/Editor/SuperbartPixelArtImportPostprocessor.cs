#if UNITY_EDITOR
using UnityEditor;

namespace Superbart.Editor
{
    // Auto-configure pixel art import settings for assets under Assets/SuperbartAssets/
    public sealed class SuperbartPixelArtImportPostprocessor : AssetPostprocessor
    {
        private const string Root = "Assets/SuperbartAssets/";

        private void OnPreprocessTexture()
        {
            if (!assetPath.StartsWith(Root)) return;

            var importer = (TextureImporter)assetImporter;
            importer.textureType = TextureImporterType.Sprite;
            importer.spriteImportMode = SpriteImportMode.Single;
            importer.spritePixelsPerUnit = 16;
            importer.filterMode = UnityEngine.FilterMode.Point;
            importer.mipmapEnabled = false;
            importer.textureCompression = TextureImporterCompression.Uncompressed;
            importer.alphaIsTransparency = true;
        }
    }
}
#endif
