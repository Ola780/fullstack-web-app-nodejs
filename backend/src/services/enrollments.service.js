import { db, sql } from "../db.js";
import { getUserContext } from "./context.service.js";

export async function listEnrollmentsForUser({ userId, page, pageSize }) {
    const ctx = await getUserContext(userId);
    const pool = await db();
    const offset = (page - 1) * pageSize;

    let where = "1=1";

    const req = pool.request()
        .input("offset", sql.Int, offset)
        .input("pageSize", sql.Int, pageSize);

    if (ctx.roleName === "MANAGER") {
        if (!ctx.managerTeamId) return { items: [], page, pageSize, total: 0 };
        where = "e.team = @teamId";
        req.input("teamId", sql.Int, ctx.managerTeamId);
    } else if (ctx.roleName === "DRIVER") {
        if (!ctx.driverId) return { items: [], page, pageSize, total: 0 };
        where = "e.driver = @driverId";
        req.input("driverId", sql.Int, ctx.driverId);
    }

    const itemsRes = await req.query(`
    SELECT e.id, e.enrollmentDate, e.finishPosition,
           r.id AS raceId, r.name AS raceName, r.startDate,
           d.id AS driverId, d.name AS driverName,
           t.id AS teamId, t.name AS teamName
    FROM Enrollment e
    JOIN Race r ON r.id = e.race
    JOIN Driver d ON d.id = e.driver
    JOIN Team t ON t.id = e.team
    WHERE ${where}
    ORDER BY e.id DESC
    OFFSET @offset ROWS FETCH NEXT @pageSize ROWS ONLY;
  `);

    const countReq = pool.request();
    if (ctx.roleName === "MANAGER" && ctx.managerTeamId) {
        countReq.input("teamId", sql.Int, ctx.managerTeamId);
        const totalRes = await countReq.query(`SELECT COUNT(*) AS total FROM Enrollment e WHERE e.team=@teamId;`);
        return { items: itemsRes.recordset, page, pageSize, total: totalRes.recordset[0].total };
    }
    if (ctx.roleName === "DRIVER" && ctx.driverId) {
        countReq.input("driverId", sql.Int, ctx.driverId);
        const totalRes = await countReq.query(`SELECT COUNT(*) AS total FROM Enrollment e WHERE e.driver=@driverId;`);
        return { items: itemsRes.recordset, page, pageSize, total: totalRes.recordset[0].total };
    }

    const totalRes = await pool.request().query(`SELECT COUNT(*) AS total FROM Enrollment;`);
    return { items: itemsRes.recordset, page, pageSize, total: totalRes.recordset[0].total };
}

export async function getEnrollmentDetailsForUser({ userId, enrollmentId }) {
    const ctx = await getUserContext(userId);
    const pool = await db();

    const res = await pool.request().input("id", sql.Int, enrollmentId).query(`
    SELECT e.*,
           r.name AS raceName, r.startDate, r.status,
           d.name AS driverName, d.team AS driverTeamId,
           t.name AS teamName
    FROM Enrollment e
    JOIN Race r ON r.id = e.race
    JOIN Driver d ON d.id = e.driver
    JOIN Team t ON t.id = e.team
    WHERE e.id = @id;
  `);

    const row = res.recordset[0];
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

    if (ctx.roleName === "DRIVER") {
        const err = new Error("Drivers cannot create enrollments");
        err.status = 403;
        throw err;
    }

    if (ctx.roleName === "MANAGER") {
        if (!ctx.managerTeamId) {
            const err = new Error("Manager has no team");
            err.status = 400;
            throw err;
        }
        if (dto.team !== ctx.managerTeamId) {
            const err = new Error("Manager can enroll only for own team");
            err.status = 403;
            throw err;
        }
        const check = await pool.request()
            .input("driverId", sql.Int, dto.driver)
            .input("teamId", sql.Int, ctx.managerTeamId)
            .query(`SELECT COUNT(*) AS c FROM Driver WHERE id=@driverId AND team=@teamId;`);
        if (check.recordset[0].c === 0) {
            const err = new Error("Driver is not in manager team");
            err.status = 403;
            throw err;
        }
    }

    const dup = await pool.request()
        .input("race", sql.Int, dto.race)
        .input("driver", sql.Int, dto.driver)
        .query(`SELECT COUNT(*) AS c FROM Enrollment WHERE race=@race AND driver=@driver;`);
    if (dup.recordset[0].c > 0) {
        const err = new Error("Driver already enrolled in this race");
        err.status = 400;
        throw err;
    }

    const res = await pool.request()
        .input("race", sql.Int, dto.race)
        .input("driver", sql.Int, dto.driver)
        .input("team", sql.Int, dto.team)
        .input("finishPosition", sql.Int, dto.finishPosition ?? null)
        .input("enrollmentDate", sql.Date, dto.enrollmentDate)
        .query(`
      INSERT INTO Enrollment (race, driver, team, finishPosition, enrollmentDate)
      OUTPUT INSERTED.id
      VALUES (@race, @driver, @team, @finishPosition, @enrollmentDate);
    `);

    return res.recordset[0].id;
}

export async function updateEnrollmentFinishPositionAsUser({ userId, enrollmentId, dto }) {
    const ctx = await getUserContext(userId);
    const pool = await db();

    if (ctx.roleName === "DRIVER") {
        const err = new Error("Forbidden");
        err.status = 403;
        throw err;
    }

    if (ctx.roleName === "MANAGER") {
        const e = await pool.request().input("id", sql.Int, enrollmentId).query(`SELECT team FROM Enrollment WHERE id=@id;`);
        const row = e.recordset[0];
        if (!row || row.team !== ctx.managerTeamId) {
            const err = new Error("Forbidden");
            err.status = 403;
            throw err;
        }
    }

    await pool.request()
        .input("id", sql.Int, enrollmentId)
        .input("finishPosition", sql.Int, dto.finishPosition ?? null)
        .query(`UPDATE Enrollment SET finishPosition=@finishPosition WHERE id=@id;`);
}

export async function deleteEnrollmentAsUser({ userId, enrollmentId }) {
    const ctx = await getUserContext(userId);
    const pool = await db();

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

        const ok = await pool.request()
            .input("enrollmentId", sql.Int, enrollmentId)
            .input("teamId", sql.Int, ctx.managerTeamId)
            .query(`SELECT COUNT(*) AS c FROM Enrollment WHERE id=@enrollmentId AND team=@teamId;`);

        if (ok.recordset[0].c === 0) {
            const err = new Error("Forbidden");
            err.status = 403;
            throw err;
        }
    }

    await pool.request()
        .input("id", sql.Int, enrollmentId)
        .query(`DELETE FROM Enrollment WHERE id=@id;`);
}

