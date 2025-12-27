import { z } from "zod";

export const enrollmentCreateSchema = z.object({
    race: z.number().int().positive(),
    driver: z.number().int().positive(),
    team: z.number().int().positive(),
    enrollmentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    finishPosition: z.number().int().min(1).nullable().optional()
});

export const enrollmentUpdateSchema = z.object({
    finishPosition: z.number().int().min(1).nullable().optional()
});
