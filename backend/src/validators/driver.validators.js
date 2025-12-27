import { z } from "zod";

export const driverCreateSchema = z.object({
    team: z.number().int().positive().optional(),
    name: z.string().min(1).max(20),
    dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
});

export const driverUpdateSchema = driverCreateSchema.partial();
