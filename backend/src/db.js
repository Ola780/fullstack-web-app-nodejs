import sql from "mssql";
import { config } from "./config.js";
import dotenv from "dotenv";
dotenv.config();
console.log("DB CFG =", {
    server: config.db.server,
    port: config.db.port,
    database: config.db.database,
    user: config.db.user,
    passwordLength: (config.db.password || "").length,
    encrypt: config.db.encrypt,
});


const poolPromise = new sql.ConnectionPool({
    server: config.db.server,
    port: config.db.port,
    database: config.db.database,
    user: config.db.user,
    password: config.db.password,
    options: {
        encrypt: false,
        trustServerCertificate: true
    }
}).connect();

export async function db() {
    return poolPromise;
}

export { sql };

