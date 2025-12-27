import { db, sql } from "../db.js";

export async function getUserContext(userId) {
    const pool = await db();
    const result = await pool.request()
        .input("userId", sql.Int, userId)
        .query(`
      SELECT u.id, u.preferredLanguage, u.driver AS driverId, r.name AS roleName
      FROM [User] u
      JOIN [Role] r ON r.id = u.[role]
      WHERE u.id = @userId
    `);

    const row = result.recordset[0];
    if (!row) {
        const err = new Error("User not found");
        err.status = 401;
        throw err;
    }

    let managerTeamId = null;
    if (row.roleName === "MANAGER") {
        const t = await pool.request()
            .input("userId", sql.Int, userId)
            .query(`SELECT TOP 1 id FROM Team WHERE manager = @userId`);
        managerTeamId = t.recordset[0]?.id ?? null;
    }

    return {
        userId: row.id,
        roleName: row.roleName,
        preferredLanguage: row.preferredLanguage,
        driverId: row.driverId,
        managerTeamId
    };
}
