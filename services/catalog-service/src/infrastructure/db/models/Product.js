const { DataTypes } = require("sequelize");
const { getSequelize } = require("../sequelize");

function defineProductModel() {
  const sequelize = getSequelize();

  return (
    sequelize.models.Product ||
    sequelize.define(
      "Product",
      {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        name: { type: DataTypes.STRING, field: "NAME" },
        description: { type: DataTypes.TEXT },
        price: { type: DataTypes.DECIMAL(10, 2) },
        stock: { type: DataTypes.INTEGER },
        createdAt: { type: DataTypes.DATE, field: "created_at" },
      },
      {
        tableName: "products",
        timestamps: false,
      }
    )
  );
}

module.exports = { defineProductModel };

