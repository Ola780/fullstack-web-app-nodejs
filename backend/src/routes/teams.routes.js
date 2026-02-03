import { Router } from "express";
import { authRequired } from "../middleware/auth.js";
import { listTeamsForUser, createTeamAsAdmin, listAvailableManagersForTeam } from "../services/teams.service.js";
import { listTeamsWithoutManager } from "../services/teams.service.js";


export const teamsRouter = Router();

teamsRouter.get("/", authRequired, async (req, res, next) => {
    try {
        res.json(await listTeamsForUser(req.user.userId));
    } catch (e) {
        next(e);
    }
});

teamsRouter.get("/managers", authRequired, async (req, res, next) => {
    try {
        res.json(await listAvailableManagersForTeam(req.user.userId));
    } catch (e) {
        next(e);
    }
});

teamsRouter.post("/", authRequired, async (req, res, next) => {
    try {
        const id = await createTeamAsAdmin({ userId: req.user.userId, dto: req.body });
        res.status(201).json({ id });
    } catch (e) {
        next(e);
    }
});
teamsRouter.get("/without-manager", authRequired, async (req, res, next) => {
    try {
        res.json(await listTeamsWithoutManager(req.user.userId));
    } catch (e) { next(e); }
});
