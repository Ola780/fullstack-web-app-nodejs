import { db, sql } from "../db.js";
import { getUserContext } from "./context.service.js";

export async function listDriversForUser({ userId, page, pageSize }) {
    const ctx = await getUserContext(userId);
    const pool = await db();
    const offset = (page - 1) * pageSize;

    // DRIVER: inna logika (zwracasz 1 rekord, bez paginacji)
    if (ctx.roleName === "DRIVER") {
        if (!ctx.driverId) return { items: [], page, pageSize, total: 0 };

        const itemsRes = await pool.request()
            .input("driverId", sql.Int, ctx.driverId)
            .query(`
        SELECT d.id, d.name, d.dateOfBirth, t.id AS teamId, t.name AS teamName
        FROM Driver d
        JOIN Team t ON t.id = d.team
        WHERE d.id = @driverId;
      `);

        return {
            items: itemsRes.recordset,
            page: 1,
            pageSize: 1,
            total: itemsRes.recordset.length
        };
    }
    if (ctx.roleName !== "ADMIN" && ctx.roleName !== "MANAGER") {
        const err = new Error("Forbidden");
        err.status = 403;
        throw err;
    }

    let where = "1=1";
    const req = pool.request()
        .input("offset", sql.Int, offset)
        .input("pageSize", sql.Int, pageSize);

    if (ctx.roleName === "MANAGER") {
        if (!ctx.managerTeamId) return { items: [], page, pageSize, total: 0 };
        where = "d.team = @teamId";
        req.input("teamId", sql.Int, ctx.managerTeamId);
    }

    const itemsRes = await req.query(`
    SELECT d.id, d.name, d.dateOfBirth, t.id AS teamId, t.name AS teamName
    FROM Driver d
    JOIN Team t ON t.id = d.team
    WHERE ${where}
    ORDER BY d.id DESC
    OFFSET @offset ROWS FETCH NEXT @pageSize ROWS ONLY;
  `);

    if (ctx.roleName === "MANAGER") {
        const totalRes = await pool.request()
            .input("teamId", sql.Int, ctx.managerTeamId)
            .query(`
        SELECT COUNT(*) AS total
        FROM Driver d
        WHERE d.team = @teamId;
      `);

        return {
            items: itemsRes.recordset,
            page,
            pageSize,
            total: totalRes.recordset[0].total
        };
    }

    // ADMIN total
    const totalRes = await pool.request().query(`
    SELECT COUNT(*) AS total FROM Driver;
  `);

    return {
        items: itemsRes.recordset,
        page,
        pageSize,
        total: totalRes.recordset[0].total
    };
}

export async function getDriverDetailsForUser({ userId, driverId }) {
    const ctx = await getUserContext(userId);
    const pool = await db();

    if (ctx.roleName === "MANAGER" && ctx.managerTeamId) {
        const ok = await pool.request()
            .input("driverId", sql.Int, driverId)
            .input("teamId", sql.Int, ctx.managerTeamId)
            .query(`SELECT COUNT(*) AS c FROM Driver WHERE id=@driverId AND team=@teamId;`);
        if (ok.recordset[0].c === 0) {
            const err = new Error("Forbidden");
            err.status = 403;
            throw err;
        }
    }

    if (ctx.roleName === "DRIVER") {
        if (!ctx.driverId || ctx.driverId !== driverId) {
            const err = new Error("Forbidden");
            err.status = 403;
            throw err;
        }
    }

    const driverRes = await pool.request().input("id", sql.Int, driverId).query(`
    SELECT d.*, t.name AS teamName, t.manager AS managerUserId
    FROM Driver d
    JOIN Team t ON t.id = d.team
    WHERE d.id = @id;
  `);
    const driver = driverRes.recordset[0];
    if (!driver) {
        const err = new Error("Driver not found");
        err.status = 404;
        throw err;
    }

    const enrollRes = await pool.request().input("id", sql.Int, driverId).query(`
    SELECT e.id, e.enrollmentDate, e.finishPosition,
           r.id AS raceId, r.name AS raceName, r.startDate, r.status,
           t.id AS teamId, t.name AS teamName
    FROM Enrollment e
    JOIN Race r ON r.id = e.race
    JOIN Team t ON t.id = e.team
    WHERE e.driver = @id
    ORDER BY r.startDate DESC;
  `);

    return { driver, enrollments: enrollRes.recordset };
}


