import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";

export default function ProtectedRoute({ children, roles }) {
    const { isLoggedIn, role } = useAuth();
    const location = useLocation();

    if (!isLoggedIn) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (!role) {
        return <div style={{ padding: 16 }}>Ładowanie...</div>;
    }

    if (roles && !roles.includes(role)) {
        return <Navigate to="/403" replace />;
    }

    return children;
}
