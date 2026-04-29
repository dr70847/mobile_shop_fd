const { getProductsByIds } = require("../../persistence/catalogReadRepository");

function createMySqlProductQuery() {
  return {
    getProductsByIds(ids) {
      return getProductsByIds(ids);
    },
  };
}

module.exports = { createMySqlProductQuery };

