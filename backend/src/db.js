import mysql from "mysql2/promise";

let pool;

export async function db() {
    if (pool) return pool;

    pool = mysql.createPool({
        host: process.env.DB_HOST,
        port: Number(process.env.DB_PORT),
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,

        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        namedPlaceholders: false,
    });

    await pool.query("SELECT 1");

    return pool;
}
