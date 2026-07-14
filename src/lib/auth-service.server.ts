// Internal server-only authentication service.
import { createHmac, randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { ObjectId } from "mongodb";
import { deleteCookie, getCookie, setCookie } from "@tanstack/react-start/server";
import { z } from "zod";
import { getDb } from "./db.server";
import { DEFAULT_CURRENCY } from "./currency";

const scrypt = promisify(scryptCallback);
const SESSION = "spendly_session";
const sessionSecret = () => process.env.SESSION_SECRET ?? process.env.MONGODB_URI ?? "development-secret";

type User = { _id: ObjectId; email: string; name: string; passwordHash: string; settings: { currency: string; budget: { monthly: number } }; resetTokenHash?: string; resetExpiresAt?: Date };

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const derived = (await scrypt(password, salt, 64)) as Buffer;
  return `${salt}:${derived.toString("hex")}`;
}
async function verifyPassword(password: string, encoded: string) {
  const [salt, key] = encoded.split(":");
  if (!salt || !key) return false;
  const derived = (await scrypt(password, salt, 64)) as Buffer;
  return timingSafeEqual(derived, Buffer.from(key, "hex"));
}
function sign(id: string) {
  const payload = `${id}.${Date.now() + 1000 * 60 * 60 * 24 * 14}`;
  return `${payload}.${createHmac("sha256", sessionSecret()).update(payload).digest("hex")}`;
}
function userIdFromSession() {
  const token = getCookie(SESSION);
  if (!token) return null;
  const [id, expires, signature] = token.split(".");
  const payload = `${id}.${expires}`;
  const expected = createHmac("sha256", sessionSecret()).update(payload).digest("hex");
  if (!id || !expires || !signature || signature !== expected || Date.now() > Number(expires) || !ObjectId.isValid(id)) return null;
  return new ObjectId(id);
}
async function currentUser() {
  const id = userIdFromSession();
  if (!id) return null;
  return getDb().then((db) => db.collection<User>("users").findOne({ _id: id }));
}
function publicUser(user: User) { return { id: user._id.toString(), email: user.email, name: user.name, settings: user.settings }; }
function establishSession(user: User) { setCookie(SESSION, sign(user._id.toString()), { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 24 * 14 }); }

export async function getSessionUser() {
  const user = await currentUser();
  return user ? publicUser(user) : null;
}

export async function signUp(data: { email: string; password: string; name: string }) {
  const db = await getDb();
  const exists = await db.collection<User>("users").findOne({ email: data.email });
  if (exists) throw new Error("An account with this email already exists.");
  const user: User = { _id: new ObjectId(), email: data.email, name: data.name, passwordHash: await hashPassword(data.password), settings: { currency: DEFAULT_CURRENCY, budget: { monthly: 2000 } } };
  await db.collection<User>("users").insertOne(user);
  establishSession(user);
  return publicUser(user);
}

export async function signIn(data: { email: string; password: string }) {
  const user = await (await getDb()).collection<User>("users").findOne({ email: data.email });
  if (!user || !(await verifyPassword(data.password, user.passwordHash))) throw new Error("Incorrect email or password.");
  establishSession(user);
  return publicUser(user);
}

export function signOut() { deleteCookie(SESSION, { path: "/" }); return true; }

export async function requestPasswordReset(email: string) {
  const db = await getDb();
  const token = randomBytes(32).toString("hex");
  await db.collection<User>("users").updateOne({ email }, { $set: { resetTokenHash: createHmac("sha256", sessionSecret()).update(token).digest("hex"), resetExpiresAt: new Date(Date.now() + 1000 * 60 * 30) } });
  // Email delivery intentionally remains provider-agnostic; wire this token into a transactional email service in production.
  return { message: "If an account exists, a reset link will be sent shortly." };
}

export async function resetPassword(data: { token: string; password: string }) {
  const hash = createHmac("sha256", sessionSecret()).update(data.token).digest("hex");
  const db = await getDb();
  const user = await db.collection<User>("users").findOneAndUpdate({ resetTokenHash: hash, resetExpiresAt: { $gt: new Date() } }, { $set: { passwordHash: await hashPassword(data.password) }, $unset: { resetTokenHash: "", resetExpiresAt: "" } }, { returnDocument: "after" });
  if (!user) throw new Error("This reset link is invalid or has expired.");
  establishSession(user);
  return publicUser(user);
}

export async function requireUserId() { const id = userIdFromSession(); if (!id) throw new Error("Unauthorized"); return id; }
