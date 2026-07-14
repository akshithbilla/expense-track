import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useExpenseStore } from "@/lib/expense-store";
import { formatMoney } from "@/lib/currency";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_app/calendar")({
  component: CalendarPage,
});

function CalendarPage() {
  const { expenses, settings } = useExpenseStore();
  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d;
  });
  const [selected, setSelected] = useState<string | null>(null);

  const byDate = useMemo(() => {
    const m = new Map<string, number>();
    for (const e of expenses) {
      if (e.status === "Cancelled") continue;
      m.set(e.date, (m.get(e.date) ?? 0) + e.amount);
    }
    return m;
  }, [expenses]);

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const firstDay = new Date(year, month, 1);
  const startWeekday = (firstDay.getDay() + 6) % 7; // Mon=0
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (Date | null)[] = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
  while (cells.length % 7 !== 0) cells.push(null);

  const monthTotal = useMemo(() => {
    let t = 0;
    for (const [k, v] of byDate) if (k.startsWith(`${year}-${String(month + 1).padStart(2, "0")}`)) t += v;
    return t;
  }, [byDate, year, month]);

  const max = Math.max(1, ...[...byDate.values()]);
  const monthName = cursor.toLocaleDateString(undefined, { month: "long", year: "numeric" });

  const selectedList = selected ? expenses.filter((e) => e.date === selected) : [];

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
      <Card className="shadow-soft">
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="text-lg">{monthName}</CardTitle>
            <p className="mt-1 text-xs text-muted-foreground">Total: {formatMoney(monthTotal, settings.currency)}</p>
          </div>
          <div className="flex gap-1">
            <Button variant="outline" size="icon" onClick={() => setCursor(new Date(year, month - 1, 1))}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={() => setCursor(new Date(year, month + 1, 1))}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-1.5 text-center text-[11px] font-medium text-muted-foreground">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (<div key={d} className="py-1">{d}</div>))}
          </div>
          <div className="mt-1 grid grid-cols-7 gap-1.5">
            {cells.map((d, i) => {
              if (!d) return <div key={i} className="aspect-square" />;
              const key = d.toISOString().slice(0, 10);
              const amt = byDate.get(key) ?? 0;
              const intensity = amt / max;
              const isSel = selected === key;
              const isToday = key === new Date().toISOString().slice(0, 10);
              return (
                <button
                  key={i}
                  onClick={() => setSelected(key)}
                  className={`group relative aspect-square rounded-xl border p-2 text-left transition-all hover:border-primary/60 hover:shadow-soft ${
                    isSel ? "border-primary shadow-elegant" : "border-border"
                  } ${isToday ? "ring-1 ring-primary/40" : ""}`}
                  style={amt > 0 ? { background: `color-mix(in oklch, var(--primary) ${intensity * 40}%, transparent)` } : {}}
                >
                  <span className={`text-xs font-medium ${isToday ? "text-primary" : ""}`}>{d.getDate()}</span>
                  {amt > 0 && (
                    <span className="absolute bottom-1.5 left-2 right-2 truncate text-[10px] font-semibold tabular-nums">
                      {formatMoney(amt, settings.currency, true)}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle className="text-base">{selected ?? "Select a day"}</CardTitle>
        </CardHeader>
        <CardContent>
          {!selected && <p className="text-sm text-muted-foreground">Tap a date to see expenses.</p>}
          {selected && selectedList.length === 0 && <p className="text-sm text-muted-foreground">No expenses on this day.</p>}
          <div className="space-y-2">
            {selectedList.map((e) => (
              <div key={e.id} className="flex items-center gap-3 rounded-xl border p-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{e.description || e.category}</p>
                  <p className="text-xs text-muted-foreground">{e.paymentMethod} · {e.time}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold tabular-nums">{formatMoney(e.amount, e.currency)}</p>
                  <Badge variant="secondary" className="text-[10px] font-normal">{e.category}</Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
