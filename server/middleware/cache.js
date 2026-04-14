const cacheStore = new Map();

function cacheMiddleware(ttlSeconds = 30) {
  return (req, res, next) => {
    if (req.method !== "GET") {
      return next();
    }

    const key = `${req.originalUrl}`;
    const hit = cacheStore.get(key);
    const now = Date.now();

    if (hit && hit.expiresAt > now) {
      return res.json(hit.payload);
    }

    const originalJson = res.json.bind(res);
    res.json = (body) => {
      cacheStore.set(key, {
        payload: body,
        expiresAt: now + ttlSeconds * 1000,
      });
      return originalJson(body);
    };

    return next();
  };
}

module.exports = { cacheMiddleware };
