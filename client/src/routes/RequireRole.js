import React, { useContext } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { AuthContext } from "../auth/AuthContext";
import { hasRoleAccess } from "../utils/roles";

export default function RequireRole({ children, allowedRoles }) {
  const { user, loading } = useContext(AuthContext);
  const location = useLocation();

  if (loading) return null;
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  if (!hasRoleAccess(user, allowedRoles)) return <Navigate to="/" replace />;
  return children;
}
