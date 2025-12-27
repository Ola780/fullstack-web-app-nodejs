import { z } from "zod";

export const registerSchema = z.object({
    name: z.string().min(1).max(20),
    surname: z.string().min(1).max(20),
    email: z.string().email().max(40),
    password: z.string().min(6).max(100),
    preferredLanguage: z.enum(["pl", "en"]).default("pl")
});

export const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(1)
});
