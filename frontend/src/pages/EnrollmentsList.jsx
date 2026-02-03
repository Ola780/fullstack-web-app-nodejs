import React, { useEffect, useState } from "react";
import { http } from "../api/http";
import Pagination from "../components/Pagination";
import { useAuth } from "../auth/AuthContext";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

export default function EnrollmentsList() {
    const { t } = useTranslation();
    const { role } = useAuth();

    const [data, setData] = useState({ items: [], page: 1, pageSize: 10, total: 0 });
    const [err, setErr] = useState("");

    const load = async (page) => {
        const r = await http.get("/enrollments", { params: { page, pageSize: data.pageSize } });
        setData(r.data);
    };

    useEffect(() => {
        load(1);
    }, []);

    const del = async (id) => {
        setErr("");
        try {
            await http.delete(`/enrollments/${id}`);
            load(data.page);
        } catch {
            setErr(t("enrollments.delete.failed"));
        }
    };

    return (
        <div>
            <h2>{t("nav.enrollments")}</h2>

            {role === "MANAGER" && (
                <div style={{ marginBottom: 10 }}>
                    <Link to="/enrollments/new">{t("common.create")}</Link>
                </div>
            )}

            {err && <div style={{ color: "crimson" }}>{err}</div>}

            <table border="1" cellPadding="6">
                <thead>
                <tr>
                    <th>{t("common.id")}</th>
                    <th>{t("enrollments.fields.race")}</th>
                    <th>{t("enrollments.fields.driver")}</th>
                    <th>{t("enrollments.fields.team")}</th>
                    <th>{t("enrollments.fields.finishPosition")}</th>
                    <th>{t("enrollments.fields.enrollmentDate")}</th>
                    <th></th>
                </tr>
                </thead>

                <tbody>
                {data.items.map((e) => (
                    <tr key={e.id}>
                        <td>{e.id}</td>
                        <td>{e.raceName}</td>
                        <td>{e.driverName}</td>
                        <td>{e.teamName}</td>
                        <td>{e.finishPosition ?? "-"}</td>
                        <td>{String(e.enrollmentDate).slice(0, 10)}</td>
                        <td>
                            {(role === "ADMIN" || role === "MANAGER") && (
                                <button onClick={() => del(e.id)}>{t("common.delete")}</button>
                            )}
                        </td>
                    </tr>
                ))}
                </tbody>
            </table>

            <Pagination page={data.page} pageSize={data.pageSize} total={data.total} onPage={(p) => load(p)} />
        </div>
    );
}
