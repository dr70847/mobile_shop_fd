import React, { useContext } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { AuthContext } from "../auth/AuthContext";

function isAdminUser(user) {
  if (!user) return false;
  return user.is_admin === true || user.is_admin === 1;
}

export default function RequireAdmin({ children }) {
  const { user, loading } = useContext(AuthContext);
  const location = useLocation();

  if (loading) return null;
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  if (!isAdminUser(user)) return <Navigate to="/" replace />;
  return children;
}
