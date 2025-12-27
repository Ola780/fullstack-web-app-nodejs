import jwt from "jsonwebtoken";
import { config } from "../config.js";

export function authOptional(req, res, next) {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token) return next();
    try {
        req.user = jwt.verify(token, config.jwt.secret);
    } catch {

    }
    next();
}

export function authRequired(req, res, next) {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token) return res.status(401).json({ message: "Missing token" });

    try {
        req.user = jwt.verify(token, config.jwt.secret);
        next();
    } catch {
        res.status(401).json({ message: "Invalid token" });
    }
}
