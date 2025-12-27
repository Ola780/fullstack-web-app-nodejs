import React, { useEffect, useState } from "react";
import { http } from "../api/http";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { useTranslation } from "react-i18next";

export default function DriverDetails() {
    const { t } = useTranslation();
    const { id } = useParams();
    const { role } = useAuth();
    const [data, setData] = useState(null);

    useEffect(() => {
        http.get(`/drivers/${id}`).then(r => setData(r.data));
    }, [id]);

    if (!data) return <div>Loading...</div>;

    return (
        <div>
            <h2>Driver #{data.driver.id}: {data.driver.name}</h2>
            <div>dateOfBirth: {String(data.driver.dateOfBirth).slice(0,10)}</div>
            <div>team: {data.driver.teamName} (#{data.driver.team})</div>

            {role === "ADMIN" && (
                <div style={{ marginTop: 10 }}>
                    <Link to={`/drivers/${data.driver.id}/edit`}>{t("common.edit")}</Link>
                </div>
            )}

            <h3 style={{ marginTop: 16 }}>Enrollments</h3>
            <table border="1" cellPadding="6">
                <thead>
                <tr><th>id</th><th>race</th><th>startDate</th><th>finishPosition</th><th></th></tr>
                </thead>
                <tbody>
                {data.enrollments.map(e => (
                    <tr key={e.id}>
                        <td>{e.id}</td>
                        <td>{e.raceName} (#{e.raceId})</td>
                        <td>{String(e.startDate).slice(0,10)}</td>
                        <td>{e.finishPosition ?? "-"}</td>
                        <td><Link to={`/enrollments/${e.id}`}>{t("common.details")}</Link></td>
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    );
}
