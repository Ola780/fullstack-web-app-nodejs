import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "./LanguageSwitcher";

export default function NavBar() {
    const { t } = useTranslation();
    const { isLoggedIn, role, logout } = useAuth();

    return (
        <div className="navbar">
            <div className="navlinks">
                <Link to="/">{t("nav.dashboard")}</Link>
                <Link to="/races">{t("nav.races")}</Link>
                {isLoggedIn && <Link to="/drivers">{t("nav.drivers")}</Link>}
                {isLoggedIn && <Link to="/enrollments">{t("nav.enrollments")}</Link>}
                {role === "ADMIN" && <Link to="/admin/users">{t("nav.users")}</Link>}
                {role === "ADMIN" && <Link to="/teams">{t("nav.teams")}</Link>}

            </div>

            <div className="nav-right">
                <LanguageSwitcher />
                {isLoggedIn ? (
                    <button onClick={logout}>{t("common.logout")}</button>
                ) : (
                    <Link to="/login">{t("auth.login")}</Link>
                )}
            </div>
        </div>
    );
}
