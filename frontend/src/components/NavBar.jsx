import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "./LanguageSwitcher";

export default function NavBar() {
    const { t } = useTranslation();
    const { isLoggedIn, role, logout } = useAuth();

    return (
        <div style={{ display: "flex", gap: 12, padding: 12, borderBottom: "1px solid #ddd", alignItems: "center" }}>
            <Link to="/">{t("nav.dashboard")}</Link>
            <Link to="/races">{t("nav.races")}</Link>

            {isLoggedIn && <Link to="/drivers">{t("nav.drivers")}</Link>}
            {isLoggedIn && <Link to="/enrollments">{t("nav.enrollments")}</Link>}
            {role === "ADMIN" && <Link to="/admin/users">{t("nav.users")}</Link>}

            <div style={{ marginLeft: "auto", display: "flex", gap: 10, alignItems: "center" }}>
                <LanguageSwitcher />
                {isLoggedIn ? <button onClick={logout}>{t("common.logout")}</button> : <Link to="/login">{t("auth.login")}</Link>}
            </div>
        </div>
    );
}
