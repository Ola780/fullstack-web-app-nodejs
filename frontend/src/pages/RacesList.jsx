import React, { useEffect, useState } from "react";
import { http } from "../api/http";
import { Link, useLocation } from "react-router-dom";
import Pagination from "../components/Pagination";
import { useAuth } from "../auth/AuthContext";
import { useTranslation } from "react-i18next";

export default function RacesList() {
    const { t } = useTranslation();
    const { role } = useAuth();
    const location = useLocation();

    const [data, setData] = useState({ items: [], page: 1, pageSize: 10, total: 0 });

    const load = async (page) => {
        const r = await http.get("/races", { params: { page, pageSize: data.pageSize } });
        setData(r.data);
    };

    const onDelete = async (id) => {
        const ok = window.confirm(`Na pewno usunąć wyścig #${id}?`);
        if (!ok) return;

        try {
            await http.delete(`/races/${id}`);
            await load(data.page); // odśwież bieżącą stronę
        } catch (err) {
            const msg =
                err?.response?.data?.message ||
                "Nie udało się usunąć wyścigu (może ma enrollmenty).";
            alert(msg);
        }
    };

    useEffect(() => {
        load(1);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        load(data.page || 1);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [location.key]);

    return (
        <div>
            <h2>{t("nav.races")}</h2>

            {role === "ADMIN" && (
                <div style={{ marginBottom: 10 }}>
                    <Link to="/races/new">{t("common.create")}</Link>
                </div>
            )}

            <table border="1" cellPadding="6">
                <thead>
                <tr>
                    <th>id</th>
                    <th>name</th>
                    <th>startDate</th>
                    <th>status</th>
                    <th></th>
                    {role === "ADMIN" && <th></th>}
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

                        {role === "ADMIN" && (
                            <td>
                                <button type="button" onClick={() => onDelete(r.id)}>
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
