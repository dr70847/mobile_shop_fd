const Redis = require("ioredis");

let client;

function ttlSeconds() {
  const raw = Number(process.env.CATALOG_CACHE_TTL_SECONDS);
  return Number.isFinite(raw) && raw > 0 ? raw : 45;
}

function getClient() {
  const url = process.env.REDIS_URL;
  if (!url) return null;
  if (!client) client = new Redis(url, { maxRetriesPerRequest: 2 });
  return client;
}

async function getJson(key) {
  const redis = getClient();
  if (!redis) return null;
  try {
    const raw = await redis.get(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

async function setJson(key, value) {
  const redis = getClient();
  if (!redis) return;
  try {
    await redis.set(key, JSON.stringify(value), "EX", ttlSeconds());
  } catch {
    /* noop */
  }
}

async function del(key) {
  const redis = getClient();
  if (!redis) return;
  try {
    await redis.del(key);
  } catch {
    /* noop */
  }
}

async function invalidateProduct(productId) {
  await del(keys.list());
  if (productId != null && Number.isFinite(Number(productId))) {
    await del(keys.product(Number(productId)));
  }
}

const keys = {
  list: () => "mobileshop:catalog:products:list",
  product: (id) => `mobileshop:catalog:product:${Number(id)}`,
};

module.exports = { getJson, setJson, del, invalidateProduct, keys };
