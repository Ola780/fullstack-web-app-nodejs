import React, { useEffect, useState } from "react";
import { http } from "../api/http";
import Pagination from "../components/Pagination";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function AdminUsers() {
    const { t } = useTranslation();

    const [data, setData] = useState({ items: [], page: 1, pageSize: 10, total: 0 });
    const [err, setErr] = useState("");

    const load = async (page) => {
        const r = await http.get("/users", { params: { page, pageSize: data.pageSize } });
        setData(r.data);
    };

    useEffect(() => {
        load(1);
    }, []);

    const del = async (id) => {
        setErr("");
        try {
            await http.delete(`/users/${id}`);
            load(data.page);
        } catch {
            setErr(t("users.delete.failed"));
        }
    };

    return (
        <div>
            <h2>{t("nav.users")}</h2>

            <div style={{ marginBottom: 10 }}>
                <Link to="/admin/users/new">{t("common.create")}</Link>
            </div>

            {err && <div style={{ color: "crimson" }}>{err}</div>}

            <table border="1" cellPadding="6">
                <thead>
                <tr>
                    <th>{t("common.id")}</th>
                    <th>{t("users.fields.name")}</th>
                    <th>{t("users.fields.surname")}</th>
                    <th>{t("users.fields.email")}</th>
                    <th>{t("users.fields.role")}</th>
                    <th>{t("users.fields.driver")}</th>
                    <th></th>
                </tr>
                </thead>

                <tbody>
                {data.items.map((u) => (
                    <tr key={u.id}>
                        <td>{u.id}</td>
                        <td>{u.name}</td>
                        <td>{u.surname}</td>
                        <td>{u.email}</td>
                        <td>{t(`roles.${u.roleName}`)}</td>
                        <td>{u.driver ?? "-"}</td>
                        <td>
                            <Link to={`/admin/users/${u.id}/edit`}>{t("common.edit")}</Link>{" "}
                            <button onClick={() => del(u.id)}>{t("common.delete")}</button>
                        </td>
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
