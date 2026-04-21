export function getUserRole(user) {
  if (!user) return "guest";
  const explicitRole = String(user.role || user.user_role || "").toLowerCase();
  if (explicitRole === "admin" || explicitRole === "manager" || explicitRole === "user") {
    return explicitRole;
  }
  if (user.is_admin === true || user.is_admin === 1) return "admin";
  return "user";
}

export function hasRoleAccess(user, allowedRoles) {
  const role = getUserRole(user);
  return allowedRoles.includes(role);
}
