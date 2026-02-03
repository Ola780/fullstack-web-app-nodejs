import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { http } from "../api/http";
import { useTranslation } from "react-i18next";

const isIsoDate = (v) => /^\d{4}-\d{2}-\d{2}$/.test(v);

export default function RaceForm() {
    const { t } = useTranslation();

    const navigate = useNavigate();
    const { id } = useParams();

    const isEdit = !!id;

    const [form, setForm] = useState({ name: "", startDate: "", status: "Planned" });
    const [loading, setLoading] = useState(isEdit);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!isEdit) return;

        (async () => {
            setError("");
            setLoading(true);
            try {
                const res = await http.get(`/races/${id}`);
                const r = res.data?.race ?? res.data;

                setForm({
                    name: r?.name ?? "",
                    startDate: typeof r?.startDate === "string" ? r.startDate.slice(0, 10) : "",
                    status: r?.status ?? "Planned",
                });
            } catch {
                setError(t("races.form.loadError"));
            } finally {
                setLoading(false);
            }
        })();
    }, [isEdit, id, t]);

    const onChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

    const onSubmit = async (e) => {
        e.preventDefault();
        setError("");

        const name = form.name.trim();
        if (!name) return setError(t("races.form.validation.nameRequired"));
        if (!isIsoDate(form.startDate)) return setError(t("races.form.validation.startDateFormat"));

        const payload = { name, startDate: form.startDate, status: form.status };

        setSubmitting(true);
        try {
            if (isEdit) {
                await http.put(`/races/${id}`, payload);
                navigate(`/races/${id}`);
            } else {
                const res = await http.post("/races", payload);
                navigate(res.data?.id ? `/races/${res.data.id}` : "/races");
            }
        } catch (err) {
            setError(err?.response?.data?.message || t("races.form.saveError"));
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div style={{ padding: 16 }}>
                <h2>{isEdit ? t("races.form.editTitle") : t("races.form.createTitle")}</h2>
                <p>{t("common.loading")}</p>
                {error && <p style={{ color: "crimson" }}>{error}</p>}
            </div>
        );
    }

    return (
        <div style={{ padding: 16, maxWidth: 520 }}>
            <div className="hero" style={{ backgroundImage: "url(/images/races.jpg)" }} />

            <h2>{isEdit ? t("races.form.editTitle") : t("races.form.createTitle")}</h2>
            {error && <div style={{ color: "crimson", marginBottom: 12 }}>{error}</div>}

            <form onSubmit={onSubmit}>
                <div style={{ marginBottom: 12 }}>
                    <label style={{ display: "block", marginBottom: 4 }}>{t("races.fields.name")}</label>
                    <input
                        name="name"
                        value={form.name}
                        onChange={onChange}
                        style={{ width: "100%", padding: 8 }}
                    />
                </div>

                <div style={{ marginBottom: 12 }}>
                    <label style={{ display: "block", marginBottom: 4 }}>{t("races.fields.startDate")}</label>
                    <input
                        name="startDate"
                        value={form.startDate}
                        onChange={onChange}
                        placeholder="YYYY-MM-DD"
                        style={{ width: "100%", padding: 8 }}
                    />
                </div>

                <div style={{ marginBottom: 12 }}>
                    <label style={{ display: "block", marginBottom: 4 }}>{t("races.fields.status")}</label>
                    <select
                        name="status"
                        value={form.status}
                        onChange={onChange}
                        style={{ width: "100%", padding: 8 }}
                    >
                        <option value="Planned">{t("races.status.Planned")}</option>
                        <option value="Ongoing">{t("races.status.Ongoing")}</option>
                        <option value="Finished">{t("races.status.Finished")}</option>
                        <option value="Cancelled">{t("races.status.Cancelled")}</option>
                    </select>
                </div>

                <div style={{ display: "flex", gap: 8 }}>
                    <button type="submit" disabled={submitting} style={{ padding: "8px 12px" }}>
                        {submitting ? t("common.saving") : t("common.save")}
                    </button>
                    <button type="button" onClick={() => navigate("/races")} style={{ padding: "8px 12px" }}>
                        {t("common.cancel")}
                    </button>
                </div>
            </form>
        </div>
    );
}
