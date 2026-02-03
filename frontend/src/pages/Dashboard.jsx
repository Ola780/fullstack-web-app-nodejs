import React from "react";
import { useAuth } from "../auth/AuthContext";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

export default function Dashboard() {
    const { t } = useTranslation();
    const { isLoggedIn, role, me } = useAuth();

    return (
        <div>
            <div
                className="hero"
                style={{
                    backgroundImage: "url(/images/dashboard.jpg)",
                }}
            />

            <h2>{t("nav.dashboard")}</h2>

            {!isLoggedIn && (
                <div>
                    <img src="/images/f1-car.jpg" style={{ width: 60 }} alt="" />

                    <div className="card">
                        <h3>{t("dashboard.guest.title")}</h3>
                        <p>{t("dashboard.guest.text")}</p>
                    </div>

                    <div style={{ marginTop: 16 }}>
                        <Link to="/login" className="auth-link">
                            {t("auth.login")}
                        </Link>
                    </div>

                    <div style={{ marginTop: 10 }}>
                        <Link to="/register" className="auth-link auth-link-register">
                            {t("auth.register")}
                        </Link>
                    </div>
                </div>
            )}

            {isLoggedIn && (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <div>
                        {t("dashboard.role")}: {t(`roles.${role}`)}
                    </div>
                    <div>
                        {t("dashboard.userId")}: {me.userId}
                    </div>

                    {role === "ADMIN" && (
                        <div className="card">
                            <img src="/images/f1-car.jpg" style={{ width: 60 }} alt="" />
                            <h3>{t("dashboard.admin.title")}</h3>
                            <ul>
                                <li>{t("dashboard.admin.items.races")}</li>
                                <li>{t("dashboard.admin.items.drivers")}</li>
                                <li>{t("dashboard.admin.items.enrollments")}</li>
                                <li>{t("dashboard.admin.items.users")}</li>
                            </ul>
                        </div>
                    )}

                    {role === "MANAGER" && (
                        <div className="card">
                            <img src="/images/f1-car.jpg" style={{ width: 60 }} alt="" />
                            <h3>{t("dashboard.manager.title")}</h3>
                            <ul>
                                <li>{t("dashboard.manager.items.teamDrivers")}</li>
                                <li>{t("dashboard.manager.items.enrollments")}</li>
                                <li>{t("dashboard.manager.items.results")}</li>
                            </ul>
                        </div>
                    )}

                    {role === "DRIVER" && (
                        <div className="card">
                            <img src="/images/f1-car.jpg" style={{ width: 60 }} alt="" />
                            <h3>{t("dashboard.driver.title")}</h3>
                            <ul>
                                <li>{t("dashboard.driver.items.profile")}</li>
                                <li>{t("dashboard.driver.items.enrollments")}</li>
                                <li>{t("dashboard.driver.items.results")}</li>
                            </ul>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
