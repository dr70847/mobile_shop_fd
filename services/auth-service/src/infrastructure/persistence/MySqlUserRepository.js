const { createSequelizeUserRepository } = require("./SequelizeUserRepository");

function createMySqlUserRepository() {
  return createSequelizeUserRepository();
}

module.exports = { createMySqlUserRepository };

