(function bootstrapAnalyticsConsent() {
  var measurementMeta = document.querySelector('meta[name="ga-measurement-id"]');
  var measurementId = measurementMeta && measurementMeta.content ? measurementMeta.content.trim() : "";
  if (!measurementId) return;

  var linkerMeta = document.querySelector('meta[name="ga-linker-domains"]');
  var linkerDomains =
    linkerMeta && linkerMeta.content
      ? linkerMeta.content
          .split(",")
          .map(function (value) {
            return value.trim();
          })
          .filter(Boolean)
      : [];

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
      functionality_storage: "granted",
      security_storage: "granted",
      wait_for_update: 500
    });
    window.gtag("js", new Date());
    window.gtag("config", measurementId, {
      anonymize_ip: true,
      send_page_view: false,
      linker: linkerDomains.length ? { domains: linkerDomains } : undefined
    });
    window.__sunnyAnalyticsConfigured = true;
  }

  var existingScript = document.querySelector('script[data-ga-measurement-id="' + measurementId + '"]');
  if (existingScript) {
    if (existingScript.dataset.gaLoaded === "true") {
      window.__sunnyAnalyticsLoaded = true;
    } else {
      existingScript.addEventListener(
        "load",
        function () {
          existingScript.dataset.gaLoaded = "true";
          window.__sunnyAnalyticsLoaded = true;
        },
        { once: true }
      );
    }
    return;
  }

  var script = document.createElement("script");
  script.async = true;
  script.dataset.gaMeasurementId = measurementId;
  script.src = "https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(measurementId);
  script.addEventListener(
    "load",
    function () {
      script.dataset.gaLoaded = "true";
      window.__sunnyAnalyticsLoaded = true;
    },
    { once: true }
  );
  script.addEventListener(
    "error",
    function () {
      window.__sunnyAnalyticsLoaded = false;
    },
    { once: true }
  );
  document.head.appendChild(script);
})();
