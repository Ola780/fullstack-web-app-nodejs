import { db, sql } from "../db.js";

export async function listRaces({ page, pageSize }) {
    const pool = await db();
    const offset = (page - 1) * pageSize;

    const itemsRes = await pool.request()
        .input("offset", sql.Int, offset)
        .input("pageSize", sql.Int, pageSize)
        .query(`
      SELECT id, name, startDate, status
      FROM Race
      ORDER BY startDate DESC, id DESC
      OFFSET @offset ROWS FETCH NEXT @pageSize ROWS ONLY;
    `);

    const totalRes = await pool.request().query(`SELECT COUNT(*) AS total FROM Race;`);

    return {
        items: itemsRes.recordset,
        page,
        pageSize,
        total: totalRes.recordset[0].total
    };
}

export async function getRaceDetails(raceId) {
    const pool = await db();
    const raceRes = await pool.request()
        .input("id", sql.Int, raceId)
        .query(`SELECT * FROM Race WHERE id = @id;`);

    const race = raceRes.recordset[0];
    if (!race) {
        const err = new Error("Race not found");
        err.status = 404;
        throw err;
    }

    const enrollRes = await pool.request()
        .input("id", sql.Int, raceId)
        .query(`
      SELECT e.id, e.enrollmentDate, e.finishPosition,
             d.id AS driverId, d.name AS driverName,
             t.id AS teamId, t.name AS teamName
      FROM Enrollment e
      JOIN Driver d ON d.id = e.driver
      JOIN Team t ON t.id = e.team
      WHERE e.race = @id
      ORDER BY e.id DESC;
    `);

    return { race, enrollments: enrollRes.recordset };
}

export async function createRace(dto) {
    const pool = await db();
    const res = await pool.request()
        .input("name", sql.NVarChar(30), dto.name)
        .input("startDate", sql.Date, dto.startDate)
        .input("status", sql.NVarChar(20), dto.status)
        .query(`
      INSERT INTO Race (name, startDate, status)
      OUTPUT INSERTED.id
      VALUES (@name, @startDate, @status);
    `);
    return res.recordset[0].id;
}

export async function updateRace(id, dto) {
    const pool = await db();

    const req = pool.request()
        .input("id", sql.Int, id)
        .input("name", sql.NVarChar(30), dto.name)
        .input("startDate", sql.Date, dto.startDate)
        .input("status", sql.NVarChar(20), dto.status);

    await req.query(`
        UPDATE Race
        SET name = @name,
            startDate = @startDate,
            status = @status
        WHERE id = @id;
    `);
}


export async function deleteRace(id) {
    const pool = await db();
    const check = await pool.request().input("id", sql.Int, id).query(`SELECT COUNT(*) AS c FROM Enrollment WHERE race=@id;`);
    if (check.recordset[0].c > 0) {
        const err = new Error("Cannot delete race with enrollments");
        err.status = 400;
        throw err;
    }
    await pool.request().input("id", sql.Int, id).query(`DELETE FROM Race WHERE id=@id;`);
}
