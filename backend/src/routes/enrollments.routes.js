import { Router } from "express";
import { authRequired } from "../middleware/auth.js";
import { validateBody } from "../middleware/validate.js";
import { paginationQuerySchema } from "../validators/common.validators.js";
import { enrollmentCreateSchema } from "../validators/enrollment.validators.js";
import {
    listEnrollmentsForUser,
    getEnrollmentDetailsForUser,
    createEnrollmentAsUser,
    deleteEnrollmentAsUser,
} from "../services/enrollments.service.js";

export const enrollmentsRouter = Router();

enrollmentsRouter.get("/", authRequired, async (req, res, next) => {
    try {
        const q = paginationQuerySchema.parse(req.query);
        res.json(await listEnrollmentsForUser({ userId: req.user.userId, ...q }));
    } catch (e) { next(e); }
});

enrollmentsRouter.get("/:id", authRequired, async (req, res, next) => {
    try {
        res.json(await getEnrollmentDetailsForUser({ userId: req.user.userId, enrollmentId: Number(req.params.id) }));
    } catch (e) { next(e); }
});

enrollmentsRouter.post("/", authRequired, validateBody(enrollmentCreateSchema), async (req, res, next) => {
    try {
        const id = await createEnrollmentAsUser({ userId: req.user.userId, dto: req.body });
        res.status(201).json({ id });
    } catch (e) { next(e); }
});



enrollmentsRouter.delete("/:id", authRequired, async (req, res, next) => {
    try {
        await deleteEnrollmentAsUser({ userId: req.user.userId, enrollmentId: Number(req.params.id) });
        res.json({ ok: true });
    } catch (e) { next(e); }
});
