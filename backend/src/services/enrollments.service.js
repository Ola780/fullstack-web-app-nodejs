import { db } from "../db.js";
import { getUserContext } from "./context.service.js";

export async function listEnrollmentsForUser({ userId, page, pageSize }) {
    const ctx = await getUserContext(userId);
    const pool = await db();

    const safePage = Math.max(1, Number(page) || 1);
    const safePageSize = Math.max(1, Number(pageSize) || 10);
    const offset = (safePage - 1) * safePageSize;

    let whereSql = "1=1";
    const whereParams = [];

    if (ctx.roleName === "MANAGER") {
        if (!ctx.managerTeamId) return { items: [], page: safePage, pageSize: safePageSize, total: 0 };
        whereSql = "e.team = ?";
        whereParams.push(ctx.managerTeamId);
    } else if (ctx.roleName === "DRIVER") {
        if (!ctx.driverId) return { items: [], page: safePage, pageSize: safePageSize, total: 0 };
        whereSql = "e.driver = ?";
        whereParams.push(ctx.driverId);
    }

    const [items] = await pool.execute(
        `
            SELECT e.id,
                   DATE_FORMAT(e.enrollmentDate, '%Y-%m-%d') AS enrollmentDate,
                   e.finishPosition,
                   r.id AS raceId, r.name AS raceName,
                   DATE_FORMAT(r.startDate, '%Y-%m-%d') AS startDate,
                   d.id AS driverId, d.name AS driverName,
                   t.id AS teamId, t.name AS teamName
            FROM enrollment e
                     JOIN race r   ON r.id = e.race
                     JOIN driver d ON d.id = e.driver
                     JOIN team t   ON t.id = e.team
            WHERE ${whereSql}
            ORDER BY e.id DESC
                LIMIT ? OFFSET ?
    `,
        [...whereParams, safePageSize, offset]
    );

    const [totalRows] = await pool.execute(
        `
    SELECT COUNT(*) AS total
    FROM enrollment e
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

export async function getEnrollmentDetailsForUser({ userId, enrollmentId }) {
    const ctx = await getUserContext(userId);
    const pool = await db();

    const id = Number(enrollmentId);
    if (!Number.isInteger(id) || id <= 0) {
        const err = new Error("Invalid enrollmentId");
        err.status = 400;
        throw err;
    }

    const [rows] = await pool.execute(
        `
            SELECT
                e.id,
                e.race,
                e.driver,
                e.team,
                e.finishPosition,
                DATE_FORMAT(e.enrollmentDate, '%Y-%m-%d') AS enrollmentDate,
                r.name AS raceName,
                DATE_FORMAT(r.startDate, '%Y-%m-%d') AS startDate,
                r.status,
                d.name AS driverName,
                d.team AS driverTeamId,
                t.name AS teamName
            FROM enrollment e
                     JOIN race r   ON r.id = e.race
                     JOIN driver d ON d.id = e.driver
                     JOIN team t   ON t.id = e.team
            WHERE e.id = ?
    `,
        [id]
    );

    const row = rows[0];
    if (!row) {
        const err = new Error("Enrollment not found");
        err.status = 404;
        throw err;
    }

    if (ctx.roleName === "MANAGER" && row.team !== ctx.managerTeamId) {
        const err = new Error("Forbidden");
        err.status = 403;
        throw err;
    }

    if (ctx.roleName === "DRIVER" && row.driver !== ctx.driverId) {
        const err = new Error("Forbidden");
        err.status = 403;
        throw err;
    }

    return row;
}

export async function createEnrollmentAsUser({ userId, dto }) {
    const ctx = await getUserContext(userId);
    const pool = await db();

    if (ctx.roleName !== "MANAGER") {
        const err = new Error("Only managers can create enrollments");
        err.status = 403;
        throw err;
    }

    if (!ctx.managerTeamId) {
        const err = new Error("Manager has no team");
        err.status = 400;
        throw err;
    }

    const teamId = Number(ctx.managerTeamId);

    const raceId = Number(dto.race);
    const driverId = Number(dto.driver);

    if (!Number.isInteger(raceId) || raceId <= 0) {
        const err = new Error("Invalid race");
        err.status = 400;
        throw err;
    }
    if (!Number.isInteger(driverId) || driverId <= 0) {
        const err = new Error("Invalid driver");
        err.status = 400;
        throw err;
    }

    const [checkRows] = await pool.execute(
        `SELECT COUNT(*) AS c FROM driver WHERE id = ? AND team = ?`,
        [driverId, teamId]
    );

    if (Number(checkRows[0].c) === 0) {
        const err = new Error("Driver is not in manager team");
        err.status = 403;
        throw err;
    }

    const [dupRows] = await pool.execute(
        `SELECT COUNT(*) AS c FROM enrollment WHERE race = ? AND driver = ?`,
        [raceId, driverId]
    );

    if (Number(dupRows[0].c) > 0) {
        const err = new Error("Driver already enrolled in this race");
        err.status = 400;
        throw err;
    }

    let enrollmentDate = dto.enrollmentDate;
    if (!enrollmentDate) {
        const d = new Date();
        enrollmentDate = d.toISOString().slice(0, 10);
    } else if (enrollmentDate instanceof Date) {
        enrollmentDate = enrollmentDate.toISOString().slice(0, 10);
    }

    const finishPosition =
        dto.finishPosition === undefined || dto.finishPosition === null || dto.finishPosition === ""
            ? null
            : Number(dto.finishPosition);

    const [result] = await pool.execute(
        `
    INSERT INTO enrollment (race, driver, team, finishPosition, enrollmentDate)
    VALUES (?, ?, ?, ?, ?)
    `,
        [raceId, driverId, teamId, finishPosition, enrollmentDate]
    );

    return result.insertId;
}

export async function deleteEnrollmentAsUser({ userId, enrollmentId }) {
    const ctx = await getUserContext(userId);
    const pool = await db();

    const id = Number(enrollmentId);
    if (!Number.isInteger(id) || id <= 0) {
        const err = new Error("Invalid enrollmentId");
        err.status = 400;
        throw err;
    }

    if (ctx.roleName === "DRIVER") {
        const err = new Error("Forbidden");
        err.status = 403;
        throw err;
    }

    if (ctx.roleName === "MANAGER") {
        if (!ctx.managerTeamId) {
            const err = new Error("Manager has no team assigned");
            err.status = 400;
            throw err;
        }

        const [okRows] = await pool.execute(
            `SELECT COUNT(*) AS c FROM enrollment WHERE id = ? AND team = ?`,
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

    await pool.execute(`DELETE FROM enrollment WHERE id = ?`, [id]);
}
