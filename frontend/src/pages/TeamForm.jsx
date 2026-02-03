import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { http } from "../api/http";
import { useAuth } from "../auth/AuthContext";
import { useTranslation } from "react-i18next";

export default function TeamForm() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { role } = useAuth();

    const isAdmin = role === "ADMIN";

    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const [form, setForm] = useState({
        name: "",
        manager: "",
    });

    useEffect(() => {
        if (!isAdmin) return;

        (async () => {
            setError("");
            setLoading(true);
            try {
                const res = await http.get("/teams/managers");
                setUsers(Array.isArray(res.data) ? res.data : []);

            } catch {
                setError(t("teams.form.loadError"));
            } finally {
                setLoading(false);
            }
        })();
    }, [isAdmin, t]);

    const managers = users;

    const onChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

    const onSubmit = async (e) => {
        e.preventDefault();
        setError("");

        if (!isAdmin) {
            setError(t("common.forbidden"));
            return;
        }

        if (!form.name.trim()) return setError(t("teams.form.validation.nameRequired"));

        const payload = {
            name: form.name.trim(),
            manager: form.manager ? Number(form.manager) : null,
        };


        setSaving(true);
        try {
            await http.post("/teams", payload);
            navigate("/teams");
        } catch (err) {
            setError(err?.response?.data?.message || t("teams.form.createFailed"));
        } finally {
            setSaving(false);
        }
    };

    if (!isAdmin) {
        return (
            <div style={{ padding: 16 }}>
                <h2>{t("nav.teams")}</h2>
                <p>{t("common.forbidden")}</p>
            </div>
        );
    }

    if (loading) {
        return (
            <div style={{ padding: 16 }}>
                <h2>{t("teams.form.createTitle")}</h2>
                <p>{t("common.loading")}</p>
                {error && <div style={{ color: "crimson" }}>{error}</div>}
            </div>
        );
    }

    return (
        <div style={{ padding: 16, maxWidth: 520 }}>
            <h2>{t("teams.form.createTitle")}</h2>

            {error && <div style={{ color: "crimson", marginBottom: 12 }}>{error}</div>}

            <form onSubmit={onSubmit} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <input
                    name="name"
                    placeholder={t("teams.fields.name")}
                    value={form.name}
                    onChange={onChange}
                />

                <label>
                    {t("teams.fields.manager")}{" "}
                    <select name="manager" value={form.manager} onChange={onChange}>
                        <option value="">{t("teams.form.manager.none")}</option>
                        {managers.map((m) => (
                            <option key={m.id} value={m.id}>
                                {m.name} {m.surname} (#{m.id})
                            </option>
                        ))}
                    </select>
                </label>

                <div style={{ display: "flex", gap: 8 }}>
                    <button type="submit" disabled={saving}>
                        {saving ? t("common.saving") : t("common.save")}
                    </button>
                    <button type="button" onClick={() => navigate("/teams")}>
                        {t("common.cancel")}
                    </button>
                </div>
            </form>
        </div>
    );
}
