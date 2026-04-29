const { defineUserModel } = require("../db/models/User");

function createSequelizeUserRepository() {
  const User = defineUserModel();

  return {
    async findByEmail(email) {
      const row = await User.findOne({ where: { email }, raw: true });
      if (!row) return null;
      return {
        id: row.id,
        name: row.NAME ?? row.name ?? "",
        email: row.email,
        is_admin: row.is_admin ?? row.isAdmin ?? false,
        password_hash: row.PASSWORD ?? row.passwordHash ?? "",
      };
    },

    async findById(id) {
      return User.findByPk(Number(id), {
        attributes: ["id", ["NAME", "name"], "email", ["is_admin", "is_admin"], ["created_at", "created_at"]],
        raw: true,
      });
    },

    async create({ name, email, passwordHash }) {
      const created = await User.create({ name, email, passwordHash, isAdmin: false });
      return { id: created.id };
    },
  };
}

module.exports = { createSequelizeUserRepository };

