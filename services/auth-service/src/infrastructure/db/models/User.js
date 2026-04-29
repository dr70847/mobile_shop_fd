const { DataTypes } = require("sequelize");
const { getSequelize } = require("../sequelize");

function defineUserModel() {
  const sequelize = getSequelize();

  return (
    sequelize.models.User ||
    sequelize.define(
      "User",
      {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        name: { type: DataTypes.STRING, field: "NAME" },
        email: { type: DataTypes.STRING },
        passwordHash: { type: DataTypes.STRING, field: "PASSWORD" },
        isAdmin: { type: DataTypes.BOOLEAN, field: "is_admin" },
        createdAt: { type: DataTypes.DATE, field: "created_at" },
      },
      {
        tableName: "users",
        timestamps: false,
      }
    )
  );
}

module.exports = { defineUserModel };

