(() => {
  const namespace = "felip-eu-portfolio";
  const activeBucketMs = 10000;
  const trimmed = (window.location.pathname || "/").replace(/\/index\.html$/, "/").replace(/\/+/g, "/");
  const route = trimmed === "" || trimmed === "/" ? "/" : trimmed.endsWith("/") ? trimmed : `${trimmed}/`;
  const counter = route === "/" ? "home" : route.replace(/^\/|\/$/g, "").toLowerCase().replace(/[^a-z0-9/_-]+/g, "-").replace(/\//g, "__");
  const activeCounter = `${counter}__active`;
  let activeStartedAt = document.visibilityState === "visible" ? Date.now() : 0;
  let activeCarryMs = 0;
  let activeTimer = null;

  function ping(name) {
    fetch(
      "https://api.counterapi.dev/v1/" +
        encodeURIComponent(namespace) +
        "/" +
        encodeURIComponent(name) +
        "/up",
      { method: "GET", keepalive: true }
    ).catch(() => {});
  }

  function flush(finalize = false) {
    if (!activeStartedAt) return;
    const now = Date.now();
    activeCarryMs += Math.max(0, now - activeStartedAt);
    activeStartedAt = now;

    while (activeCarryMs >= activeBucketMs) {
      ping(activeCounter);
      activeCarryMs -= activeBucketMs;
    }

    if (finalize && activeCarryMs >= activeBucketMs / 2) {
      ping(activeCounter);
      activeCarryMs = 0;
    }
  }

  function stop(finalize = false) {
    flush(finalize);
    activeStartedAt = 0;
    if (activeTimer) {
      clearInterval(activeTimer);
      activeTimer = null;
    }
  }

  function start() {
    if (document.visibilityState !== "visible" || activeTimer) return;
    activeStartedAt = Date.now();
    activeTimer = setInterval(() => flush(false), activeBucketMs);
  }

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      stop(true);
      return;
    }

    start();
  });

  window.addEventListener("pagehide", () => stop(true));

  ping(counter);
  start();
})();
