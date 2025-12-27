import { Router } from "express";
import { authRequired } from "../middleware/auth.js";
import { requireRoles } from "../middleware/rbac.js";
import { validateBody } from "../middleware/validate.js";
import { paginationQuerySchema } from "../validators/common.validators.js";
import { driverCreateSchema, driverUpdateSchema } from "../validators/driver.validators.js";
import {
    listDriversForUser,
    getDriverDetailsForUser,
    createDriver,
    updateDriverAsUser,
    deleteDriverAsUser,
    listAvailableDrivers
} from "../services/drivers.service.js";

export const driversRouter = Router();

driversRouter.get("/", authRequired, async (req, res, next) => {
    try {
        const q = paginationQuerySchema.parse(req.query);
        res.json(await listDriversForUser({ userId: req.user.userId, ...q }));
    } catch (e) { next(e); }
});

driversRouter.get(
    "/available",
    authRequired,
    requireRoles("ADMIN"),
    async (req, res, next) => {
        try {
            res.json(await listAvailableDrivers());
        } catch (e) {
            next(e);
        }
    }
);


driversRouter.get("/:id", authRequired, async (req, res, next) => {
    try {
        res.json(await getDriverDetailsForUser({ userId: req.user.userId, driverId: Number(req.params.id) }));
    } catch (e) { next(e); }
});

driversRouter.post("/", authRequired, requireRoles("ADMIN", "MANAGER"), validateBody(driverCreateSchema), async (req, res, next) => {
    try {
        const id = await createDriver(req.user.userId,req.body);
        res.status(201).json({ id });
    } catch (e) { next(e); }
});

driversRouter.put("/:id", authRequired, requireRoles("ADMIN","MANAGER"), validateBody(driverUpdateSchema), async (req, res, next) => {
    try {
        await updateDriverAsUser({
            userId: req.user.userId,
            driverId: Number(req.params.id),
            dto: req.body
        });
        res.json({ ok: true });
    } catch (e) { next(e); }
});


driversRouter.delete("/:id", authRequired, requireRoles("ADMIN","MANAGER"), async (req, res, next) => {
    try {
        await deleteDriverAsUser({
            userId: req.user.userId,
            driverId: Number(req.params.id)
        });
        res.json({ ok: true });
    } catch (e) { next(e); }
});

