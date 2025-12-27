import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { http } from "../api/http";

function isEmail(v) {
    return /^\S+@\S+\.\S+$/.test(v);
}

function isLang(v) {
    return /^[a-z]{2}$/i.test(v);
}

export default function UserForm() {
    const navigate = useNavigate();

    const [drivers, setDrivers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const [serverError, setServerError] = useState("");
    const [errors, setErrors] = useState({});

    const [form, setForm] = useState({
        name: "",
        surname: "",
        email: "",
        password: "",
        preferredLanguage: "pl",
        roleName: "DRIVER",
        driver: "",
    });

    useEffect(() => {
        let mounted = true;

        async function loadDrivers() {
            setLoading(true);
            setServerError("");
            try {
                const r = await http.get("/drivers/available");
                const items = Array.isArray(r.data) ? r.data : [];
                if (mounted) setDrivers(items);
            } catch (e) {
                // driverzy są opcjonalni – ale dla DRIVER przydają się
                if (mounted) setServerError("Nie udało się pobrać listy kierowców (Driver).");
            } finally {
                if (mounted) setLoading(false);
            }
        }

        loadDrivers();
        return () => { mounted = false; };
    }, []);

    const validate = () => {
        const next = {};

        if (!form.name.trim()) next.name = "Name is required.";
        if (!form.surname.trim()) next.surname = "Surname is required.";

        if (!form.email.trim()) next.email = "Email is required.";
        else if (!isEmail(form.email.trim())) next.email = "Invalid email.";

        if (!form.password) next.password = "Password is required.";
        else if (form.password.length < 4) next.password = "Min. 4 characters.";

        if (!isLang(form.preferredLanguage)) next.preferredLanguage = "Use 2-letter code (pl/en).";

        if (!["DRIVER", "MANAGER"].includes(form.roleName)) next.roleName = "Invalid role.";

        if (form.roleName === "DRIVER") {
            // driver FK opcjonalny, ale zalecany, bo kierowca ma widzieć swoje dane
            // jeśli chcesz wymusić – odkomentuj:
            // if (!form.driver) next.driver = "Select driver for DRIVER role.";
        }

        setErrors(next);
        return Object.keys(next).length === 0;
    };

    const canSubmit = useMemo(() => !loading && !submitting, [loading, submitting]);

    const onChange = (e) => {
        const { name, value } = e.target;
        setForm((p) => ({ ...p, [name]: value }));
    };

    const onSubmit = async (e) => {
        e.preventDefault();
        setServerError("");

        if (!validate()) return;

        setSubmitting(true);
        try {
            const payload = {
                name: form.name.trim(),
                surname: form.surname.trim(),
                email: form.email.trim(),
                password: form.password,
                preferredLanguage: form.preferredLanguage.toLowerCase(),
                roleName: form.roleName,
                driver: form.roleName === "DRIVER" && form.driver ? Number(form.driver) : null,
            };

            await http.post("/users", payload);
            navigate("/admin/users");
        } catch (err) {
            const msg =
                err?.response?.data?.message ||
                "Nie udało się utworzyć użytkownika (email może już istnieć).";
            setServerError(msg);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div style={{ padding: 16, maxWidth: 560 }}>
            <h2>Create user</h2>

            {serverError && <div style={{ marginBottom: 12, color: "crimson" }}>{serverError}</div>}

            <form onSubmit={onSubmit}>
                <div style={{ marginBottom: 12 }}>
                    <label style={{ display: "block", marginBottom: 4 }}>Name</label>
                    <input name="name" value={form.name} onChange={onChange} style={{ width: "100%", padding: 8 }} />
                    {errors.name && <div style={{ color: "crimson" }}>{errors.name}</div>}
                </div>

                <div style={{ marginBottom: 12 }}>
                    <label style={{ display: "block", marginBottom: 4 }}>Surname</label>
                    <input name="surname" value={form.surname} onChange={onChange} style={{ width: "100%", padding: 8 }} />
                    {errors.surname && <div style={{ color: "crimson" }}>{errors.surname}</div>}
                </div>

                <div style={{ marginBottom: 12 }}>
                    <label style={{ display: "block", marginBottom: 4 }}>Email</label>
                    <input name="email" value={form.email} onChange={onChange} style={{ width: "100%", padding: 8 }} />
                    {errors.email && <div style={{ color: "crimson" }}>{errors.email}</div>}
                </div>

                <div style={{ marginBottom: 12 }}>
                    <label style={{ display: "block", marginBottom: 4 }}>Password</label>
                    <input type="password" name="password" value={form.password} onChange={onChange} style={{ width: "100%", padding: 8 }} />
                    {errors.password && <div style={{ color: "crimson" }}>{errors.password}</div>}
                </div>

                <div style={{ marginBottom: 12 }}>
                    <label style={{ display: "block", marginBottom: 4 }}>Preferred language</label>
                    <select name="preferredLanguage" value={form.preferredLanguage} onChange={onChange} style={{ width: "100%", padding: 8 }}>
                        <option value="pl">pl</option>
                        <option value="en">en</option>
                    </select>
                    {errors.preferredLanguage && <div style={{ color: "crimson" }}>{errors.preferredLanguage}</div>}
                </div>

                <div style={{ marginBottom: 12 }}>
                    <label style={{ display: "block", marginBottom: 4 }}>Role</label>
                    <select name="roleName" value={form.roleName} onChange={onChange} style={{ width: "100%", padding: 8 }}>
                        <option value="DRIVER">DRIVER</option>
                        <option value="MANAGER">MANAGER</option>
                    </select>
                    {errors.roleName && <div style={{ color: "crimson" }}>{errors.roleName}</div>}
                </div>

                {form.roleName === "DRIVER" && (
                    <div style={{ marginBottom: 12 }}>
                        <label style={{ display: "block", marginBottom: 4 }}>
                            Driver (optional link)
                        </label>
                        <select name="driver" value={form.driver} onChange={onChange} style={{ width: "100%", padding: 8 }}>
                            <option value="">-- none --</option>
                            {drivers.map((d) => (
                                <option key={d.id} value={d.id}>
                                    {d.name} (#{d.id}) - {d.teamName}
                                </option>
                            ))}
                        </select>
                        {errors.driver && <div style={{ color: "crimson" }}>{errors.driver}</div>}
                    </div>
                )}

                <div style={{ display: "flex", gap: 8 }}>
                    <button type="submit" disabled={!canSubmit} style={{ padding: "8px 12px" }}>
                        {submitting ? "Saving..." : "Save"}
                    </button>
                    <button type="button" onClick={() => navigate("/admin/users")} style={{ padding: "8px 12px" }}>
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    );
}
