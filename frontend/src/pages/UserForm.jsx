import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { http } from "../api/http";
import { useTranslation } from "react-i18next";

export default function UserForm() {
    const { t } = useTranslation();
    const navigate = useNavigate();

    const [drivers, setDrivers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const [form, setForm] = useState({
        name: "",
        surname: "",
        email: "",
        password: "",
        preferredLanguage: "pl",
        roleName: "DRIVER",
        driver: "",
    });

    useEffect(() => {
        (async () => {
            try {
                const res = await http.get("/drivers/available");
                setDrivers(Array.isArray(res.data) ? res.data : []);
            } catch {
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const onChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const onSubmit = async (e) => {
        e.preventDefault();
        setError("");

        if (!form.name.trim() || !form.surname.trim()) return setError(t("users.form.validation.nameSurnameRequired"));
        if (!form.email.includes("@")) return setError(t("auth.validation.invalidEmail"));
        if (form.password.length < 4) return setError(t("users.form.validation.passwordMin4"));

        const payload = {
            name: form.name.trim(),
            surname: form.surname.trim(),
            email: form.email.trim(),
            password: form.password,
            preferredLanguage: form.preferredLanguage,
            roleName: form.roleName,
            driver: form.roleName === "DRIVER" && form.driver ? Number(form.driver) : null,
        };

        setSaving(true);
        try {
            await http.post("/users", payload);
            navigate("/admin/users");
        } catch (err) {
            setError(err?.response?.data?.message || t("users.form.createFailed"));
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div style={{ padding: 16 }}>{t("common.loading")}</div>;

    return (
        <div style={{ padding: 16, maxWidth: 560 }}>
            <h2>{t("users.form.createTitle")}</h2>

            {error && <div style={{ color: "crimson", marginBottom: 12 }}>{error}</div>}

            <form onSubmit={onSubmit} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <input name="name" placeholder={t("auth.name")} value={form.name} onChange={onChange} />
                <input name="surname" placeholder={t("auth.surname")} value={form.surname} onChange={onChange} />
                <input name="email" placeholder={t("auth.email")} value={form.email} onChange={onChange} />
                <input
                    name="password"
                    type="password"
                    placeholder={t("auth.password")}
                    value={form.password}
                    onChange={onChange}
                />

                <label>
                    {t("auth.lang")}{" "}
                    <select name="preferredLanguage" value={form.preferredLanguage} onChange={onChange}>
                        <option value="pl">pl</option>
                        <option value="en">en</option>
                    </select>
                </label>

                <label>
                    {t("users.form.role")}{" "}
                    <select name="roleName" value={form.roleName} onChange={onChange}>
                        <option value="DRIVER">{t("roles.DRIVER")}</option>
                        <option value="MANAGER">{t("roles.MANAGER")}</option>
                    </select>
                </label>

                {form.roleName === "DRIVER" && (
                    <label>
                        {t("users.form.driver")}{" "}
                        <select name="driver" value={form.driver} onChange={onChange}>
                            <option value="">{t("users.form.driver.none")}</option>
                            {drivers.map((d) => (
                                <option key={d.id} value={d.id}>
                                    {d.name} (#{d.id})
                                </option>
                            ))}
                        </select>
                    </label>
                )}

                <div style={{ display: "flex", gap: 8 }}>
                    <button type="submit" disabled={saving}>
                        {saving ? t("common.saving") : t("common.save")}
                    </button>
                    <button type="button" onClick={() => navigate("/admin/users")}>
                        {t("common.cancel")}
                    </button>
                </div>
            </form>
        </div>
    );
}
