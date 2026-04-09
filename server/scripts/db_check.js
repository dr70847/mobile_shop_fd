const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", "..", ".env") });
const db = require("../config/db");

db.query('SHOW TABLES LIKE "users"', (err, rows) => {
  console.log("SHOW TABLES LIKE users:", err ? err.code || err.message : null, rows);

  db.query("DESCRIBE users", (err2, rows2) => {
    console.log("DESCRIBE users:", err2 ? err2.code || err2.message : null, rows2);
    process.exit(0);
  });
});

