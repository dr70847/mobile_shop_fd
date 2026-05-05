const path = require("path");
const grpc = require("@grpc/grpc-js");
const protoLoader = require("@grpc/proto-loader");
const CircuitBreaker = require("opossum");

const packageDef = protoLoader.loadSync(path.join(__dirname, "../proto/catalog.proto"), {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

const grpcObject = grpc.loadPackageDefinition(packageDef);
const catalogPackage = grpcObject.catalog;

function buildClient() {
  const target = process.env.INVENTORY_GRPC_URL || process.env.CATALOG_GRPC_URL || "localhost:50052";
  return new catalogPackage.CatalogService(target, grpc.credentials.createInsecure());
}

const clientRef = { current: null };

function getClient() {
  if (!clientRef.current) clientRef.current = buildClient();
  return clientRef.current;
}

function rawCheckAvailability(ids) {
  return new Promise((resolve, reject) => {
    getClient().GetProductsByIds({ ids }, (err, response) => {
      if (err) return reject(err);
      resolve(Array.isArray(response?.products) ? response.products : []);
    });
  });
}

const breakerOptions = {
  timeout: Number(process.env.GRPC_CB_TIMEOUT_MS) || 3000,
  errorThresholdPercentage: Number(process.env.GRPC_CB_ERROR_THRESHOLD) || 50,
  resetTimeout: Number(process.env.GRPC_CB_RESET_MS) || 15_000,
  volumeThreshold: Number(process.env.GRPC_CB_VOLUME_THRESHOLD) || 4,
};

const grpcBreaker = new CircuitBreaker(rawCheckAvailability, breakerOptions);

grpcBreaker.on("open", () => {
  console.warn("[circuit-breaker] gRPC catalog: OPEN — using REST fallback on next checkout errors");
});
grpcBreaker.on("halfOpen", () => console.warn("[circuit-breaker] gRPC catalog: HALF_OPEN"));
grpcBreaker.on("close", () => console.warn("[circuit-breaker] gRPC catalog: CLOSED"));

function checkAvailability(ids) {
  return grpcBreaker.fire(ids);
}

module.exports = { checkAvailability, grpcBreaker };
