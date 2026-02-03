import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { http } from "../api/http";
import { useTranslation } from "react-i18next";

export default function AdminUserEditForm() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { id } = useParams();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const [availableDrivers, setAvailableDrivers] = useState([]);
    const [teamsWithoutManager, setTeamsWithoutManager] = useState([]);

    const [form, setForm] = useState({
        roleName: "DRIVER",
        driverId: "",
        teamId: "",
    });

    useEffect(() => {
        (async () => {
            setError("");
            setLoading(true);
            try {
                const [uRes, dRes, twmRes] = await Promise.all([
                    http.get(`/users/${id}`),
                    http.get(`/drivers/available`),
                    http.get(`/teams/without-manager`),
                ]);

                const u = uRes.data;

                setAvailableDrivers(Array.isArray(dRes.data) ? dRes.data : []);
                setTeamsWithoutManager(Array.isArray(twmRes.data) ? twmRes.data : []);

                setForm({
                    roleName: u.roleName || "DRIVER",
                    driverId: u.driver ? String(u.driver) : "",
                    teamId: u.managedTeamId ? String(u.managedTeamId) : "",
                });

            } catch (e) {
                setError(e?.response?.data?.message || "Load failed");
            } finally {
                setLoading(false);
            }
        })();
    }, [id]);

    const onChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

    const onSubmit = async (e) => {
        e.preventDefault();
        setError("");

        const payload =
            form.roleName === "DRIVER"
                ? {
                    roleName: "DRIVER",
                    driverId: form.driverId ? Number(form.driverId) : null,
                    teamId: null,
                }
                : {
                    roleName: "MANAGER",
                    driverId: null,
                    teamId: form.teamId ? Number(form.teamId) : null,
                };

        if (payload.roleName === "DRIVER" && !payload.driverId) {
            setError("Musisz wybrać dostępnego kierowcę.");
            return;
        }
        if (payload.roleName === "MANAGER" && !payload.teamId) {
            setError("Musisz wybrać team bez managera.");
            return;
        }

        setSaving(true);
        try {
            await http.put(`/users/${id}`, payload);
            navigate("/admin/users");
        } catch (err) {
            setError(err?.response?.data?.message || "Save failed");
        } finally {
            setSaving(false);
        }
    };


    if (loading) return <div style={{ padding: 16 }}>{t("common.loading")}</div>;

    return (
        <div style={{ padding: 16, maxWidth: 560 }}>
            <h2>{t("common.edit")} #{id}</h2>

            {error && <div style={{ color: "crimson", marginBottom: 12 }}>{error}</div>}

            <form onSubmit={onSubmit} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <label>
                    {t("users.form.role")}{" "}
                    <select name="roleName" value={form.roleName} onChange={onChange}>
                        <option value="DRIVER">{t("roles.DRIVER")}</option>
                        <option value="MANAGER">{t("roles.MANAGER")}</option>
                    </select>
                </label>

                {form.roleName === "DRIVER" ? (
                    <label>
                        {t("users.form.driver")}{" "}
                        <select name="driverId" value={form.driverId} onChange={onChange}>
                            <option value="">{t("users.form.driver.none")}</option>
                            {availableDrivers.map((d) => (
                                <option key={d.id} value={d.id}>
                                    {d.name} (#{d.id})
                                </option>
                            ))}
                        </select>
                    </label>
                ) : (
                    <label>
                        Team{" "}
                        <select name="teamId" value={form.teamId} onChange={onChange}>
                            <option value="">{t("teams.form.manager.none")}</option>
                            {teamsWithoutManager.map((tm) => (
                                <option key={tm.id} value={tm.id}>
                                    {tm.name} (#{tm.id})
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
