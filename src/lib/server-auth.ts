import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
const credentials = z.object({ email: z.string().email().transform((email) => email.toLowerCase().trim()), password: z.string().min(8).max(128) });
export const getSessionUser = createServerFn({ method: "GET" }).handler(async () => (await import("./auth-service.server")).getSessionUser());
export const signUp = createServerFn({ method: "POST" }).validator(credentials.extend({ name: z.string().trim().min(1).max(80) })).handler(async ({ data }) => (await import("./auth-service.server")).signUp(data));
export const signIn = createServerFn({ method: "POST" }).validator(credentials).handler(async ({ data }) => (await import("./auth-service.server")).signIn(data));
export const signOut = createServerFn({ method: "POST" }).handler(async () => (await import("./auth-service.server")).signOut());
export const requestPasswordReset = createServerFn({ method: "POST" }).validator(z.object({ email: z.string().email().transform((email) => email.toLowerCase().trim()) })).handler(async ({ data }) => (await import("./auth-service.server")).requestPasswordReset(data.email));
export const resetPassword = createServerFn({ method: "POST" }).validator(z.object({ token: z.string().length(64), password: z.string().min(8).max(128) })).handler(async ({ data }) => (await import("./auth-service.server")).resetPassword(data));
