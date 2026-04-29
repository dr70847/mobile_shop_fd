function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function createUser({ id, name, email, isAdmin }) {
  const cleanName = String(name || "").trim();
  const cleanEmail = normalizeEmail(email);
  return {
    id: Number(id),
    name: cleanName,
    email: cleanEmail,
    is_admin: Boolean(isAdmin),
  };
}

module.exports = { createUser, normalizeEmail };

