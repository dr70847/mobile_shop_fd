const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", "..", ".env") });
const db = require("../config/db");

db.query("DESCRIBE orders", (err, rows) => {
  console.log("DESCRIBE orders:", err ? err.code || err.message : null, rows);
  process.exit(0);
});

