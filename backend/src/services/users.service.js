import { db, sql } from "../db.js";



export async function listUsers({ page, pageSize }) {
    const pool = await db();
    const offset = (page - 1) * pageSize;

    const items = await pool.request()
        .input("offset", sql.Int, offset)
        .input("pageSize", sql.Int, pageSize)
        .query(`
      SELECT u.id, u.name, u.surname, u.email, u.preferredLanguage,
             r.name AS roleName, u.driver
      FROM [User] u
      JOIN [Role] r ON r.id = u.[role]
      ORDER BY u.id DESC
      OFFSET @offset ROWS FETCH NEXT @pageSize ROWS ONLY;
    `);

    const total = await pool.request().query(`SELECT COUNT(*) AS total FROM [User];`);

    return { items: items.recordset, page, pageSize, total: total.recordset[0].total };
}

export async function createUser(dto) {
    const pool = await db();

    const roleRes = await pool.request()
        .input("roleName", sql.NVarChar(10), dto.roleName)
        .query(`SELECT id, name FROM [Role] WHERE name = @roleName;`);

    const role = roleRes.recordset[0];
    if (!role) {
        const err = new Error("Role not found");
        err.status = 400;
        throw err;
    }

    if (role.name === "ADMIN") {
        const err = new Error("Creating ADMIN accounts is not allowed.");
        err.status = 400;
        throw err;
    }

    let driverId = dto.driver ?? null;

    if (role.name === "DRIVER") {
        if (!driverId) {
            const err = new Error("Driver account must be linked to a Driver.");
            err.status = 400;
            throw err;
        }
    } else {
        driverId = null;
    }


    const passwordHash = dto.password;


    try {
        const res = await pool.request()
            .input("name", sql.NVarChar(20), dto.name)
            .input("surname", sql.NVarChar(20), dto.surname)
            .input("email", sql.NVarChar(40), dto.email)
            .input("password", sql.NVarChar(255), passwordHash)
            .input("preferredLanguage", sql.Char(2), dto.preferredLanguage.toLowerCase())
            .input("role", sql.Int, role.id)
            .input("driver", sql.Int, driverId)
            .query(`
        INSERT INTO [User] (name, surname, email, [password], preferredLanguage, [role], driver)
        OUTPUT INSERTED.id
        VALUES (@name, @surname, @email, @password, @preferredLanguage, @role, @driver);
      `);

        return res.recordset[0].id;
    } catch (e) {
        const err = new Error("User creation failed (email may already exist).");
        err.status = 400;
        throw err;
    }
}
export async function deleteUser(id) {
    const pool = await db();

    const t = await pool.request().input("id", sql.Int, id).query(`SELECT COUNT(*) AS c FROM Team WHERE manager=@id;`);
    if (t.recordset[0].c > 0) {
        const err = new Error("Cannot delete user who manages a team");
        err.status = 400;
        throw err;
    }

    await pool.request().input("id", sql.Int, id).query(`DELETE FROM [User] WHERE id=@id;`);
}
