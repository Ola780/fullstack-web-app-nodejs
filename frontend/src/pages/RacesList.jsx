import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { http } from "../api/http";
import Pagination from "../components/Pagination";
import { useAuth } from "../auth/AuthContext";
import { useTranslation } from "react-i18next";

export default function RacesList() {
    const { t } = useTranslation();
    const { role } = useAuth();
    const isAdmin = role === "ADMIN";

    const [data, setData] = useState({ items: [], page: 1, pageSize: 10, total: 0 });

    const load = async (page) => {
        const res = await http.get("/races", { params: { page, pageSize: data.pageSize } });
        setData(res.data);
    };

    useEffect(() => {
        load(1);
    }, []);

    const onDelete = async (id) => {
        if (!window.confirm(t("races.delete.confirm", { id }))) return;

        try {
            await http.delete(`/races/${id}`);
            load(data.page);
        } catch (err) {
            alert(err?.response?.data?.message || t("races.delete.failed"));
        }
    };

    return (
        <div>
            <div className="hero" style={{ backgroundImage: "url(/images/races.jpg)" }} />

            <h2>{t("nav.races")}</h2>

            {isAdmin && (
                <div style={{ marginBottom: 10 }}>
                    <Link to="/races/new">{t("common.create")}</Link>
                </div>
            )}

            <table border="1" cellPadding="6">
                <thead>
                <tr>
                    <th>{t("common.id")}</th>
                    <th>{t("races.fields.name")}</th>
                    <th>{t("races.fields.startDate")}</th>
                    <th>{t("races.fields.status")}</th>
                    <th>{t("common.details")}</th>
                    {isAdmin && <th>{t("common.actions")}</th>}
                </tr>
                </thead>

                <tbody>
                {data.items.map((r) => (
                    <tr key={r.id}>
                        <td>{r.id}</td>
                        <td>{r.name}</td>
                        <td>{String(r.startDate).slice(0, 10)}</td>
                        <td>{r.status}</td>

                        <td>
                            <Link to={`/races/${r.id}`}>{t("common.details")}</Link>
                        </td>

                        {isAdmin && (
                            <td>
                                <Link to={`/races/${r.id}/edit`}>{t("common.edit")}</Link>{" "}
                                <button type="button" onClick={() => onDelete(r.id)}>
                                    {t("common.delete")}
                                </button>
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
