
import React, { useEffect, useState } from "react";
import { http } from "../api/http";
import { Link, useLocation } from "react-router-dom";
import Pagination from "../components/Pagination";
import { useAuth } from "../auth/AuthContext";
import { useTranslation } from "react-i18next";

export default function DriversList() {
    const { t } = useTranslation();
    const { role } = useAuth();
    const location = useLocation();

    const [data, setData] = useState({ items: [], page: 1, pageSize: 10, total: 0 });
    const [err, setErr] = useState("");

    const canManageDrivers = role === "ADMIN" || role === "MANAGER";

    const load = async (page) => {
        setErr("");
        try {
            const r = await http.get("/drivers", { params: { page, pageSize: data.pageSize } });
            setData(r.data);
        } catch (e) {
            setErr(e?.response?.data?.message || "Nie udało się pobrać listy kierowców.");
        }
    };

    const onDelete = async (id) => {
        const ok = window.confirm(`Na pewno usunąć kierowcę #${id}?`);
        if (!ok) return;

        try {
            await http.delete(`/drivers/${id}`);
            await load(data.page);
        } catch (e) {
            const msg =
                e?.response?.data?.message ||
                "Nie udało się usunąć kierowcę (może ma enrollmenty).";
            alert(msg);
        }
    };

    useEffect(() => {
        load(data.page || 1);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [location.key]);

    return (
        <div>
            <h2>{t("nav.drivers")}</h2>

            {canManageDrivers && (
                <div style={{ marginBottom: 10 }}>
                    <Link to="/drivers/new">{t("common.create")}</Link>
                </div>
            )}

            {err && <div style={{ color: "crimson", marginBottom: 10 }}>{err}</div>}

            <table border="1" cellPadding="6">
                <thead>
                <tr>
                    <th>id</th>
                    <th>name</th>
                    <th>dateOfBirth</th>
                    <th>team</th>
                    <th>{t("common.details")}</th>
                    {canManageDrivers && <th>{t("common.actions") ?? "actions"}</th>}
                </tr>
                </thead>

                <tbody>
                {data.items.map((d) => (
                    <tr key={d.id}>
                        <td>{d.id}</td>
                        <td>{d.name}</td>
                        <td>{String(d.dateOfBirth).slice(0, 10)}</td>
                        <td>
                            {d.teamName} (#{d.teamId})
                        </td>

                        <td>
                            <Link to={`/drivers/${d.id}`}>{t("common.details")}</Link>
                        </td>

                        {canManageDrivers && (
                            <td>
                                <Link to={`/drivers/${d.id}/edit`}>{t("common.edit") ?? "Edit"}</Link>{" "}
                                <button type="button" onClick={() => onDelete(d.id)}>
                                    {t("common.delete")}
                                </button>
                            </td>
                        )}
                    </tr>
                ))}
                </tbody>
            </table>

            <Pagination
                page={data.page}
                pageSize={data.pageSize}
                total={data.total}
                onPage={(p) => load(p)}
            />
        </div>
    );
}

