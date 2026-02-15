using UnityEngine;
using UnityEngine.Tilemaps;

namespace Superbart.Level
{
    [CreateAssetMenu(menuName = "Superbart/Tile Palette", fileName = "TilePalette")]
    public sealed class TilePalette : ScriptableObject
    {
        [Header("Solid ground")]
        public TileBase solidTop;
        public TileBase solidMid;
        public TileBase solidBottom;

        [Header("One-way")]
        public TileBase oneWay;

        public TileBase PickSolid(bool hasSolidAbove, bool hasSolidBelow)
        {
            if (!hasSolidAbove) return solidTop != null ? solidTop : solidMid;
            if (!hasSolidBelow) return solidBottom != null ? solidBottom : solidMid;
            return solidMid;
        }
    }
}
