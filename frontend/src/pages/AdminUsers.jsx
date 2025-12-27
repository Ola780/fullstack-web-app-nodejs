import React, { useEffect, useState } from "react";
import { http } from "../api/http";
import Pagination from "../components/Pagination";
import { Link } from "react-router-dom";


export default function AdminUsers() {
    const [data, setData] = useState({ items: [], page: 1, pageSize: 10, total: 0 });
    const [err, setErr] = useState("");

    const load = async (page) => {
        const r = await http.get("/users", { params: { page, pageSize: data.pageSize } });
        setData(r.data);
    };

    useEffect(() => { load(1); }, []);

    const del = async (id) => {
        setErr("");
        try {
            await http.delete(`/users/${id}`);
            load(data.page);
        } catch {
            setErr("Delete failed (maybe user is team manager).");
        }
    };

    return (
        <div>
            <h2>Users (Admin)</h2>

            <div style={{ marginBottom: 10 }}>
                <Link to="/admin/users/new">Create</Link>
            </div>

            {err && <div style={{ color: "crimson" }}>{err}</div>}

            <table border="1" cellPadding="6">
                <thead>
                <tr>
                    <th>id</th><th>name</th><th>surname</th><th>email</th><th>role</th><th>driver</th><th></th>
                </tr>
                </thead>
                <tbody>
                {data.items.map(u => (
                    <tr key={u.id}>
                        <td>{u.id}</td>
                        <td>{u.name}</td>
                        <td>{u.surname}</td>
                        <td>{u.email}</td>
                        <td>{u.roleName}</td>
                        <td>{u.driver ?? "-"}</td>
                        <td><button onClick={() => del(u.id)}>Delete</button></td>
                    </tr>
                ))}
                </tbody>
            </table>

            <Pagination page={data.page} pageSize={data.pageSize} total={data.total} onPage={(p) => load(p)} />
        </div>
    );
}
