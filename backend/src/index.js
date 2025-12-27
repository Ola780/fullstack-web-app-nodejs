
import express from "express";
import cors from "cors";
import { config } from "./config.js";
import { errorHandler } from "./middleware/error.js";

import { authRouter } from "./routes/auth.routes.js";
import { racesRouter } from "./routes/races.routes.js";
import { driversRouter } from "./routes/drivers.routes.js";
import { enrollmentsRouter } from "./routes/enrollments.routes.js";
import { teamsRouter } from "./routes/teams.routes.js";
import { usersRouter } from "./routes/users.routes.js";

const app = express();

app.use(cors({ origin: config.corsOrigin }));
app.use(express.json());

app.get("/health", (req, res) => res.json({ ok: true }));

app.use("/api/auth", authRouter);
app.use("/api/races", racesRouter);
app.use("/api/drivers", driversRouter);
app.use("/api/enrollments", enrollmentsRouter);
app.use("/api/teams", teamsRouter);
app.use("/api/users", usersRouter);

app.use(errorHandler);

app.listen(config.port, () => {
    console.log(`API running on http://localhost:${config.port}`);
});
