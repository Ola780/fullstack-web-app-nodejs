import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { http } from "../api/http";
import { useAuth } from "../auth/AuthContext";
import { useTranslation } from "react-i18next";

const isIsoDate = (v) => /^\d{4}-\d{2}-\d{2}$/.test(v);

export default function DriverForm() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { id } = useParams();
    const { role } = useAuth();

    const isEdit = !!id;
    const canCreateOrEdit = role === "MANAGER";

    const [form, setForm] = useState({
        name: "",
        dateOfBirth: "",
    });

    const [error, setError] = useState("");
    const [loading, setLoading] = useState(isEdit);

    useEffect(() => {
        if (!canCreateOrEdit) return;

        (async () => {
            try {
                if (isEdit) {
                    const r = await http.get(`/drivers/${id}`);
                    const d = r.data?.driver ?? r.data;

                    setForm({
                        name: d.name ?? "",
                        dateOfBirth: (d.dateOfBirth ?? "").slice(0, 10),
                    });
                }
            } catch {
                setError(t("drivers.form.loadError"));
            } finally {
                setLoading(false);
            }
        })();
    }, [id, isEdit, canCreateOrEdit, t]);

    const onChange = (e) =>
        setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

    const onSubmit = async (e) => {
        e.preventDefault();
        setError("");

        if (!canCreateOrEdit) {
            setError(t("common.forbidden"));
            return;
        }

        if (!form.name.trim()) return setError(t("drivers.form.validation.nameRequired"));
        if (!isIsoDate(form.dateOfBirth)) return setError(t("drivers.form.validation.dateFormat"));

        const payload = {
            name: form.name.trim(),
            dateOfBirth: form.dateOfBirth,
        };

        try {
            if (isEdit) await http.put(`/drivers/${id}`, payload);
            else await http.post("/drivers", payload);

            navigate("/drivers");
        } catch (err) {
            setError(err?.response?.data?.message || t("common.saveError"));
        }
    };

    if (!canCreateOrEdit) {
        return (
            <div style={{ padding: 16 }}>
                <h2>{t("nav.drivers")}</h2>
                <p>{t("drivers.form.noPermission")}</p>
            </div>
        );
    }

    if (loading) {
        return (
            <div style={{ padding: 16 }}>
                <h2>{isEdit ? t("drivers.form.editTitle") : t("drivers.form.createTitle")}</h2>
                <p>{t("common.loading")}</p>
            </div>
        );
    }

    return (
        <div style={{ padding: 16, maxWidth: 500 }}>
            <h2>{isEdit ? t("drivers.form.editTitle") : t("drivers.form.createTitle")}</h2>

            {error && <div style={{ color: "crimson", marginBottom: 12 }}>{error}</div>}

            <form onSubmit={onSubmit}>
                <div style={{ marginBottom: 12 }}>
                    <label>{t("drivers.fields.name")}</label>
                    <input
                        name="name"
                        value={form.name}
                        onChange={onChange}
                        style={{ width: "100%", padding: 8 }}
                    />
                </div>

                <div style={{ marginBottom: 12 }}>
                    <label>{t("drivers.fields.dateOfBirth")}</label>
                    <input
                        name="dateOfBirth"
                        placeholder="YYYY-MM-DD"
                        value={form.dateOfBirth}
                        onChange={onChange}
                        style={{ width: "100%", padding: 8 }}
                    />
                </div>

                <div style={{ display: "flex", gap: 8 }}>
                    <button type="submit">{t("common.save")}</button>
                    <button type="button" onClick={() => navigate("/drivers")}>
                        {t("common.cancel")}
                    </button>
                </div>
            </form>
        </div>
    );
}
