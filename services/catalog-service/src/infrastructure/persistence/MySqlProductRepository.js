const { createSequelizeProductRepository } = require("./SequelizeProductRepository");

function createMySqlProductRepository() {
  return createSequelizeProductRepository();
}

module.exports = { createMySqlProductRepository };

