const bcrypt = require("bcryptjs");

function createPasswordHasher() {
  return {
    async hash(password) {
      return bcrypt.hash(String(password || ""), 10);
    },
    async compare(password, passwordHash) {
      return bcrypt.compare(String(password || ""), String(passwordHash || ""));
    },
  };
}

module.exports = { createPasswordHasher };

