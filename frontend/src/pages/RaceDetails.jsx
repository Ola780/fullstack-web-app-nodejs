import React, { useEffect, useState } from "react";
import { http } from "../api/http";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { useTranslation } from "react-i18next";

export default function RaceDetails() {
    const { t } = useTranslation();
    const { id } = useParams();
    const { role } = useAuth();
    const [data, setData] = useState(null);

    useEffect(() => {
        http.get(`/races/${id}`).then(r => setData(r.data));
    }, [id]);

    if (!data) return <div>Loading...</div>;

    return (
        <div>
            <h2>Race #{data.race.id}: {data.race.name}</h2>
            <div>startDate: {String(data.race.startDate).slice(0,10)}</div>
            <div>status: {data.race.status}</div>

            {role === "ADMIN" && (
                <div style={{ marginTop: 10, display: "flex", gap: 10 }}>
                    <Link to={`/races/${data.race.id}/edit`}>{t("common.edit")}</Link>
                </div>
            )}

            <h3 style={{ marginTop: 16 }}>Enrollments</h3>
            <table border="1" cellPadding="6">
                <thead>
                <tr><th>id</th><th>driver</th><th>team</th><th>finishPosition</th><th>enrollmentDate</th></tr>
                </thead>
                <tbody>
                {data.enrollments.map(e => (
                    <tr key={e.id}>
                        <td>{e.id}</td>
                        <td>{e.driverName} (#{e.driverId})</td>
                        <td>{e.teamName} (#{e.teamId})</td>
                        <td>{e.finishPosition ?? "-"}</td>
                        <td>{String(e.enrollmentDate).slice(0,10)}</td>
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    );
}
