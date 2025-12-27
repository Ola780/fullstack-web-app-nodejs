import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { http } from "../api/http";
import { useAuth } from "../auth/AuthContext";

function isIsoDate(value) {
    return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export default function DriverForm() {
    console.log("DriverForm v3 loaded");

    const navigate = useNavigate();
    const params = useParams();
    const { role } = useAuth();

    const isEdit = Boolean(params.id);
    const driverId = isEdit ? Number(params.id) : null;

    const canPickTeam = role === "ADMIN"; // MANAGER nie wybiera teamu

    const [teams, setTeams] = useState([]);
    const [loadingTeams, setLoadingTeams] = useState(canPickTeam); // manager nie musi ładować teamów

    const [loadingDriver, setLoadingDriver] = useState(isEdit);
    const [submitting, setSubmitting] = useState(false);

    const [serverError, setServerError] = useState("");
    const [errors, setErrors] = useState({});

    const [form, setForm] = useState({
        name: "",
        dateOfBirth: "",
        team: "", // używane tylko dla ADMIN
    });

    // --- Load teams for select (ADMIN only) ---
    useEffect(() => {
        if (!canPickTeam) return;

        let mounted = true;

        async function loadTeams() {
            setLoadingTeams(true);
            setServerError("");
            try {
                const res = await http.get("/teams", { params: { page: 1, pageSize: 200 } });
                const data = Array.isArray(res.data) ? res.data : (res.data.items || []);
                if (mounted) setTeams(data);
            } catch (e) {
                if (mounted) setServerError("Nie udało się pobrać listy zespołów (Team).");
            } finally {
                if (mounted) setLoadingTeams(false);
            }
        }

        loadTeams();
        return () => { mounted = false; };
    }, [canPickTeam]);

    // --- Load driver details on edit ---
    useEffect(() => {
        if (!isEdit) return;

        let mounted = true;

        async function loadDriver() {
            setLoadingDriver(true);
            setServerError("");
            try {
                const res = await http.get(`/drivers/${driverId}`);
                const d = res.data?.driver;
                if (!d) throw new Error("No driver in response");

                const dob = d.dateOfBirth ? String(d.dateOfBirth).slice(0, 10) : "";

                if (mounted) {
                    setForm({
                        name: d.name ?? "",
                        dateOfBirth: dob,
                        team: d.team ? String(d.team) : (d.teamId ? String(d.teamId) : ""),
                    });
                }
            } catch (e) {
                if (mounted) setServerError("Nie udało się pobrać danych kierowcy do edycji.");
            } finally {
                if (mounted) setLoadingDriver(false);
            }
        }

        loadDriver();
        return () => { mounted = false; };
    }, [isEdit, driverId]);

    const validate = () => {
        const next = {};

        const name = form.name.trim();
        if (!name) next.name = "Imię i nazwisko jest wymagane.";
        else if (name.length > 20) next.name = "Maksymalnie 20 znaków.";

        if (!isIsoDate(form.dateOfBirth)) {
            next.dateOfBirth = "Data urodzenia musi być w formacie RRRR-MM-DD.";
        }

        // Team wymagany tylko dla ADMIN
        if (canPickTeam) {
            if (!form.team) next.team = "Wybierz zespół.";
            else if (!Number.isInteger(Number(form.team)) || Number(form.team) <= 0) next.team = "Nieprawidłowy zespół.";
        }

        setErrors(next);
        return Object.keys(next).length === 0;
    };

    const canSubmit = useMemo(() => {
        const teamsOk = canPickTeam ? !loadingTeams : true;
        return !submitting && teamsOk && (!isEdit || !loadingDriver);
    }, [submitting, loadingTeams, loadingDriver, isEdit, canPickTeam]);

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
            // Payload:
            // - ADMIN wysyła team
            // - MANAGER nie wysyła team (backend narzuci managerTeamId)
            const payload = {
                name: form.name.trim(),
                dateOfBirth: form.dateOfBirth,
                ...(canPickTeam ? { team: Number(form.team) } : {}),
            };

            if (isEdit) {
                await http.put(`/drivers/${driverId}`, payload);
            } else {
                await http.post("/drivers", payload);
            }

            navigate("/drivers");
        } catch (err) {
            const msg =
                err?.response?.data?.message ||
                "Nie udało się zapisać kierowcy. Sprawdź dane i spróbuj ponownie.";
            setServerError(msg);
        } finally {
            setSubmitting(false);
        }
    };

    if ((canPickTeam && loadingTeams) || loadingDriver) {
        return (
            <div style={{ padding: 16 }}>
                <h2>{isEdit ? "Edytuj kierowcę" : "Dodaj kierowcę"}</h2>
                <p>Ładowanie...</p>
                {serverError && <p style={{ color: "crimson" }}>{serverError}</p>}
            </div>
        );
    }

    return (
        <div style={{ padding: 16, maxWidth: 520 }}>
            <h2>{isEdit ? "Edytuj kierowcę" : "Dodaj kierowcę"}</h2>

            {serverError && (
                <div style={{ marginBottom: 12, color: "crimson" }}>
                    {serverError}
                </div>
            )}

            <form onSubmit={onSubmit}>
                <div style={{ marginBottom: 12 }}>
                    <label style={{ display: "block", marginBottom: 4 }}>Imię i nazwisko</label>
                    <input
                        name="name"
                        value={form.name}
                        onChange={onChange}
                        placeholder="np. Max Verstappen"
                        style={{ width: "100%", padding: 8 }}
                    />
                    {errors.name && <div style={{ color: "crimson", marginTop: 4 }}>{errors.name}</div>}
                </div>

                <div style={{ marginBottom: 12 }}>
                    <label style={{ display: "block", marginBottom: 4 }}>Data urodzenia</label>
                    <input
                        name="dateOfBirth"
                        value={form.dateOfBirth}
                        onChange={onChange}
                        placeholder="YYYY-MM-DD"
                        style={{ width: "100%", padding: 8 }}
                    />
                    {errors.dateOfBirth && (
                        <div style={{ color: "crimson", marginTop: 4 }}>{errors.dateOfBirth}</div>
                    )}
                </div>

                {canPickTeam && (
                    <div style={{ marginBottom: 12 }}>
                        <label style={{ display: "block", marginBottom: 4 }}>Zespół (Team)</label>
                        <select
                            name="team"
                            value={form.team}
                            onChange={onChange}
                            style={{ width: "100%", padding: 8 }}
                        >
                            <option value="">-- wybierz --</option>
                            {teams.map((t) => (
                                <option key={t.id} value={t.id}>
                                    {t.name} (id: {t.id})
                                </option>
                            ))}
                        </select>
                        {errors.team && <div style={{ color: "crimson", marginTop: 4 }}>{errors.team}</div>}
                    </div>
                )}

                <div style={{ display: "flex", gap: 8 }}>
                    <button type="submit" disabled={!canSubmit} style={{ padding: "8px 12px" }}>
                        {submitting ? "Zapisywanie..." : "Zapisz"}
                    </button>
                    <button
                        type="button"
                        onClick={() => navigate("/drivers")}
                        style={{ padding: "8px 12px" }}
                    >
                        Anuluj
                    </button>
                </div>
            </form>
        </div>
    );
}
