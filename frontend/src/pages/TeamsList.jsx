import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { http } from "../api/http";
import { useAuth } from "../auth/AuthContext";
import { useTranslation } from "react-i18next";

export default function TeamsList() {
    const { t } = useTranslation();
    const { role } = useAuth();
    const isAdmin = role === "ADMIN";

    const [items, setItems] = useState([]);
    const [error, setError] = useState("");

    const load = async () => {
        setError("");
        try {
            const res = await http.get("/teams");
            setItems(Array.isArray(res.data) ? res.data : []);
        } catch {
            setError(t("teams.list.loadError"));
        }
    };

    useEffect(() => {
        load();
    }, []);

    return (
        <div>
            <h2>{t("nav.teams")}</h2>

            {isAdmin && (
                <div style={{ marginBottom: 10 }}>
                    <Link to="/teams/new">{t("common.create")}</Link>
                </div>
            )}

            {error && <div style={{ color: "crimson", marginBottom: 10 }}>{error}</div>}

            <table border="1" cellPadding="6">
                <thead>
                <tr>
                    <th>{t("common.id")}</th>
                    <th>{t("teams.fields.name")}</th>
                    <th>{t("teams.fields.points")}</th>
                    <th>{t("teams.fields.rankingPosition")}</th>
                    <th>{t("teams.fields.manager")}</th>
                </tr>
                </thead>
                <tbody>
                {items.map((trow) => (
                    <tr key={trow.id}>
                        <td>{trow.id}</td>
                        <td>{trow.name}</td>
                        <td>{trow.points}</td>
                        <td>{trow.rankingPosition}</td>
                        <td>
                            {trow.managerName
                                ? `${trow.managerName} ${trow.managerSurname} (#${trow.manager})`
                                : `#${trow.manager}`}
                        </td>
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    );
}
