(function bootstrapAnalyticsConsent() {
  var measurementMeta = document.querySelector('meta[name="ga-measurement-id"]');
  var measurementId = measurementMeta && measurementMeta.content ? measurementMeta.content.trim() : "";
  if (!measurementId) return;

  window.dataLayer = window.dataLayer || [];
  window.gtag =
    window.gtag ||
    function gtag() {
      window.dataLayer.push(arguments);
    };

  if (!window.__sunnyAnalyticsConfigured) {
    window.gtag("consent", "default", {
      analytics_storage: "denied",
      ad_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied",
      functionality_storage: "denied",
      personalization_storage: "denied",
      security_storage: "granted",
      wait_for_update: 500
    });
  }
})();
