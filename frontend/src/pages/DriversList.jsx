import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { http } from "../api/http";
import Pagination from "../components/Pagination";
import { useAuth } from "../auth/AuthContext";
import { useTranslation } from "react-i18next";

export default function DriversList() {
    const { t } = useTranslation();
    const { role } = useAuth();
    const canCreateOrEdit = role === "MANAGER";
    const canDelete = role === "MANAGER" || role === "ADMIN";

    const [data, setData] = useState({
        items: [],
        page: 1,
        pageSize: 10,
        total: 0,
    });
    const [error, setError] = useState("");

    const load = async (page) => {
        setError("");
        try {
            const res = await http.get("/drivers", {
                params: { page, pageSize: data.pageSize },
            });
            setData(res.data);
        } catch {
            setError(t("drivers.list.loadError"));
        }
    };

    useEffect(() => {
        load(1);
    }, []);

    const onDelete = async (id) => {
        if (!window.confirm(t("drivers.delete.confirm", { id }))) return;

        try {
            await http.delete(`/drivers/${id}`);
            load(data.page);
        } catch {
            alert(t("drivers.delete.failed"));
        }
    };

    return (
        <div>
            <div className="hero" style={{ backgroundImage: "url(/images/drivers.jpg)" }} />
            <h2>{t("nav.drivers")}</h2>

            {canCreateOrEdit && (
                <div style={{ marginBottom: 10 }}>
                    <Link to="/drivers/new">{t("common.create")}</Link>
                </div>
            )}

            {error && <div style={{ color: "crimson", marginBottom: 10 }}>{error}</div>}

            <table border="1" cellPadding="6">
                <thead>
                <tr>
                    <th>{t("common.id")}</th>
                    <th>{t("drivers.fields.name")}</th>
                    <th>{t("drivers.fields.dateOfBirth")}</th>
                    <th>{t("drivers.fields.team")}</th>
                    <th>{t("common.details")}</th>
                    {canDelete && <th>{t("common.actions")}</th>}
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

                        {canDelete && (
                            <td>
                                {canCreateOrEdit && (
                                    <>
                                        <Link to={`/drivers/${d.id}/edit`}>{t("common.edit")}</Link>{" "}
                                    </>
                                )}
                                <button onClick={() => onDelete(d.id)}>{t("common.delete")}</button>
                            </td>
                        )}
                    </tr>
                ))}
                </tbody>
            </table>

            <Pagination page={data.page} pageSize={data.pageSize} total={data.total} onPage={load} />
        </div>
    );
}
