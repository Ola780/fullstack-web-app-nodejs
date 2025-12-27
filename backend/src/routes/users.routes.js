import { Router } from "express";
import { authRequired } from "../middleware/auth.js";
import { requireRoles } from "../middleware/rbac.js";
import { validateBody } from "../middleware/validate.js";
import { paginationQuerySchema } from "../validators/common.validators.js";
import { userCreateSchema } from "../validators/user.validators.js";
import { listUsers, deleteUser, createUser } from "../services/users.service.js";

export const usersRouter = Router();

usersRouter.get("/", authRequired, requireRoles("ADMIN"), async (req, res, next) => {
    try {
        const q = paginationQuerySchema.parse(req.query);
        res.json(await listUsers(q));
    } catch (e) { next(e); }
});

usersRouter.post("/", authRequired, requireRoles("ADMIN"), validateBody(userCreateSchema), async (req, res, next) => {
    try {
        const id = await createUser(req.body);
        res.status(201).json({ id });
    } catch (e) { next(e); }
});

usersRouter.delete("/:id", authRequired, requireRoles("ADMIN"), async (req, res, next) => {
    try {
        await deleteUser(Number(req.params.id));
        res.json({ ok: true });
    } catch (e) { next(e); }
});
