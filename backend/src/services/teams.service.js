import { db, sql } from "../db.js";
import { getUserContext } from "./context.service.js";

export async function listTeamsForUser(userId) {
    const ctx = await getUserContext(userId);
    const pool = await db();

    if (ctx.roleName === "ADMIN") {
        const r = await pool.request().query(`
      SELECT t.id, t.name, t.points, t.rankingPosition, t.manager,
             u.name AS managerName, u.surname AS managerSurname
      FROM Team t
      JOIN [User] u ON u.id = t.manager
      ORDER BY t.id DESC;
    `);
        return r.recordset;
    }

    if (ctx.roleName === "MANAGER") {
        const r = await pool.request()
            .input("userId", sql.Int, ctx.userId)
            .query(`
        SELECT t.id, t.name, t.points, t.rankingPosition, t.manager
        FROM Team t
        WHERE t.manager = @userId;
      `);
        return r.recordset;
    }


    if (ctx.roleName === "DRIVER" && ctx.driverId) {
        const r = await pool.request().input("driverId", sql.Int, ctx.driverId).query(`
      SELECT t.id, t.name, t.points, t.rankingPosition, t.manager
      FROM Driver d
      JOIN Team t ON t.id = d.team
      WHERE d.id = @driverId;
    `);
        return r.recordset;
    }

    return [];
}
