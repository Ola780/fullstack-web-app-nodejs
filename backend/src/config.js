import dotenv from "dotenv";
dotenv.config();

console.log("CONFIG DB =", {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
});

export const config = {
    port: process.env.PORT || 4000,

    corsOrigin: process.env.CORS_ORIGIN,

    db: {
        host: process.env.DB_HOST,
        port: Number(process.env.DB_PORT || 3306),
        database: process.env.DB_NAME,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        ssl: process.env.DB_SSL === "true",
    },

    jwt: {
        secret: process.env.JWT_SECRET,
        expires: process.env.JWT_EXPIRES,
    },
};
