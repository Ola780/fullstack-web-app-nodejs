import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { http } from "../api/http";
import { useTranslation } from "react-i18next";

export default function Register() {
    const { t } = useTranslation();
    const navigate = useNavigate();

    const [form, setForm] = useState({
        name: "",
        surname: "",
        email: "",
        password: "",
        preferredLanguage: "pl",
    });
    const [error, setError] = useState("");

    const onChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const onSubmit = async (e) => {
        e.preventDefault();
        setError("");

        if (!form.name || !form.surname) {
            return setError(t("auth.validation.nameSurnameRequired"));
        }
        if (!form.email.includes("@")) {
            return setError(t("auth.validation.invalidEmail"));
        }
        if (form.password.length < 6) {
            return setError(t("auth.validation.passwordMin"));
        }

        try {
            await http.post("/auth/register", form);
            navigate("/login");
        } catch {
            setError(t("auth.registerFailed"));
        }
    };

    return (
        <div style={{ maxWidth: 420 }}>
            <h2>{t("auth.register")}</h2>

            <form onSubmit={onSubmit} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <input
                    name="name"
                    placeholder={t("auth.name")}
                    value={form.name}
                    onChange={onChange}
                />

                <input
                    name="surname"
                    placeholder={t("auth.surname")}
                    value={form.surname}
                    onChange={onChange}
                />

                <input
                    name="email"
                    placeholder={t("auth.email")}
                    value={form.email}
                    onChange={onChange}
                />

                <input
                    type="password"
                    name="password"
                    placeholder={t("auth.password")}
                    value={form.password}
                    onChange={onChange}
                />

                <label>
                    {t("auth.lang")}
                    <select
                        name="preferredLanguage"
                        value={form.preferredLanguage}
                        onChange={onChange}
                        style={{ marginLeft: 8 }}
                    >
                        <option value="pl">pl</option>
                        <option value="en">en</option>
                    </select>
                </label>

                {error && <div style={{ color: "crimson" }}>{error}</div>}

                <button type="submit">{t("auth.register")}</button>
            </form>
        </div>
    );
}
