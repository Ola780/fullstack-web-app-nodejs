import { db } from "../db.js";

export async function listRaces({ page, pageSize }) {
    const pool = await db();

    const safePage = Math.max(1, Number(page) || 1);
    const safePageSize = Math.max(1, Number(pageSize) || 10);
    const offset = (safePage - 1) * safePageSize;

    const [items] = await pool.execute(
        `
    SELECT id, name, startDate, status
    FROM race
    ORDER BY startDate DESC, id DESC
    LIMIT ? OFFSET ?
    `,
        [safePageSize, offset]
    );

    const [totalRows] = await pool.execute(
        `SELECT COUNT(*) AS total FROM race`
    );

    return {
        items,
        page: safePage,
        pageSize: safePageSize,
        total: Number(totalRows[0]?.total ?? 0),
    };
}

export async function getRaceDetails(raceId) {
    const pool = await db();

    const id = Number(raceId);
    if (!Number.isInteger(id) || id <= 0) {
        const err = new Error("Invalid raceId");
        err.status = 400;
        throw err;
    }

    const [raceRows] = await pool.execute(
        `
    SELECT
      id,
      name,
      DATE_FORMAT(startDate, '%Y-%m-%d') AS startDate,
      status
    FROM race
    WHERE id = ?
    `,
        [id]
    );


    const race = raceRows[0];
    if (!race) {
        const err = new Error("Race not found");
        err.status = 404;
        throw err;
    }

    const [enrollments] = await pool.execute(
        `
    SELECT e.id, e.enrollmentDate, e.finishPosition,
           d.id AS driverId, d.name AS driverName,
           t.id AS teamId, t.name AS teamName
    FROM enrollment e
    JOIN driver d ON d.id = e.driver
    JOIN team t   ON t.id = e.team
    WHERE e.race = ?
    ORDER BY e.id DESC
    `,
        [id]
    );

    return { race, enrollments };
}

export async function createRace(dto) {
    const pool = await db();

    const name = String(dto.name ?? "").trim();
    const startDate = dto.startDate;
    const status = String(dto.status ?? "").trim();

    if (!name || name.length > 30) {
        const err = new Error("Invalid name");
        err.status = 400;
        throw err;
    }
    if (!startDate) {
        const err = new Error("startDate is required");
        err.status = 400;
        throw err;
    }
    if (!status || status.length > 20) {
        const err = new Error("Invalid status");
        err.status = 400;
        throw err;
    }

    const [result] = await pool.execute(
        `
    INSERT INTO race (name, startDate, status)
    VALUES (?, ?, ?)
    `,
        [name, startDate, status]
    );

    return result.insertId;
}

export async function updateRace(id, dto) {
    const pool = await db();

    const raceId = Number(id);
    if (!Number.isInteger(raceId) || raceId <= 0) {
        const err = new Error("Invalid raceId");
        err.status = 400;
        throw err;
    }

    const name = String(dto.name ?? "").trim();
    const startDate = dto.startDate;
    const status = String(dto.status ?? "").trim();

    if (!name || name.length > 30) {
        const err = new Error("Invalid name");
        err.status = 400;
        throw err;
    }
    if (!startDate) {
        const err = new Error("startDate is required");
        err.status = 400;
        throw err;
    }
    if (!status || status.length > 20) {
        const err = new Error("Invalid status");
        err.status = 400;
        throw err;
    }

     await pool.execute(
        `
    UPDATE race
    SET name = ?, startDate = ?, status = ?
    WHERE id = ?
    `,
        [name, startDate, status, raceId]
    );

}

export async function deleteRace(id) {
    const pool = await db();

    const raceId = Number(id);
    if (!Number.isInteger(raceId) || raceId <= 0) {
        const err = new Error("Invalid raceId");
        err.status = 400;
        throw err;
    }

    const [checkRows] = await pool.execute(
        `SELECT COUNT(*) AS c FROM enrollment WHERE race = ?`,
        [raceId]
    );

    if (Number(checkRows[0]?.c ?? 0) > 0) {
        const err = new Error("Cannot delete race with enrollments");
        err.status = 400;
        throw err;
    }

     await pool.execute(
        `DELETE FROM race WHERE id = ?`,
        [raceId]
    );

}
