import { useSyncExternalStore } from "react";
import type { Expense, Settings } from "./expense-types";
import { DEFAULT_CURRENCY } from "./currency";
import {
  createExpense,
  getAppData,
  removeExpense,
  removeExpenses,
  resetTrackingData,
  saveSettings,
  updateExpenseOnServer,
} from "./server-data.server";

interface State {
  expenses: Expense[];
  settings: Settings;
  loading: boolean;
}
const empty: State = {
  expenses: [],
  settings: { currency: DEFAULT_CURRENCY, budget: { monthly: 0 } },
  loading: true,
};
let state = empty;
let loaded = false;
let loadVersion = 0;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((listener) => listener());
const setState = (updater: (previous: State) => State) => {
  state = updater(state);
  emit();
};
async function load() {
  const version = ++loadVersion;
  try {
    const data = await getAppData();
    if (version === loadVersion) setState(() => ({ ...data, loading: false }));
  } catch {
    if (version === loadVersion) setState((previous) => ({ ...previous, loading: false }));
  }
}
function subscribe(callback: () => void) {
  listeners.add(callback);
  if (!loaded && typeof window !== "undefined") {
    loaded = true;
    void load();
  }
  return () => listeners.delete(callback);
}
export function clearExpenseStore() {
  loadVersion++;
  loaded = false;
  setState(() => empty);
}
export function refreshExpenses() {
  loaded = true;
  setState(() => empty);
  return load();
}
export function useExpenseStore() {
  return useSyncExternalStore(
    subscribe,
    () => state,
    () => empty,
  );
}
export const actions = {
  async addExpense(expense: Omit<Expense, "id" | "createdAt">) {
    const created = await createExpense({ data: expense });
    setState((s) => ({ ...s, expenses: [created, ...s.expenses] }));
    return created;
  },
  async updateExpense(id: string, patch: Partial<Expense>) {
    await updateExpenseOnServer({ data: { id, patch } });
    setState((s) => ({
      ...s,
      expenses: s.expenses.map((e) => (e.id === id ? { ...e, ...patch } : e)),
    }));
  },
  async deleteExpense(id: string) {
    await removeExpense({ data: { id } });
    setState((s) => ({ ...s, expenses: s.expenses.filter((e) => e.id !== id) }));
  },
  async deleteMany(ids: string[]) {
    await removeExpenses({ data: { ids } });
    const chosen = new Set(ids);
    setState((s) => ({ ...s, expenses: s.expenses.filter((e) => !chosen.has(e.id)) }));
  },
  async updateSettings(patch: Partial<Settings>) {
    const settings = { ...state.settings, ...patch };
    const currencyChanged = Boolean(patch.currency && patch.currency !== state.settings.currency);
    await saveSettings({ data: { settings } });
    setState((s) => ({
      ...s,
      settings,
      expenses: currencyChanged
        ? s.expenses.map((expense) => ({ ...expense, currency: settings.currency }))
        : s.expenses,
    }));
  },
  async setBudget(monthly: number) {
    return this.updateSettings({ budget: { monthly } });
  },
  async resetData() {
    const settings = await resetTrackingData();
    setState((s) => ({ ...s, expenses: [], settings }));
  },
  async importExpenses(list: Expense[]) {
    for (const expense of list) {
      const { id, createdAt, ...payload } = expense;
      await this.addExpense(payload);
    }
  },
};
