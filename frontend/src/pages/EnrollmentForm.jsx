import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { http } from "../api/http";
import { useAuth } from "../auth/AuthContext";
import { useTranslation } from "react-i18next";

const isIsoDate = (v) => /^\d{4}-\d{2}-\d{2}$/.test(v);

export default function EnrollmentForm() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { role } = useAuth();

    const isAdmin = role === "ADMIN";

    const [races, setRaces] = useState([]);
    const [drivers, setDrivers] = useState([]);
    const [teams, setTeams] = useState([]);

    const [form, setForm] = useState({
        race: "",
        driver: "",
        team: "",
        enrollmentDate: "",
        finishPosition: "",
    });

    const [error, setError] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            try {
                const r = await http.get("/races", { params: { page: 1, pageSize: 50 } });
                const d = await http.get("/drivers", { params: { page: 1, pageSize: 50 } });

                setRaces(r.data.items);
                setDrivers(d.data.items);

                if (isAdmin) {
                    const tt = await http.get("/teams", { params: { page: 1, pageSize: 50 } });
                    setTeams(tt.data.items);
                }
            } catch {
                setError(t("common.loadError"));
            } finally {
                setLoading(false);
            }
        })();
    }, [isAdmin, t]);

    const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    const onSubmit = async (e) => {
        e.preventDefault();
        setError("");

        if (!form.race) return setError(t("enrollments.form.validation.raceRequired"));
        if (!form.driver) return setError(t("enrollments.form.validation.driverRequired"));
        if (form.enrollmentDate && !isIsoDate(form.enrollmentDate))
            return setError(t("common.validation.dateFormat"));
        if (isAdmin && !form.team) return setError(t("enrollments.form.validation.teamRequired"));

        const payload = {
            race: Number(form.race),
            driver: Number(form.driver),
            ...(form.enrollmentDate ? { enrollmentDate: form.enrollmentDate } : {}),
            ...(form.finishPosition !== "" ? { finishPosition: Number(form.finishPosition) } : {}),
            ...(isAdmin ? { team: Number(form.team) } : {}),
        };

        try {
            await http.post("/enrollments", payload);
            navigate("/enrollments");
        } catch (err) {
            setError(err?.response?.data?.message || t("common.saveError"));
        }
    };

    if (loading) {
        return (
            <div style={{ padding: 16 }}>
                <h2>{t("enrollments.form.createTitle")}</h2>
                <p>{t("common.loading")}</p>
            </div>
        );
    }

    return (
        <div style={{ padding: 16, maxWidth: 500 }}>
            <h2>{t("enrollments.form.createTitle")}</h2>
            {error && <div style={{ color: "crimson", marginBottom: 12 }}>{error}</div>}

            <form onSubmit={onSubmit}>
                <div style={{ marginBottom: 12 }}>
                    <label>{t("enrollments.fields.race")}</label>
                    <select name="race" value={form.race} onChange={onChange}>
                        <option value="">{t("common.select.placeholder")}</option>
                        {races.map((r) => (
                            <option key={r.id} value={r.id}>
                                {r.name}
                            </option>
                        ))}
                    </select>
                </div>

                <div style={{ marginBottom: 12 }}>
                    <label>{t("enrollments.fields.driver")}</label>
                    <select name="driver" value={form.driver} onChange={onChange}>
                        <option value="">{t("common.select.placeholder")}</option>
                        {drivers.map((d) => (
                            <option key={d.id} value={d.id}>
                                {d.name}
                            </option>
                        ))}
                    </select>
                </div>

                {isAdmin && (
                    <div style={{ marginBottom: 12 }}>
                        <label>{t("enrollments.fields.team")}</label>
                        <select name="team" value={form.team} onChange={onChange}>
                            <option value="">{t("common.select.placeholder")}</option>
                            {teams.map((tt) => (
                                <option key={tt.id} value={tt.id}>
                                    {tt.name}
                                </option>
                            ))}
                        </select>
                    </div>
                )}

                <div style={{ marginBottom: 12 }}>
                    <label>{t("enrollments.fields.enrollmentDate")}</label>
                    <input
                        name="enrollmentDate"
                        placeholder="YYYY-MM-DD"
                        value={form.enrollmentDate}
                        onChange={onChange}
                    />
                </div>

                <div style={{ marginBottom: 12 }}>
                    <label>{t("enrollments.fields.finishPosition")}</label>
                    <input
                        name="finishPosition"
                        placeholder={t("enrollments.form.finishPosition.placeholder")}
                        value={form.finishPosition}
                        onChange={onChange}
                    />
                </div>

                <div style={{ display: "flex", gap: 8 }}>
                    <button type="submit">{t("common.save")}</button>
                    <button type="button" onClick={() => navigate("/enrollments")}>
                        {t("common.cancel")}
                    </button>
                </div>
            </form>
        </div>
    );
}
