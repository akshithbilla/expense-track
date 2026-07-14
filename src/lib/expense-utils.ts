import type { Expense } from "./expense-types";

export function ymd(d: Date) {
  return d.toISOString().slice(0, 10);
}

export function startOfWeek(d: Date) {
  const x = new Date(d);
  const day = (x.getDay() + 6) % 7; // Monday=0
  x.setDate(x.getDate() - day);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function inRange(e: Expense, from: Date, to: Date) {
  const t = new Date(e.date).getTime();
  return t >= from.getTime() && t <= to.getTime();
}

export function sum(list: Expense[]) {
  return list.reduce((a, b) => a + b.amount, 0);
}

export function groupBy<T, K extends string>(list: T[], key: (x: T) => K) {
  const out = new Map<K, T[]>();
  for (const item of list) {
    const k = key(item);
    if (!out.has(k)) out.set(k, []);
    out.get(k)!.push(item);
  }
  return out;
}

export function exportCSV(expenses: Expense[]) {
  const headers = [
    "date","time","amount","currency","category","paymentMethod","status","recurrence","vendor","location","description","notes","tags",
  ];
  const rows = expenses.map((e) =>
    [e.date, e.time, e.amount, e.currency, e.category, e.paymentMethod, e.status, e.recurrence, e.vendor ?? "", e.location ?? "", e.description ?? "", e.notes ?? "", e.tags.join("|")]
      .map((v) => {
        const s = String(v).replace(/"/g, '""');
        return /[",\n]/.test(s) ? `"${s}"` : s;
      })
      .join(","),
  );
  const csv = [headers.join(","), ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `expenses-${Date.now()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
