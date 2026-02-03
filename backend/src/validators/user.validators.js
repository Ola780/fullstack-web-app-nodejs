import { z } from "zod";

export const userCreateSchema = z.object({
    name: z.string().trim().min(1).max(20),
    surname: z.string().trim().min(1).max(20),
    email: z.string().trim().email().max(40),
    password: z.string().min(4).max(200),
    preferredLanguage: z.enum(["pl", "en"]).default("pl"),
    roleName: z.enum(["DRIVER", "MANAGER"]),
    driver: z.number().int().positive().nullable().optional(),
});

export const userEditCrudSchema = z.object({
    roleName: z.enum(["DRIVER", "MANAGER"]),
    driverId: z.number().int().positive().nullable(),
    teamId: z.number().int().positive().nullable(),
});

