import { db } from "../db.js";
import { getUserContext } from "./context.service.js";


export async function listDriversForUser({ userId, page, pageSize }) {
    const ctx = await getUserContext(userId);
    const pool = await db();

    const safePage = Math.max(1, Number(page) || 1);
    const safePageSize = Math.max(1, Number(pageSize) || 10);
    const offset = (safePage - 1) * safePageSize;

    if (ctx.roleName === "DRIVER") {

        const [items] = await pool.execute(

                `SELECT d.id, d.name, DATE_FORMAT(d.dateOfBirth, '%Y-%m-%d') AS dateOfBirth,
                       t.id AS teamId, t.name AS teamName
                FROM driver d
                         JOIN team t ON t.id = d.team
                WHERE d.id = ?`,
            [ctx.driverId]
        );

        return {
            items,
            page: 1,
            pageSize: 1,
            total: items.length,
        };
    }

    if (ctx.roleName !== "ADMIN" && ctx.roleName !== "MANAGER") {
        const err = new Error("Forbidden");
        err.status = 403;
        throw err;
    }

    let whereSql = "1=1";
    const whereParams = [];

    if (ctx.roleName === "MANAGER") {
        if (!ctx.managerTeamId) return { items: [], page: safePage, pageSize: safePageSize, total: 0 };
        whereSql = "d.team = ?";
        whereParams.push(ctx.managerTeamId);
    }

    const [items] = await pool.execute(
        `
    SELECT d.id, d.name, DATE_FORMAT(d.dateOfBirth, '%Y-%m-%d') AS dateOfBirth, t.id AS teamId, t.name AS teamName
    FROM driver d
    JOIN team t ON t.id = d.team
    WHERE ${whereSql}
    ORDER BY d.id DESC
    LIMIT ? OFFSET ?
    `,
        [...whereParams, safePageSize, offset]
    );

    const [totalRows] = await pool.execute(
        `
    SELECT COUNT(*) AS total
    FROM driver d
    WHERE ${whereSql}
    `,
        whereParams
    );

    return {
        items,
        page: safePage,
        pageSize: safePageSize,
        total: Number(totalRows[0]?.total ?? 0),
    };
}

export async function getDriverDetailsForUser({ userId, driverId }) {
    const ctx = await getUserContext(userId);
    const pool = await db();

    const id = Number(driverId);
    if (!id || id <= 0) {
        const err = new Error("Invalid driverId");
        err.status = 400;
        throw err;
    }

    if (ctx.roleName === "MANAGER" && ctx.managerTeamId) {
        const [okRows] = await pool.execute(
            `SELECT COUNT(*) AS c FROM driver WHERE id = ? AND team = ?`,
            [id, ctx.managerTeamId]
        );
        if (Number(okRows[0].c) === 0) {
            const err = new Error("Forbidden");
            err.status = 403;
            throw err;
        }
    }

    if (ctx.roleName === "DRIVER") {
        if (!ctx.driverId || Number(ctx.driverId) !== id) {
            const err = new Error("Forbidden");
            err.status = 403;
            throw err;
        }
    }

    const [driverRows] = await pool.execute(
        `
            SELECT
                d.id,
                d.team,
                d.name,
                DATE_FORMAT(d.dateOfBirth, '%Y-%m-%d') AS dateOfBirth,
                t.name AS teamName,
                t.manager AS managerUserId
            FROM driver d
                     JOIN team t ON t.id = d.team
            WHERE d.id = ?
    `,
        [id]
    );

    const driver = driverRows[0];
    if (!driver) {
        const err = new Error("Driver not found");
        err.status = 404;
        throw err;
    }

    const [enrollments] = await pool.execute(
        `
            SELECT e.id,
                   DATE_FORMAT(e.enrollmentDate, '%Y-%m-%d') AS enrollmentDate,
                   e.finishPosition,
                   r.id AS raceId, r.name AS raceName,
                   DATE_FORMAT(r.startDate, '%Y-%m-%d') AS startDate,
                   r.status,
                   t.id AS teamId, t.name AS teamName
            FROM enrollment e
                     JOIN race r ON r.id = e.race
                     JOIN team t ON t.id = e.team
            WHERE e.driver = ?
            ORDER BY r.startDate DESC
    `,
        [id]
    );

    return { driver, enrollments };
}

