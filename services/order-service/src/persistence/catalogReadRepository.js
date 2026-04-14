const db = require("../integration/db");

function getProductsByIds(ids) {
  return new Promise((resolve, reject) => {
    db.query("SELECT id, price FROM products WHERE id IN (?)", [ids], (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
}

module.exports = { getProductsByIds };
