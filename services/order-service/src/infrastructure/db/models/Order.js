const { DataTypes } = require("sequelize");
const { getSequelize } = require("../sequelize");

function defineOrderModel() {
  const sequelize = getSequelize();

  return (
    sequelize.models.Order ||
    sequelize.define(
      "Order",
      {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        userId: { type: DataTypes.INTEGER, field: "user_id" },
        totalPrice: { type: DataTypes.DECIMAL(10, 2), field: "total_price" },
        status: { type: DataTypes.STRING, field: "STATUS" },
        createdAt: { type: DataTypes.DATE, field: "created_at" },
      },
      {
        tableName: "orders",
        timestamps: false,
      }
    )
  );
}

module.exports = { defineOrderModel };

