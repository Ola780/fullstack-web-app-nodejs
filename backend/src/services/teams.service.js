import { db } from "../db.js";
import { getUserContext } from "./context.service.js";

export async function listTeamsForUser(userId) {
    const ctx = await getUserContext(userId);
    const pool = await db();

    if (ctx.roleName === "ADMIN") {
        const [rows] = await pool.execute(
            `
    SELECT t.id, t.name, t.points, t.rankingPosition, t.manager,
           u.name AS managerName, u.surname AS managerSurname
    FROM team t
    LEFT JOIN users u ON u.id = t.manager
    ORDER BY t.id DESC
    `
        );
        return rows;
    }

    if (ctx.roleName === "MANAGER") {
        const [rows] = await pool.execute(
            `
      SELECT t.id, t.name, t.points, t.rankingPosition, t.manager
      FROM team t
      WHERE t.manager = ?
      `,
            [ctx.userId]
        );
        return rows;
    }

    if (ctx.roleName === "DRIVER" && ctx.driverId) {
        const [rows] = await pool.execute(
            `
      SELECT t.id, t.name, t.points, t.rankingPosition, t.manager
      FROM driver d
      JOIN team t ON t.id = d.team
      WHERE d.id = ?
      `,
            [ctx.driverId]
        );
        return rows;
    }

    return [];
}


export async function listAvailableManagersForTeam(userId) {
    const ctx = await getUserContext(userId);
    const pool = await db();

    if (ctx.roleName !== "ADMIN") {
        const err = new Error("Forbidden");
        err.status = 403;
        throw err;
    }

    const [rows] = await pool.execute(`
    SELECT u.id, u.name, u.surname, u.email
    FROM users u
    JOIN role r ON r.id = u.role
    LEFT JOIN team t ON t.manager = u.id
    WHERE r.name = 'MANAGER' AND t.id IS NULL
    ORDER BY u.id DESC
  `);

    return rows;
}



export async function createTeamAsAdmin({ userId, dto }) {
    const ctx = await getUserContext(userId);
    const pool = await db();

    if (ctx.roleName !== "ADMIN") {
        const err = new Error("Forbidden");
        err.status = 403;
        throw err;
    }

    const name = String(dto.name ?? "").trim();
    const managerRaw = dto.manager ?? null;

    if (!name || name.length > 20) {
        const err = new Error("Invalid team name");
        err.status = 400;
        throw err;
    }

    let managerId = null;
    if (managerRaw !== null && managerRaw !== "" && managerRaw !== undefined) {
        managerId = Number(managerRaw);
        if (!Number.isInteger(managerId) || managerId <= 0) {
            const err = new Error("Invalid manager");
            err.status = 400;
            throw err;
        }

        const [mgrRows] = await pool.execute(
            `
      SELECT u.id
      FROM users u
      JOIN role r ON r.id = u.role
      WHERE u.id = ? AND r.name = 'MANAGER'
      LIMIT 1
      `,
            [managerId]
        );
        if (!mgrRows[0]) {
            const err = new Error("Manager not found");
            err.status = 400;
            throw err;
        }

        const [takenRows] = await pool.execute(
            `SELECT COUNT(*) AS c FROM team WHERE manager = ?`,
            [managerId]
        );
        if (Number(takenRows[0]?.c ?? 0) > 0) {
            const err = new Error("This manager already has a team");
            err.status = 400;
            throw err;
        }
    }

    try {
        const [res] = await pool.execute(
            `
      INSERT INTO team (manager, name, points, rankingPosition)
      VALUES (?, ?, 0, 0)
      `,
            [managerId, name]
        );
        return res.insertId;
    } catch (e) {
        const code = String(e?.code || "");
        if (code === "ER_DUP_ENTRY") {
            const err = new Error("Team name already exists");
            err.status = 400;
            throw err;
        }
        const err = new Error("Failed to create team");
        err.status = 400;
        throw err;
    }
}
export async function listTeamsWithoutManager(userId) {
    const ctx = await getUserContext(userId);
    const pool = await db();

    if (ctx.roleName !== "ADMIN") {
        const err = new Error("Forbidden");
        err.status = 403;
        throw err;
    }

    const [rows] = await pool.execute(
        `
    SELECT id, name
    FROM team
    WHERE manager IS NULL
    ORDER BY id DESC
    `
    );

    return rows;
}


