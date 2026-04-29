const productRepository = require("../../persistence/productRepository");

function createMySqlProductRepository() {
  return productRepository;
}

module.exports = { createMySqlProductRepository };