export async function createDriver(userId, dto) {
    const ctx = await getUserContext(userId);
    const pool = await db();

    let teamId;

    if (ctx.roleName === "ADMIN") {
        if (!dto.team) {
            const err = new Error("Team is required");
            err.status = 400;
            throw err;
        }
        teamId = dto.team;
    }

    if (ctx.roleName === "MANAGER") {
        if (!ctx.managerTeamId) {
            const err = new Error("Manager has no team assigned");
            err.status = 400;
            throw err;
        }
    }

     teamId = ctx.roleName === "MANAGER" ? ctx.managerTeamId : dto.team;

    const res = await pool.request()
        .input("team", sql.Int, teamId)
        .input("name", sql.NVarChar(20), dto.name)
        .input("dob", sql.Date, dto.dateOfBirth)
        .query(`
      INSERT INTO Driver (team, name, dateOfBirth)
      OUTPUT INSERTED.id
      VALUES (@team, @name, @dob);
    `);

    return res.recordset[0].id;
}

export async function updateDriverAsUser({ userId, driverId, dto }) {
    const ctx = await getUserContext(userId);
    const pool = await db();

    if (ctx.roleName === "MANAGER") {
        if (!ctx.managerTeamId) {
            const err = new Error("Manager has no team assigned");
            err.status = 400;
            throw err;
        }

        const ok = await pool.request()
            .input("driverId", sql.Int, driverId)
            .input("teamId", sql.Int, ctx.managerTeamId)
            .query(`SELECT COUNT(*) AS c FROM Driver WHERE id=@driverId AND team=@teamId;`);

        if (ok.recordset[0].c === 0) {
            const err = new Error("Forbidden");
            err.status = 403;
            throw err;
        }

    }

    const req = pool.request()
        .input("id", sql.Int, driverId)
        .input("team", sql.Int, dto.team)
        .input("name", sql.NVarChar(20), dto.name)
        .input("dob", sql.Date, dto.dateOfBirth);

    await req.query(`
    UPDATE Driver
    SET team=@team,
      name=@name,
      dateOfBirth=@dob
    WHERE id=@id;
                `);

}

export async function deleteDriverAsUser({ userId, driverId }) {
    const ctx = await getUserContext(userId);
    const pool = await db();

    if (ctx.roleName === "MANAGER") {
        if (!ctx.managerTeamId) {
            const err = new Error("Manager has no team assigned");
            err.status = 400;
            throw err;
        }

        const ok = await pool.request()
            .input("driverId", sql.Int, driverId)
            .input("teamId", sql.Int, ctx.managerTeamId)
            .query(`SELECT COUNT(*) AS c FROM Driver WHERE id=@driverId AND team=@teamId;`);

        if (ok.recordset[0].c === 0) {
            const err = new Error("Forbidden");
            err.status = 403;
            throw err;
        }
    }

    const check = await pool.request()
        .input("id", sql.Int, driverId)
        .query(`SELECT COUNT(*) AS c FROM Enrollment WHERE driver=@id;`);

    if (check.recordset[0].c > 0) {
        const err = new Error("Cannot delete driver with enrollments");
        err.status = 400;
        throw err;
    }

    await pool.request()
        .input("id", sql.Int, driverId)
        .query(`DELETE FROM Driver WHERE id=@id;`);
}




export async function listAvailableDrivers() {
    const pool = await db();
    const res = await pool.request().query(`
    SELECT d.id, d.name, t.name AS teamName
    FROM Driver d
    JOIN Team t ON t.id = d.team
    LEFT JOIN [User] u ON u.driver = d.id
    WHERE u.id IS NULL
    ORDER BY d.id DESC;
  `);
    return res.recordset;
}