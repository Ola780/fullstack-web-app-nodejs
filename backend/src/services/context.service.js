import { db } from "../db.js";

export async function getUserContext(userId) {
    const pool = await db();

    const [rows] = await pool.query(
        `SELECT u.id, u.preferredLanguage, u.driver AS driverId, r.name AS roleName
     FROM users u
     JOIN role r ON r.id = u.role
     WHERE u.id = ?
     LIMIT 1`,
        [userId]
    );

    const row = rows[0];
    if (!row) {
        const err = new Error("User not found");
        err.status = 401;
        throw err;
    }

    let managerTeamId = null;
    if (row.roleName === "MANAGER") {
        const [tRows] = await pool.query(
            `SELECT id
       FROM team
       WHERE manager = ?
       LIMIT 1`,
            [userId]
        );
        managerTeamId = tRows[0]?.id ?? null;
    }

    return {
        userId: row.id,
        roleName: row.roleName,
        preferredLanguage: row.preferredLanguage,
        driverId: row.driverId,
        managerTeamId,
    };
}
