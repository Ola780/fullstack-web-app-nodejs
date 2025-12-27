import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { http } from "../api/http";
import { useTranslation } from "react-i18next";

function isIsoDate(value) {
    return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export default function RaceForm() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const params = useParams();

    const isEdit = Boolean(params.id);
    const raceId = isEdit ? Number(params.id) : null;

    const [loading, setLoading] = useState(isEdit);
    const [submitting, setSubmitting] = useState(false);

    const [serverError, setServerError] = useState("");
    const [errors, setErrors] = useState({});

    const [form, setForm] = useState({
        name: "",
        startDate: "",
        status: "Planned",
    });

    // --- load data for edit ---
    useEffect(() => {
        if (!isEdit) return;

        let mounted = true;

        async function loadRace() {
            setLoading(true);
            setServerError("");

            try {
                const res = await http.get(`/races/${raceId}`);

                // Dostosowanie do możliwych formatów:
                // 1) RaceDetails może zwracać { race, enrollments }
                // 2) albo sam obiekt race
                const r = res.data?.race ?? res.data;

                if (!r) throw new Error("No race in response");

                const startDate = r.startDate ? String(r.startDate).slice(0, 10) : "";

                if (mounted) {
                    setForm({
                        name: r.name ?? "",
                        startDate,
                        status: r.status ?? "Planned",
                    });
                }
            } catch (e) {
                if (mounted) setServerError("Nie udało się pobrać danych wyścigu do edycji.");
            } finally {
                if (mounted) setLoading(false);
            }
        }

        loadRace();
        return () => { mounted = false; };
    }, [isEdit, raceId]);

    const validate = () => {
        const next = {};

        const name = form.name.trim();
        if (!name) next.name = "Nazwa wyścigu jest wymagana.";
        else if (name.length > 30) next.name = "Maksymalnie 30 znaków.";

        if (!isIsoDate(form.startDate)) {
            next.startDate = "Data startu musi być w formacie RRRR-MM-DD.";
        }

        // Statusy – dopasuj do tego, co masz w bazie
        const allowed = ["Planned", "Ongoing", "Finished", "Cancelled"];
        if (!allowed.includes(form.status)) {
            next.status = "Nieprawidłowy status.";
        }

        setErrors(next);
        return Object.keys(next).length === 0;
    };

    const canSubmit = useMemo(() => {
        return !loading && !submitting;
    }, [loading, submitting]);

    const onChange = (e) => {
        const { name, value } = e.target;
        setForm((p) => ({ ...p, [name]: value }));
    };

    const onSubmit = async (e) => {
        e.preventDefault();
        setServerError("");

        if (!validate()) return;

        setSubmitting(true);
        try {
            const payload = {
                name: form.name.trim(),
                startDate: form.startDate,
                status: form.status,
            };

            if (isEdit) {
                await http.put(`/races/${raceId}`, payload);
                navigate(`/races/${raceId}`);
            } else {
                const res = await http.post("/races", payload);
                // jeśli backend zwraca {id}, to przejdź do szczegółów; jak nie, to do listy
                const newId = res.data?.id;
                if (newId) navigate(`/races/${newId}`);
                else navigate("/races");
            }
        } catch (err) {
            const msg =
                err?.response?.data?.message ||
                "Nie udało się zapisać wyścigu. Sprawdź dane i spróbuj ponownie.";
            setServerError(msg);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div style={{ padding: 16 }}>
                <h2>{isEdit ? "Edytuj wyścig" : "Dodaj wyścig"}</h2>
                <p>Ładowanie...</p>
                {serverError && <p style={{ color: "crimson" }}>{serverError}</p>}
            </div>
        );
    }

    return (
        <div style={{ padding: 16, maxWidth: 520 }}>
            <h2>{isEdit ? "Edytuj wyścig" : "Dodaj wyścig"}</h2>

            {serverError && (
                <div style={{ marginBottom: 12, color: "crimson" }}>
                    {serverError}
                </div>
            )}

            <form onSubmit={onSubmit}>
                <div style={{ marginBottom: 12 }}>
                    <label style={{ display: "block", marginBottom: 4 }}>Nazwa</label>
                    <input
                        name="name"
                        value={form.name}
                        onChange={onChange}
                        placeholder="np. Grand Prix Warsaw"
                        style={{ width: "100%", padding: 8 }}
                    />
                    {errors.name && <div style={{ color: "crimson", marginTop: 4 }}>{errors.name}</div>}
                </div>

                <div style={{ marginBottom: 12 }}>
                    <label style={{ display: "block", marginBottom: 4 }}>Data startu</label>
                    <input
                        name="startDate"
                        value={form.startDate}
                        onChange={onChange}
                        placeholder="YYYY-MM-DD"
                        style={{ width: "100%", padding: 8 }}
                    />
                    {errors.startDate && (
                        <div style={{ color: "crimson", marginTop: 4 }}>{errors.startDate}</div>
                    )}
                </div>

                <div style={{ marginBottom: 12 }}>
                    <label style={{ display: "block", marginBottom: 4 }}>Status</label>
                    <select
                        name="status"
                        value={form.status}
                        onChange={onChange}
                        style={{ width: "100%", padding: 8 }}
                    >
                        <option value="Planned">Planned</option>
                        <option value="Ongoing">Ongoing</option>
                        <option value="Finished">Finished</option>
                        <option value="Cancelled">Cancelled</option>
                    </select>
                    {errors.status && (
                        <div style={{ color: "crimson", marginTop: 4 }}>{errors.status}</div>
                    )}
                </div>

                <div style={{ display: "flex", gap: 8 }}>
                    <button type="submit" disabled={!canSubmit} style={{ padding: "8px 12px" }}>
                        {submitting ? "Zapisywanie..." : "Zapisz"}
                    </button>
                    <button type="button" onClick={() => navigate("/races")} style={{ padding: "8px 12px" }}>
                        Anuluj
                    </button>
                </div>
            </form>
        </div>
    );
}
