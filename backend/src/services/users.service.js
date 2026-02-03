import { db } from "../db.js";

export async function listUsers({ page, pageSize }) {
    const pool = await db();

    const safePage = Math.max(1, Number(page) || 1);
    const safePageSize = Math.max(1, Number(pageSize) || 10);
    const offset = (safePage - 1) * safePageSize;

    const [items] = await pool.execute(
        `
    SELECT u.id, u.name, u.surname, u.email, u.preferredLanguage,
           r.name AS roleName, u.driver
    FROM users u
    JOIN role r ON r.id = u.role
    ORDER BY u.id DESC
    LIMIT ? OFFSET ?
    `,
        [safePageSize, offset]
    );

    const [totalRows] = await pool.execute(
        `SELECT COUNT(*) AS total FROM users`
    );

    return {
        items,
        page: safePage,
        pageSize: safePageSize,
        total: Number(totalRows[0]?.total ?? 0),
    };
}

export async function createUser(dto) {
    const pool = await db();

    const roleName = String(dto.roleName ?? "").trim();
    if (!roleName) {
        const err = new Error("roleName is required");
        err.status = 400;
        throw err;
    }

    const [roleRows] = await pool.execute(
        `SELECT id, name FROM role WHERE name = ?`,
        [roleName]
    );

    const role = roleRows[0];
    if (!role) {
        const err = new Error("Role not found");
        err.status = 400;
        throw err;
    }

    if (role.name === "ADMIN") {
        const err = new Error("Creating ADMIN accounts is not allowed.");
        err.status = 400;
        throw err;
    }

    let driverId = dto.driver ?? null;

    if (role.name === "DRIVER") {
        if (!driverId) {
            const err = new Error("Driver account must be linked to a Driver.");
            err.status = 400;
            throw err;
        }
        driverId = Number(driverId);
        if (!Number.isInteger(driverId) || driverId <= 0) {
            const err = new Error("Invalid driver");
            err.status = 400;
            throw err;
        }

        const [drvRows] = await pool.execute(
            `SELECT COUNT(*) AS c FROM driver WHERE id = ?`,
            [driverId]
        );
        if (Number(drvRows[0]?.c ?? 0) === 0) {
            const err = new Error("Driver not found");
            err.status = 400;
            throw err;
        }

        const [takenRows] = await pool.execute(
            `SELECT COUNT(*) AS c FROM users WHERE driver = ?`,
            [driverId]
        );
        if (Number(takenRows[0]?.c ?? 0) > 0) {
            const err = new Error("Driver is already linked to another user.");
            err.status = 400;
            throw err;
        }
    } else {
        driverId = null;
    }

    const name = String(dto.name ?? "").trim();
    const surname = String(dto.surname ?? "").trim();
    const email = String(dto.email ?? "").trim().toLowerCase();
    const password = dto.password;
    const preferredLanguage = String(dto.preferredLanguage ?? "").trim().toLowerCase();

    if (!name || name.length > 20) {
        const err = new Error("Invalid name");
        err.status = 400;
        throw err;
    }
    if (!surname || surname.length > 20) {
        const err = new Error("Invalid surname");
        err.status = 400;
        throw err;
    }
    if (!email || email.length > 40) {
        const err = new Error("Invalid email");
        err.status = 400;
        throw err;
    }
    if (!password || String(password).length > 200) {
        const err = new Error("Invalid password hash");
        err.status = 400;
        throw err;
    }
    if (!preferredLanguage || preferredLanguage.length !== 2) {
        const err = new Error("Invalid preferredLanguage");
        err.status = 400;
        throw err;
    }

    try {
        const [result] = await pool.execute(
            `
      INSERT INTO users (name, surname, email, password, preferredLanguage, role, driver)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
            [name, surname, email, password, preferredLanguage, role.id, driverId]
        );

        return result.insertId;
    } catch (e) {
        const err = new Error("User creation failed (email may already exist).");
        err.status = 400;
        throw err;
    }
}

export async function deleteUser(id) {
    const pool = await db();

    const userId = Number(id);
    if (!userId || userId <= 0) {
        const err = new Error("Invalid userId");
        err.status = 400;
        throw err;
    }

    const [roleRows] = await pool.execute(
        `
            SELECT r.name AS roleName
            FROM users u
                     JOIN role r ON r.id = u.role
            WHERE u.id = ?
                LIMIT 1
        `,
        [userId]
    );

    const roleName = roleRows[0]?.roleName;
    if (!roleName) {
        const err = new Error("User not found");
        err.status = 404;
        throw err;
    }

    if (roleName === "ADMIN") {
        const err = new Error("ADMIN accounts cannot be deleted");
        err.status = 400;
        throw err;
    }

    const [tRows] = await pool.execute(
        `SELECT COUNT(*) AS c FROM team WHERE manager = ?`,
        [userId]
    );

    if (Number(tRows[0]?.c ?? 0) > 0) {
        const err = new Error("Cannot delete user who manages a team");
        err.status = 400;
        throw err;
    }

    const [res] = await pool.execute(
        `DELETE FROM users WHERE id = ?`,
        [userId]
    );

    if (res.affectedRows === 0) {
        const err = new Error("User not found");
        err.status = 404;
        throw err;
    }
}

export async function getUserByIdForAdmin(id) {
    const pool = await db();
    const userId = Number(id);

    if (!Number.isInteger(userId) || userId <= 0) {
        const err = new Error("Invalid userId");
        err.status = 400;
        throw err;
    }

    const [rows] = await pool.execute(
        `
    SELECT u.id, u.name, u.surname, u.email, u.preferredLanguage,
           r.name AS roleName, u.driver,
           tm.id AS managedTeamId
    FROM users u
    JOIN role r ON r.id = u.role
    LEFT JOIN team tm ON tm.manager = u.id
    WHERE u.id = ?
    LIMIT 1
    `,
        [userId]
    );

    const row = rows[0];
    if (!row) {
        const err = new Error("User not found");
        err.status = 404;
        throw err;
    }

    return row;
}


export async function updateUserAsAdmin(targetUserId, dto) {
    const pool = await db();
    const userId = Number(targetUserId);

    if (!Number.isInteger(userId) || userId <= 0) {
        const err = new Error("Invalid userId");
        err.status = 400;
        throw err;
    }

    const [uRows] = await pool.execute(
        `
    SELECT u.id, u.driver, r.name AS roleName
    FROM users u
    JOIN role r ON r.id = u.role
    WHERE u.id = ?
    LIMIT 1
    `,
        [userId]
    );

    const user = uRows[0];
    if (!user) {
        const err = new Error("User not found");
        err.status = 404;
        throw err;
    }

    if (user.roleName === "ADMIN") {
        const err = new Error("Editing ADMIN accounts is not allowed.");
        err.status = 400;
        throw err;
    }

    const roleName = String(dto.roleName || "").trim();
    const driverId = dto.driverId === null ? null : Number(dto.driverId);
    const teamId = dto.teamId === null ? null : Number(dto.teamId);

    const [roleRows] = await pool.execute(
        `SELECT id, name FROM role WHERE name = ? LIMIT 1`,
        [roleName]
    );
    const role = roleRows[0];
    if (!role) {
        const err = new Error("Role not found");
        err.status = 400;
        throw err;
    }

    const [managedRows] = await pool.execute(
        `SELECT id FROM team WHERE manager = ? LIMIT 1`,
        [userId]
    );
    const currentManagedTeamId = managedRows[0]?.id ?? null;

    if (role.name === "DRIVER") {
        if (!driverId || !Number.isInteger(driverId) || driverId <= 0) {
            const err = new Error("driverId is required for DRIVER");
            err.status = 400;
            throw err;
        }

        const [drvRows] = await pool.execute(
            `SELECT COUNT(*) AS c FROM driver WHERE id = ?`,
            [driverId]
        );
        if (Number(drvRows[0]?.c ?? 0) === 0) {
            const err = new Error("Driver not found");
            err.status = 400;
            throw err;
        }

        const [takenRows] = await pool.execute(
            `SELECT COUNT(*) AS c FROM users WHERE driver = ? AND id <> ?`,
            [driverId, userId]
        );
        if (Number(takenRows[0]?.c ?? 0) > 0) {
            const err = new Error("Driver is not available (already linked).");
            err.status = 400;
            throw err;
        }

        if (currentManagedTeamId) {
            await pool.execute(`UPDATE team SET manager = NULL WHERE manager = ?`, [userId]);
        }

        await pool.execute(
            `UPDATE users SET role = ?, driver = ? WHERE id = ?`,
            [role.id, driverId, userId]
        );

        return { ok: true };
    }

    if (role.name === "MANAGER") {
        if (!teamId || !Number.isInteger(teamId) || teamId <= 0) {
            const err = new Error("teamId is required for MANAGER");
            err.status = 400;
            throw err;
        }

        const [tRows] = await pool.execute(
            `SELECT id, manager FROM team WHERE id = ? LIMIT 1`,
            [teamId]
        );
        const team = tRows[0];
        if (!team) {
            const err = new Error("Team not found");
            err.status = 400;
            throw err;
        }

        if (team.manager !== null && Number(team.manager) !== userId) {
            const err = new Error("Team is not available (already has manager).");
            err.status = 400;
            throw err;
        }

        await pool.execute(
            `UPDATE users SET role = ?, driver = NULL WHERE id = ?`,
            [role.id, userId]
        );

        await pool.execute(`UPDATE team SET manager = NULL WHERE manager = ?`, [userId]);
        await pool.execute(`UPDATE team SET manager = ? WHERE id = ?`, [userId, teamId]);

        return { ok: true };
    }

    return { ok: true };
}
