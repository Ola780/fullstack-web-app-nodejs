import { Router } from "express";
import { authRequired } from "../middleware/auth.js";
import { listTeamsForUser } from "../services/teams.service.js";

export const teamsRouter = Router();

teamsRouter.get("/", authRequired, async (req, res, next) => {
    try {
        res.json(await listTeamsForUser(req.user.userId));
    } catch (e) { next(e); }
});
