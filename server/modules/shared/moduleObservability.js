const metricsStore = new Map();

function createMetricsEntry() {
  return {
    requestCount: 0,
    errorCount: 0,
    totalLatencyMs: 0,
    routes: {},
    lastRequestAt: null,
  };
}

function ensureModule(moduleName) {
  if (!metricsStore.has(moduleName)) {
    metricsStore.set(moduleName, createMetricsEntry());
  }
  return metricsStore.get(moduleName);
}

function routeKey(req) {
  return `${req.method} ${req.route?.path || req.path}`;
}

function observeModule(moduleName) {
  return (req, res, next) => {
    const startedAt = Date.now();
    const moduleMetrics = ensureModule(moduleName);

    res.on("finish", () => {
      const durationMs = Date.now() - startedAt;
      const key = routeKey(req);
      const routeMetrics = moduleMetrics.routes[key] || {
        count: 0,
        errors: 0,
        avgLatencyMs: 0,
      };

      routeMetrics.count += 1;
      if (res.statusCode >= 400) {
        routeMetrics.errors += 1;
      }
      routeMetrics.avgLatencyMs = Number(
        ((routeMetrics.avgLatencyMs * (routeMetrics.count - 1) + durationMs) /
          routeMetrics.count).toFixed(2)
      );

      moduleMetrics.requestCount += 1;
      if (res.statusCode >= 400) {
        moduleMetrics.errorCount += 1;
      }
      moduleMetrics.totalLatencyMs += durationMs;
      moduleMetrics.lastRequestAt = new Date().toISOString();
      moduleMetrics.routes[key] = routeMetrics;

      const level = res.statusCode >= 500 ? "ERROR" : "INFO";
      console.log(
        `[${level}] [module:${moduleName}] ${req.method} ${req.originalUrl} ${res.statusCode} ${durationMs}ms`
      );
    });

    next();
  };
}

function getModuleMetrics(moduleName) {
  const moduleMetrics = ensureModule(moduleName);
  const avgLatencyMs =
    moduleMetrics.requestCount === 0
      ? 0
      : Number((moduleMetrics.totalLatencyMs / moduleMetrics.requestCount).toFixed(2));

  return {
    module: moduleName,
    requestCount: moduleMetrics.requestCount,
    errorCount: moduleMetrics.errorCount,
    avgLatencyMs,
    lastRequestAt: moduleMetrics.lastRequestAt,
    routes: moduleMetrics.routes,
  };
}

function getAllModuleMetrics() {
  return Array.from(metricsStore.keys()).map((moduleName) => getModuleMetrics(moduleName));
}

module.exports = {
  observeModule,
  getModuleMetrics,
  getAllModuleMetrics,
};
