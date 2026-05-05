/**
 * Service discovery për MobileShop:
 * - Consul: health/catalog API (polyglot-friendly)
 * - Eureka: Netflix/Spring REST (shtëpi e Spring për registry)
 * - Fallback: URL statike nga Docker/env (sic `AUTH_SERVICE_URL`)
 */

const staticRegistry = {
  auth: process.env.AUTH_SERVICE_URL || "http://localhost:4001",
  catalog: process.env.CATALOG_SERVICE_URL || "http://localhost:4002",
  order: process.env.ORDER_SERVICE_URL || "http://localhost:4003",
  inventory: process.env.INVENTORY_SERVICE_URL || "http://localhost:8081",
  admin: process.env.ADMIN_SERVICE_URL || "http://localhost:8001",
};

/** Emri konsistent i shërbimit në Docker Compose (matching services). */
const serviceMap = {
  auth: process.env.AUTH_SERVICE_NAME || "auth-service",
  catalog: process.env.CATALOG_SERVICE_NAME || "catalog-service",
  order: process.env.ORDER_SERVICE_NAME || "order-service",
  inventory: process.env.INVENTORY_SERVICE_NAME || "inventory-service",
  admin: process.env.ADMIN_SERVICE_NAME || "admin-service",
};

function eurekaAppIds(serviceSlug) {
  const upperHyphen = serviceSlug.toUpperCase();
  const upperPacked = upperHyphen.replace(/-/g, "");
  return [upperHyphen, upperPacked];
}

async function lookupViaConsul(serviceName) {
  const consulUrl = process.env.CONSUL_URL?.replace(/\/$/, "");
  if (!consulUrl || !serviceMap[serviceName]) return null;
  try {
    const svc = serviceMap[serviceName];
    const response = await fetch(`${consulUrl}/v1/health/service/${encodeURIComponent(svc)}?passing=true`);
    if (!response.ok) return null;
    const nodes = await response.json();
    const first = nodes[0];
    if (!first || !first.Service) return null;
    const host = first.Service.Address || first.Node?.Address;
    const port = first.Service.Port;
    if (!host || !port) return null;
    return `http://${host}:${port}`;
  } catch {
    return null;
  }
}

function pickEurekaPort(portField) {
  if (portField == null) return null;
  if (typeof portField === "number") return portField;
  if (typeof portField === "object" && Object.prototype.hasOwnProperty.call(portField, "$"))
    return Number(portField.$);
  return Number(portField);
}

async function lookupViaEureka(serviceName) {
  const base = process.env.EUREKA_URL?.replace(/\/$/, "");
  if (!base || !serviceMap[serviceName]) return null;
  const slug = serviceMap[serviceName];
  for (const appId of eurekaAppIds(slug)) {
    try {
      const url = `${base}/apps/${encodeURIComponent(appId)}`;
      const response = await fetch(url, { headers: { Accept: "application/json" } });
      if (!response.ok) continue;
      const data = await response.json();
      let inst = data?.application?.instance;
      if (!inst) continue;
      inst = Array.isArray(inst) ? inst.find((i) => i?.status === "UP") || inst[0] : inst;
      if (!inst || inst.status && inst.status !== "UP") continue;
      const port = pickEurekaPort(inst.port);
      const host = inst.ipAddr || inst.hostName;
      if (!host || !port) continue;
      return `http://${host}:${port}`;
    } catch {
      /* continue */
    }
  }
  return null;
}

function getServiceUrl(serviceName) {
  return staticRegistry[serviceName] || null;
}

/**
 * Radha: Consul (nëse CONSUL_URL), Eureka (nëse EUREKA_URL), përfundimisht URL nga env/static.
 */
async function resolveServiceUrl(serviceName) {
  if (!staticRegistry.hasOwnProperty(serviceName)) return null;

  const order = (process.env.SERVICE_RESOLVER_ORDER || "consul,eureka,static")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

  for (const step of order) {
    if (step === "consul" && process.env.CONSUL_URL) {
      const fromConsul = await lookupViaConsul(serviceName);
      if (fromConsul) return fromConsul;
    }
    if (step === "eureka" && process.env.EUREKA_URL) {
      const fromEureka = await lookupViaEureka(serviceName);
      if (fromEureka) return fromEureka;
    }
    if (step === "static") {
      const s = getServiceUrl(serviceName);
      if (s) return s;
    }
  }
  return getServiceUrl(serviceName);
}

module.exports = { getServiceUrl, lookupViaConsul, lookupViaEureka, resolveServiceUrl };
