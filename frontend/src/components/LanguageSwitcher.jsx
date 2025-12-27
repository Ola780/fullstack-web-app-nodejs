import React from "react";
import i18n from "../i18n/i18n";

export default function LanguageSwitcher() {
    return (
        <select value={i18n.language} onChange={(e) => i18n.changeLanguage(e.target.value)}>
            <option value="pl">PL</option>
            <option value="en">EN</option>
        </select>
    );
}
