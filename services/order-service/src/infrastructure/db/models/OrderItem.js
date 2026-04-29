const { DataTypes } = require("sequelize");
const { getSequelize } = require("../sequelize");

function defineOrderItemModel() {
  const sequelize = getSequelize();

  return (
    sequelize.models.OrderItem ||
    sequelize.define(
      "OrderItem",
      {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        orderId: { type: DataTypes.INTEGER, field: "order_id" },
        productId: { type: DataTypes.INTEGER, field: "product_id" },
        quantity: { type: DataTypes.INTEGER },
        unitPrice: { type: DataTypes.DECIMAL(10, 2), field: "unit_price" },
      },
      {
        tableName: "order_items",
        timestamps: false,
      }
    )
  );
}

module.exports = { defineOrderItemModel };

