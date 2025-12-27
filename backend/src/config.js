import dotenv from "dotenv";
dotenv.config();

console.log("CONFIG DB =", {
    server: process.env.DB_SERVER,
    port: process.env.DB_PORT,
    database: process.env.DB_DATABASE,
});

export const config = {
    port: process.env.PORT || 4000,

    corsOrigin: process.env.CORS_ORIGIN,

    db: {
        server: process.env.DB_SERVER,
        port: Number(process.env.DB_PORT),
        database: process.env.DB_DATABASE,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        encrypt: process.env.DB_ENCRYPT === "true",
    },

    jwt: {
        secret: process.env.JWT_SECRET,
        expires: process.env.JWT_EXPIRES,
    },
};



