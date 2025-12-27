import React from "react";

export default function Pagination({ page, pageSize, total, onPage }) {
    const pages = Math.max(1, Math.ceil(total / pageSize));
    return (
        <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 12 }}>
            <button disabled={page <= 1} onClick={() => onPage(page - 1)}>{"<"}</button>
            <span>{page} / {pages}</span>
            <button disabled={page >= pages} onClick={() => onPage(page + 1)}>{">"}</button>
            <span style={{ marginLeft: 12 }}>Total: {total}</span>
        </div>
    );
}
