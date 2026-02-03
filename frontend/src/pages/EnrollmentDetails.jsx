import React, { useEffect, useState } from "react";
import { http } from "../api/http";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function EnrollmentDetails() {
    const { t } = useTranslation();
    const { id } = useParams();
    const [e, setE] = useState(null);

    useEffect(() => {
        http.get(`/enrollments/${id}`).then((r) => setE(r.data));
    }, [id]);

    if (!e) return <div>{t("common.loading")}</div>;

    return (
        <div>
            <h2>
                {t("enrollments.details.title", { id: e.id })}
            </h2>

            <div>
                {t("enrollments.fields.race")}: {e.raceName} (#{e.race})
            </div>

            <div>
                {t("enrollments.fields.driver")}: {e.driverName} (#{e.driver})
            </div>

            <div>
                {t("enrollments.fields.team")}: {e.teamName} (#{e.team})
            </div>

            <div>
                {t("enrollments.fields.finishPosition")}: {e.finishPosition ?? "-"}
            </div>

            <div>
                {t("enrollments.fields.enrollmentDate")}:{" "}
                {String(e.enrollmentDate).slice(0, 10)}
            </div>
        </div>
    );
}
