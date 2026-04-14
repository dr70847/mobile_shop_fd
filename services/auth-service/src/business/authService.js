const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const users = require("../persistence/userRepository");

function signToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      name: user.name || "",
      is_admin: Boolean(user.is_admin),
    },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
}

async function signup({ name, email, password }) {
  const existing = await users.findByEmail(email);
  if (existing) {
    const err = new Error("Email is already registered.");
    err.status = 409;
    throw err;
  }
  const passwordHash = await bcrypt.hash(password, 10);
  const created = await users.create({ name, email, passwordHash });
  const user = { id: created.id, name, email, is_admin: false };
  return { token: signToken(user), user };
}

async function login({ email, password }) {
  const userRow = await users.findByEmail(email);
  if (!userRow) {
    const err = new Error("Invalid email or password.");
    err.status = 401;
    throw err;
  }
  const ok = await bcrypt.compare(password, userRow.PASSWORD || "");
  if (!ok) {
    const err = new Error("Invalid email or password.");
    err.status = 401;
    throw err;
  }
  const user = {
    id: userRow.id,
    name: userRow.NAME,
    email: userRow.email,
    is_admin: Boolean(userRow.is_admin),
  };
  return { token: signToken(user), user };
}

async function me(userId) {
  const user = await users.findById(userId);
  if (!user) {
    const err = new Error("User not found.");
    err.status = 404;
    throw err;
  }
  user.is_admin = Boolean(user.is_admin);
  return { user };
}

module.exports = { signup, login, me };
