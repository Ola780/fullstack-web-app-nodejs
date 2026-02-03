import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { useTranslation } from "react-i18next";

export default function Login() {
    const { t } = useTranslation();
    const { login } = useAuth();
    const navigate = useNavigate();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    const onSubmit = async (e) => {
        e.preventDefault();
        setError("");

        if (!email.includes("@")) {
            return setError(t("auth.validation.invalidEmail"));
        }
        if (!password) {
            return setError(t("auth.validation.passwordRequired"));
        }

        try {
            await login(email, password);
            navigate("/");
        } catch {
            setError(t("auth.loginFailed"));
        }
    };

    return (
        <div style={{ maxWidth: 360 }}>
            <div
                className="hero"
                style={{
                    backgroundImage: "url(/images/flags.jpg)",
                }}
            />

            <h2>{t("auth.login")}</h2>

            <form onSubmit={onSubmit} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <input
                    placeholder={t("auth.email")}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />

                <input
                    type="password"
                    placeholder={t("auth.password")}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />

                {error && <div style={{ color: "crimson" }}>{error}</div>}

                <button type="submit">{t("auth.login")}</button>
            </form>
        </div>
    );
}
