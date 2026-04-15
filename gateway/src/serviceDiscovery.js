const staticRegistry = {
  auth: process.env.AUTH_SERVICE_URL || "http://localhost:4001",
  catalog: process.env.CATALOG_SERVICE_URL || "http://localhost:4002",
  order: process.env.ORDER_SERVICE_URL || "http://localhost:4003",
  inventory: process.env.INVENTORY_SERVICE_URL || "http://localhost:8081",
  admin: process.env.ADMIN_SERVICE_URL || "http://localhost:8001",
};

const serviceMap = {
  auth: process.env.AUTH_SERVICE_NAME || "auth-service",
  catalog: process.env.CATALOG_SERVICE_NAME || "catalog-service",
  order: process.env.ORDER_SERVICE_NAME || "order-service",
  inventory: process.env.INVENTORY_SERVICE_NAME || "inventory-service",
  admin: process.env.ADMIN_SERVICE_NAME || "admin-service",
};

async function lookupViaConsul(serviceName) {
  const consulUrl = process.env.CONSUL_URL;
  if (!consulUrl || !serviceMap[serviceName]) return null;
  try {
    const response = await fetch(`${consulUrl}/v1/health/service/${serviceMap[serviceName]}?passing=true`);
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

function getServiceUrl(serviceName) {
  return staticRegistry[serviceName] || null;
}

module.exports = { getServiceUrl, lookupViaConsul };
