using Superbart.Combat;
using Superbart.Runtime;
using Superbart.Save;
using UnityEngine;

namespace Superbart.UI
{
    public sealed class HudController : MonoBehaviour, IHudPresenter
    {
        [Header("HUD Runtime")]
        [SerializeField] private bool showPopupInConsole = true;
        [SerializeField] private bool keepLegacyFallback = true;

        private UnityRunStats latestStats = new UnityRunStats();
        private string activeBonusRoute;
        private bool maintenanceRouteActive;
        private string currentPopup;

        private float popupHideAt;

        public void SetRunStats(int coins, int stars, int score, int deaths, float timeSeconds)
        {
            latestStats = new UnityRunStats
            {
                coins = coins,
                stars = stars,
                score = score,
                deaths = deaths,
                timeSeconds = timeSeconds,
            };

            if (!keepLegacyFallback)
            {
                return;
            }

            Debug.Log($"[HUD] C:{coins} S:{stars} P:{score} D:{deaths} T:{timeSeconds:0.00}");
        }

        public void SetBonusRoute(string bonusRouteId)
        {
            activeBonusRoute = bonusRouteId;
        }

        public void SetMaintenanceRoute(bool active)
        {
            maintenanceRouteActive = active;
        }

        public void ShowPopup(string message, float durationSeconds = 2f)
        {
            currentPopup = message;
            popupHideAt = Time.unscaledTime + Mathf.Max(0.01f, durationSeconds);
            if (showPopupInConsole)
            {
                Debug.Log($"[HUD Popup] {message}");
            }
        }

        public void HidePopup()
        {
            currentPopup = string.Empty;
            popupHideAt = 0f;
        }

        private void Update()
        {
            if (!string.IsNullOrEmpty(currentPopup) && Time.unscaledTime >= popupHideAt)
            {
                HidePopup();
            }
        }
    }
}

