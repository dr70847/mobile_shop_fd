const path = require("path");
const grpc = require("@grpc/grpc-js");
const protoLoader = require("@grpc/proto-loader");

const packageDef = protoLoader.loadSync(path.join(__dirname, "../proto/catalog.proto"), {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

const grpcObject = grpc.loadPackageDefinition(packageDef);
const catalogPackage = grpcObject.catalog;
const target = process.env.INVENTORY_GRPC_URL || "localhost:50052";
const client = new catalogPackage.CatalogService(target, grpc.credentials.createInsecure());

function checkAvailability(ids) {
  return new Promise((resolve, reject) => {
    client.GetProductsByIds({ ids }, (err, response) => {
      if (err) return reject(err);
      resolve(Array.isArray(response?.products) ? response.products : []);
    });
  });
}

module.exports = { checkAvailability };
