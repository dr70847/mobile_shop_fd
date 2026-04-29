const { OrderStatus } = require("./OrderStatus");

function createNewOrder({ userId, totalPrice }) {
  return {
    userId: Number(userId),
    totalPrice: Number(totalPrice),
    status: OrderStatus.NEW,
  };
}

module.exports = { createNewOrder };

