import { ObjectId } from "mongodb";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { CATEGORIES, PAYMENT_METHODS, RECURRENCE, STATUSES, type Expense, type Settings } from "./expense-types";
import { DEFAULT_CURRENCY } from "./currency";
import { getDb } from "./db.server";
import { requireUserId } from "./auth-service.server";

type ExpenseDoc = Omit<Expense, "id"> & { _id: ObjectId; userId: ObjectId };
const expenseSchema = z.object({ date: z.string(), time: z.string(), amount: z.number().positive(), category: z.enum(CATEGORIES), paymentMethod: z.enum(PAYMENT_METHODS), description: z.string(), vendor: z.string().optional(), location: z.string().optional(), notes: z.string().optional(), tags: z.array(z.string()), currency: z.string(), status: z.enum(STATUSES), recurrence: z.enum(RECURRENCE) });
const toExpense = ({ _id, userId, ...expense }: ExpenseDoc): Expense => ({ ...expense, id: _id.toString() } as Expense);

export const getAppData = createServerFn({ method: "GET" }).handler(async () => {
  const userId = await requireUserId(); const db = await getDb();
  const [user, docs] = await Promise.all([db.collection<{ settings: Settings }>("users").findOne({ _id: userId }), db.collection<ExpenseDoc>("expenses").find({ userId }).sort({ createdAt: -1 }).toArray()]);
  return { expenses: docs.map(toExpense), settings: user?.settings ?? { currency: DEFAULT_CURRENCY, budget: { monthly: 2000 } } };
});
export const createExpense = createServerFn({ method: "POST" }).validator(expenseSchema).handler(async ({ data }) => { const userId = await requireUserId(); const doc: ExpenseDoc = { _id: new ObjectId(), userId, ...data, category: data.category as Expense["category"], paymentMethod: data.paymentMethod as Expense["paymentMethod"], status: data.status as Expense["status"], recurrence: data.recurrence as Expense["recurrence"], createdAt: Date.now() }; await (await getDb()).collection<ExpenseDoc>("expenses").insertOne(doc); return toExpense(doc); });
export const updateExpenseOnServer = createServerFn({ method: "POST" }).validator(z.object({ id: z.string(), patch: expenseSchema.partial() })).handler(async ({ data }) => { const userId = await requireUserId(); if (!ObjectId.isValid(data.id)) throw new Error("Invalid expense"); await (await getDb()).collection<ExpenseDoc>("expenses").updateOne({ _id: new ObjectId(data.id), userId }, { $set: data.patch }); return true; });
export const removeExpense = createServerFn({ method: "POST" }).validator(z.object({ id: z.string() })).handler(async ({ data }) => { const userId = await requireUserId(); if (ObjectId.isValid(data.id)) await (await getDb()).collection<ExpenseDoc>("expenses").deleteOne({ _id: new ObjectId(data.id), userId }); return true; });
export const removeExpenses = createServerFn({ method: "POST" }).validator(z.object({ ids: z.array(z.string()) })).handler(async ({ data }) => { const userId = await requireUserId(); await (await getDb()).collection<ExpenseDoc>("expenses").deleteMany({ userId, _id: { $in: data.ids.filter(ObjectId.isValid).map((id) => new ObjectId(id)) } }); return true; });
export const clearExpenses = createServerFn({ method: "POST" }).handler(async () => { const userId = await requireUserId(); await (await getDb()).collection<ExpenseDoc>("expenses").deleteMany({ userId }); return true; });
export const saveSettings = createServerFn({ method: "POST" }).validator(z.object({ settings: z.object({ currency: z.string(), budget: z.object({ monthly: z.number().nonnegative() }) }) })).handler(async ({ data }) => { const userId = await requireUserId(); const db = await getDb(); await Promise.all([db.collection("users").updateOne({ _id: userId }, { $set: { settings: data.settings } }), db.collection("expenses").updateMany({ userId }, { $set: { currency: data.settings.currency } })]); return data.settings; });
