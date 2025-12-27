import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthContext";

export default function ProtectedRoute({ children, roles }) {
    const { isLoggedIn, role } = useAuth();

    if (!isLoggedIn) return <Navigate to="/login" replace />;
    if (roles && !roles.includes(role)) return <Navigate to="/" replace />;
    return children;
}