export async function createDriver(userId, dto) {
    const ctx = await getUserContext(userId);
    const pool = await db();

    if (ctx.roleName !== "MANAGER") {
        const err = new Error("Forbidden");
        err.status = 403;
        throw err;
    }

    if (!ctx.managerTeamId) {
        const err = new Error("Manager has no team assigned");
        err.status = 400;
        throw err;
    }

    const teamId = Number(ctx.managerTeamId);


    const [teamOk] = await pool.execute(`SELECT COUNT(*) AS c FROM team WHERE id = ?`, [teamId]);
    if (Number(teamOk[0].c) === 0) {
        const err = new Error("Team not found");
        err.status = 400;
        throw err;
    }

    const name = String(dto.name ?? "").trim();
    const dateOfBirth = dto.dateOfBirth;

    if (!name || name.length > 20) {
        const err = new Error("Invalid name");
        err.status = 400;
        throw err;
    }
    if (!dateOfBirth) {
        const err = new Error("dateOfBirth is required");
        err.status = 400;
        throw err;
    }

    const [result] = await pool.execute(
        `
    INSERT INTO driver (team, name, dateOfBirth)
    VALUES (?, ?, ?)
    `,
        [teamId, name, dateOfBirth]
    );

    return result.insertId;
}


export async function updateDriverAsUser({ userId, driverId, dto }) {
    const ctx = await getUserContext(userId);
    const pool = await db();

    if (ctx.roleName !== "MANAGER") {
        const err = new Error("Forbidden");
        err.status = 403;
        throw err;
    }

    if (!ctx.managerTeamId) {
        const err = new Error("Manager has no team assigned");
        err.status = 400;
        throw err;
    }

    const id = Number(driverId);
    if (!id || id <= 0) {
        const err = new Error("Invalid driverId");
        err.status = 400;
        throw err;
    }

    const [currentRows] = await pool.execute(
        `SELECT id, team FROM driver WHERE id = ?`,
        [id]
    );

    const current = currentRows[0];
    if (!current) {
        const err = new Error("Driver not found");
        err.status = 404;
        throw err;
    }

    if (Number(current.team) !== Number(ctx.managerTeamId)) {
        const err = new Error("Forbidden");
        err.status = 403;
        throw err;
    }

    const targetTeamId = Number(ctx.managerTeamId);

    const name = String(dto.name ?? "").trim();
    const dateOfBirth = dto.dateOfBirth;

    if (!name || name.length > 20) {
        const err = new Error("Invalid name");
        err.status = 400;
        throw err;
    }
    if (!dateOfBirth) {
        const err = new Error("dateOfBirth is required");
        err.status = 400;
        throw err;
    }

    await pool.execute(
        `
    UPDATE driver
    SET name = ?, dateOfBirth = ?, team = ?
    WHERE id = ?
    `,
        [name, dateOfBirth, targetTeamId, id]
    );
}


export async function deleteDriverAsUser({ userId, driverId }) {
    const ctx = await getUserContext(userId);
    const pool = await db();

    const id = Number(driverId);
    if (!Number.isInteger(id) || id <= 0) {
        const err = new Error("Invalid driverId");
        err.status = 400;
        throw err;
    }

    if (ctx.roleName === "MANAGER") {
        if (!ctx.managerTeamId) {
            const err = new Error("Manager has no team assigned");
            err.status = 400;
            throw err;
        }

        const [okRows] = await pool.execute(
            `SELECT COUNT(*) AS c FROM driver WHERE id = ? AND team = ?`,
            [id, ctx.managerTeamId]
        );
        if (Number(okRows[0].c) === 0) {
            const err = new Error("Forbidden");
            err.status = 403;
            throw err;
        }
    } else if (ctx.roleName !== "ADMIN") {
        const err = new Error("Forbidden");
        err.status = 403;
        throw err;
    }

    const [checkRows] = await pool.execute(
        `SELECT COUNT(*) AS c FROM enrollment WHERE driver = ?`,
        [id]
    );
    if (Number(checkRows[0].c) > 0) {
        const err = new Error("Cannot delete driver with enrollments");
        err.status = 400;
        throw err;
    }

    await pool.execute(`DELETE FROM driver WHERE id = ?`, [id]);
}

export async function listAvailableDrivers() {
    const pool = await db();

    const [rows] = await pool.execute(
        `
    SELECT d.id, d.name, t.name AS teamName
    FROM driver d
    JOIN team t ON t.id = d.team
    LEFT JOIN users u ON u.driver = d.id
    WHERE u.id IS NULL
    ORDER BY d.id DESC
    `
    );

    return rows;
}
