import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { http } from "../api/http";
import { useAuth } from "../auth/AuthContext";
import { useTranslation } from "react-i18next";

export default function RaceDetails() {
    const { t } = useTranslation();
    const { id } = useParams();
    const { role } = useAuth();

    const [race, setRace] = useState(null);
    const [enrollments, setEnrollments] = useState([]);
    const [error, setError] = useState("");

    useEffect(() => {
        setError("");
        http
            .get(`/races/${id}`)
            .then((r) => {
                setRace(r.data.race);
                setEnrollments(r.data.enrollments || []);
            })
            .catch(() => setError(t("races.details.loadError")));
    }, [id, t]);

    if (error) return <div style={{ color: "crimson" }}>{error}</div>;
    if (!race) return <div>{t("common.loading")}</div>;

    return (
        <div>
            <div
                className="hero"
                style={{
                    backgroundImage: "url(/images/races.jpg)",
                }}
            />

            <h2>
                {t("races.details.title", { id: race.id })}: {race.name}
            </h2>

            <div>
                {t("races.fields.startDate")}: {String(race.startDate).slice(0, 10)}
            </div>

            <div>
                {t("races.fields.status")}: {race.status}
            </div>

            {role === "ADMIN" && <div style={{ marginTop: 10 }}></div>}

            <h3 style={{ marginTop: 16 }}>{t("races.enrollments.title")}</h3>

            <table border="1" cellPadding="6">
                <thead>
                <tr>
                    <th>{t("common.id")}</th>
                    <th>{t("enrollments.fields.driver")}</th>
                    <th>{t("enrollments.fields.team")}</th>
                    <th>{t("enrollments.fields.finishPosition")}</th>
                    <th>{t("enrollments.fields.enrollmentDate")}</th>
                </tr>
                </thead>

                <tbody>
                {enrollments.map((e) => (
                    <tr key={e.id}>
                        <td>{e.id}</td>
                        <td>
                            {e.driverName} (#{e.driverId})
                        </td>
                        <td>
                            {e.teamName} (#{e.teamId})
                        </td>
                        <td>{e.finishPosition ?? "-"}</td>
                        <td>{String(e.enrollmentDate).slice(0, 10)}</td>
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    );
}