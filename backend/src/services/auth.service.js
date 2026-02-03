import jwt from "jsonwebtoken";
import { db } from "../db.js";
import { config } from "../config.js";

export async function registerDriver({ name, surname, email, password, preferredLanguage }) {
    const pool = await db();

    const [roleRows] = await pool.query(
        "SELECT id FROM role WHERE name = 'DRIVER' LIMIT 1"
    );
    const roleId = roleRows[0]?.id;

    if (!roleId) {
        const err = new Error("Role DRIVER not found.");
        err.status = 500;
        throw err;
    }

    try {
        const [result] = await pool.query(
            `INSERT INTO users (name, surname, email, password, preferredLanguage, role, driver)
       VALUES (?, ?, ?, ?, ?, ?, NULL)`,
            [name, surname, email, password, preferredLanguage, roleId]
        );

        return result.insertId;
    } catch {
        const err = new Error("Registration failed (email may already exist).");
        err.status = 400;
        throw err;
    }
}

export async function login({ email, password }) {
    const pool = await db();

    const [rows] = await pool.query(
        `SELECT u.id, u.password, r.name AS roleName
     FROM users u
     JOIN role r ON r.id = u.role
     WHERE u.email = ?
     LIMIT 1`,
        [email]
    );

    const user = rows[0];

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
