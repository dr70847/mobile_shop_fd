const path = require("path");
const grpc = require("@grpc/grpc-js");
const protoLoader = require("@grpc/proto-loader");
const products = require("../persistence/productRepository");

const packageDef = protoLoader.loadSync(path.join(__dirname, "../proto/catalog.proto"), {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});
const grpcObject = grpc.loadPackageDefinition(packageDef);
const catalogPackage = grpcObject.catalog;

async function getProductsByIds(call, callback) {
  try {
    const ids = Array.isArray(call.request?.ids)
      ? call.request.ids.map((id) => Number(id)).filter((id) => Number.isFinite(id) && id > 0)
      : [];
    if (!ids.length) {
      return callback(null, { products: [] });
    }
    const rows = await products.getManyByIds(ids);
    const mapped = rows.map((row) => ({
      id: Number(row.id),
      price: Number(row.price || 0),
      stock: Number(row.stock || 0),
    }));
    return callback(null, { products: mapped });
  } catch (err) {
    return callback({
      code: grpc.status.INTERNAL,
      message: err.message || "gRPC catalog error",
    });
  }
}

function startCatalogGrpcServer() {
  const server = new grpc.Server();
  server.addService(catalogPackage.CatalogService.service, { GetProductsByIds: getProductsByIds });
  const grpcPort = process.env.GRPC_PORT ? Number(process.env.GRPC_PORT) : 50052;

  server.bindAsync(`0.0.0.0:${grpcPort}`, grpc.ServerCredentials.createInsecure(), (error) => {
    if (error) {
      console.error("Failed to start gRPC catalog server", error);
      return;
    }
    server.start();
    console.log(`catalog-service gRPC running on 0.0.0.0:${grpcPort}`);
  });
}

module.exports = { startCatalogGrpcServer };
