import { Router } from "express";
import { validateBody } from "../middleware/validate.js";
import { authRequired } from "../middleware/auth.js";
import { registerSchema, loginSchema } from "../validators/auth.validators.js";
import { registerDriver, login } from "../services/auth.service.js";
import { getUserContext } from "../services/context.service.js";

export const authRouter = Router();

authRouter.post("/register", validateBody(registerSchema), async (req, res, next) => {
    try {
        const id = await registerDriver(req.body);
        res.status(201).json({ id });
    } catch (e) { next(e); }
});

authRouter.post("/login", validateBody(loginSchema), async (req, res, next) => {
    try {
        const out = await login(req.body);
        res.json(out);
    } catch (e) { next(e); }
});

authRouter.get("/me", authRequired, async (req, res, next) => {
    try {
        const ctx = await getUserContext(req.user.userId);
        res.json(ctx);
    } catch (e) { next(e); }
});
