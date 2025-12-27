import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { http, setAuthToken } from "../api/http";
import i18n from "../i18n/i18n";

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
    const [token, setToken] = useState(localStorage.getItem("token"));
    const [me, setMe] = useState(null);

    useEffect(() => {
        setAuthToken(token);
        if (!token) {
            setMe(null);
            return;
        }

        http.get("/auth/me")
            .then(r => {
                setMe(r.data);
                if (r.data?.preferredLanguage) {
                    i18n.changeLanguage(r.data.preferredLanguage);
                }
            })
            .catch(() => {
                localStorage.removeItem("token");
                setToken(null);
                setMe(null);
            });
    }, [token]);

    async function login(email, password) {
        const r = await http.post("/auth/login", { email, password });
        localStorage.setItem("token", r.data.token);
        setToken(r.data.token);
    }

    function logout() {
        localStorage.removeItem("token");
        setToken(null);
        setMe(null);
        setAuthToken(null);
    }

    const value = {
        token,
        me,
        isLoggedIn: token && me,
        role: me?.roleName ,
        login,
        logout
    };

    return (
        <AuthCtx.Provider value={value}>
            {children}
        </AuthCtx.Provider>
    );
}

export function useAuth() {
    return useContext(AuthCtx);
}
