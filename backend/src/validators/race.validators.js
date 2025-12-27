import { z } from "zod";

export const raceCreateSchema = z.object({
    name: z.string().min(1).max(30),
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    status: z.string().min(1).max(20)
});

export const raceUpdateSchema = raceCreateSchema.partial();
