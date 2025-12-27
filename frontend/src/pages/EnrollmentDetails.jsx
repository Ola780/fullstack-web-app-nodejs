import React, { useEffect, useState } from "react";
import { http } from "../api/http";
import { useParams } from "react-router-dom";

export default function EnrollmentDetails() {
    const { id } = useParams();
    const [e, setE] = useState(null);

    useEffect(() => {
        http.get(`/enrollments/${id}`).then(r => setE(r.data));
    }, [id]);

    if (!e) return <div>Loading...</div>;

    return (
        <div>
            <h2>Enrollment #{e.id}</h2>
            <div>race: {e.raceName} (#{e.race})</div>
            <div>driver: {e.driverName} (#{e.driver})</div>
            <div>team: {e.teamName} (#{e.team})</div>
            <div>finishPosition: {e.finishPosition ?? "-"}</div>
            <div>enrollmentDate: {String(e.enrollmentDate).slice(0,10)}</div>
        </div>
    );
}
