import jwt from "jsonwebtoken";
import { db, sql } from "../db.js";
import { config } from "../config.js";

export async function registerDriver({ name, surname, email, password, preferredLanguage }) {
    const pool = await db();

    const roleRes = await pool.request().query(
        `SELECT  id FROM [Role] WHERE name = 'DRIVER'`
    );
    const roleId = roleRes.recordset[0]?.id;

    if (!roleId) {
        const err = new Error("Role DRIVER not found.");
        err.status = 500;
        throw err;
    }

    try {
        const insert = await pool.request()
            .input("name", sql.NVarChar(20), name)
            .input("surname", sql.NVarChar(20), surname)
            .input("email", sql.NVarChar(40), email)
            .input("password", sql.NVarChar(200), password)
            .input("preferredLanguage", sql.Char(2), preferredLanguage)
            .input("role", sql.Int, roleId)
            .query(`
        INSERT INTO [User] (name, surname, email, [password], preferredLanguage, [role], driver)
        OUTPUT INSERTED.id
        VALUES (@name, @surname, @email, @password, @preferredLanguage, @role, NULL)
      `);

        return insert.recordset[0].id;
    } catch (e) {
        const err = new Error("Registration failed (email may already exist).");
        err.status = 400;
        throw err;
    }
}

export async function login({ email, password }) {
    const pool = await db();

    const res = await pool.request()
        .input("email", sql.NVarChar(40), email)
        .query(`
      SELECT u.id, u.[password], r.name AS roleName
      FROM [User] u
      JOIN [Role] r ON r.id = u.[role]
      WHERE u.email = @email
    `);

    const user = res.recordset[0];

    if (!user || password !== user.password) {
        const err = new Error("Invalid credentials");
        err.status = 401;
        throw err;
    }

    const token = jwt.sign(
        { userId: user.id, roleName: user.roleName },
        config.jwt.secret,
        { expiresIn: config.jwt.expires }
    );

    return { token };
}
