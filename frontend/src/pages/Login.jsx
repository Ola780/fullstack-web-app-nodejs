import React, { useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function Login() {
    const { t } = useTranslation();
    const { login } = useAuth();
    const nav = useNavigate();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [err, setErr] = useState("");

    const onSubmit = async (e) => {
        e.preventDefault();
        setErr("");
        if (!email.includes("@")) return setErr("Invalid email");
        if (!password) return setErr("Password required");
        try {
            await login(email, password);
            nav("/");
        } catch {
            setErr("Login failed");
        }
    };

    return (
        <div style={{ maxWidth: 360 }}>
            <h2>{t("auth.login")}</h2>
            <form onSubmit={onSubmit} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <input placeholder={t("auth.email")} value={email} onChange={(e) => setEmail(e.target.value)} />
                <input placeholder={t("auth.password")} type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
                {err && <div style={{ color: "crimson" }}>{err}</div>}
                <button type="submit">{t("auth.login")}</button>
            </form>
            <div style={{ marginTop: 10 }}>
                <Link to="/register">{t("auth.register")}</Link>
            </div>
        </div>
    );
}
