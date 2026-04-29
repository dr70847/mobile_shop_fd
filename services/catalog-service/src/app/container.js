const { createProductService } = require("../application/services/ProductService");
const { createMySqlProductRepository } = require("../infrastructure/persistence/MySqlProductRepository");

function createContainer() {
  const productRepo = createMySqlProductRepository();
  const productService = createProductService({ productRepo });
  return { productService };
}

module.exports = { createContainer };

