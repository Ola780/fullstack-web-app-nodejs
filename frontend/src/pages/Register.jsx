import React, { useState } from "react";
import { http } from "../api/http";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function Register() {
    const { t } = useTranslation();
    const nav = useNavigate();
    const [form, setForm] = useState({ name: "", surname: "", email: "", password: "", preferredLanguage: "pl" });
    const [err, setErr] = useState("");

    const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

    const onSubmit = async (e) => {
        e.preventDefault();
        setErr("");

        // Walidacja klienta
        if (!form.name || !form.surname) return setErr("Name and surname required");
        if (!form.email.includes("@")) return setErr("Invalid email");
        if (form.password.length < 6) return setErr("Password min 6 chars");

        try {
            await http.post("/auth/register", form);
            nav("/login");
        } catch {
            setErr("Registration failed");
        }
    };

    return (
        <div style={{ maxWidth: 420 }}>
            <h2>{t("auth.register")}</h2>
            <form onSubmit={onSubmit} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <input placeholder={t("auth.name")} value={form.name} onChange={(e) => set("name", e.target.value)} />
                <input placeholder={t("auth.surname")} value={form.surname} onChange={(e) => set("surname", e.target.value)} />
                <input placeholder={t("auth.email")} value={form.email} onChange={(e) => set("email", e.target.value)} />
                <input placeholder={t("auth.password")} type="password" value={form.password} onChange={(e) => set("password", e.target.value)} />
                <label>
                    {t("auth.lang")}{" "}
                    <select value={form.preferredLanguage} onChange={(e) => set("preferredLanguage", e.target.value)}>
                        <option value="pl">pl</option>
                        <option value="en">en</option>
                    </select>
                </label>
                {err && <div style={{ color: "crimson" }}>{err}</div>}
                <button type="submit">{t("auth.register")}</button>
            </form>
        </div>
    );
}
