import { Router } from "express";
import { authOptional, authRequired } from "../middleware/auth.js";
import { requireRoles } from "../middleware/rbac.js";
import { validateBody } from "../middleware/validate.js";
import { raceCreateSchema, raceUpdateSchema } from "../validators/race.validators.js";
import { paginationQuerySchema } from "../validators/common.validators.js";
import { listRaces, getRaceDetails, createRace, updateRace, deleteRace } from "../services/races.service.js";

export const racesRouter = Router();

racesRouter.get("/", authOptional, async (req, res, next) => {
    try {
        const q = paginationQuerySchema.parse(req.query);
        res.json(await listRaces(q));
    } catch (e) { next(e); }
});

racesRouter.get("/:id", authOptional, async (req, res, next) => {
    try {
        res.json(await getRaceDetails(Number(req.params.id)));
    } catch (e) { next(e); }
});

// ADMIN CRUD
racesRouter.post("/", authRequired, requireRoles("ADMIN"), validateBody(raceCreateSchema), async (req, res, next) => {
    try {
        const id = await createRace(req.body);
        res.status(201).json({ id });
    } catch (e) { next(e); }
});

racesRouter.put("/:id", authRequired, requireRoles("ADMIN"), validateBody(raceUpdateSchema), async (req, res, next) => {
    try {
        await updateRace(Number(req.params.id), req.body);
        res.json({ ok: true });
    } catch (e) { next(e); }
});

racesRouter.delete("/:id", authRequired, requireRoles("ADMIN"), async (req, res, next) => {
    try {
        await deleteRace(Number(req.params.id));
        res.json({ ok: true });
    } catch (e) { next(e); }
});
