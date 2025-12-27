import React from "react";
import { useAuth } from "../auth/AuthContext";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

export default function Dashboard() {
    const { t } = useTranslation();
    const { isLoggedIn, role, me } = useAuth();

    return (
        <div>
            <h2>{t("nav.dashboard")}</h2>
            {!isLoggedIn && (
                <div>
                    Gość: możesz przeglądać wyścigi. Zaloguj się, aby zarządzać zapisami.
                    <div><Link to="/login">{t("auth.login")}</Link></div>
                </div>
            )}

            {isLoggedIn && (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <div>Role: {t(`roles.${role}`)}</div>
                    <div>UserId: {me.userId}</div>

                    {role === "ADMIN" && (
                        <div>
                            ADMIN: pełny CRUD Race/Driver + kasowanie Enrollment + Users list.
                        </div>
                    )}
                    {role === "MANAGER" && (
                        <div>
                            MANAGER: widzisz tylko kierowców swojego teamu i możesz zapisywać ich do wyścigów.
                        </div>
                    )}
                    {role === "DRIVER" && (
                        <div>
                            DRIVER: widzisz tylko swoje dane i swoje zapisy.
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
