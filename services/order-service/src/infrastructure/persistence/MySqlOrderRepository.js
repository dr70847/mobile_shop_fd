const { createSequelizeOrderRepository } = require("./SequelizeOrderRepository");

function createMySqlOrderRepository() {
  return createSequelizeOrderRepository();
}

module.exports = { createMySqlOrderRepository };

