const { Sequelize } = require("sequelize");

let sequelize;

function getSequelize() {
  if (sequelize) return sequelize;

  sequelize = new Sequelize(
    process.env.DB_NAME || "mobile_shop",
    process.env.DB_USER || "root",
    process.env.DB_PASSWORD || "",
    {
      host: process.env.DB_HOST || "localhost",
      port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
      dialect: "mysql",
      logging: false,
    }
  );

  return sequelize;
}

module.exports = { getSequelize };

