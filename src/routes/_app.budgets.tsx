import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useExpenseStore, actions } from "@/lib/expense-store";
import { formatMoney } from "@/lib/currency";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Wallet, AlertTriangle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/budgets")({
  component: BudgetsPage,
});

function BudgetsPage() {
  const { expenses, settings } = useExpenseStore();
  const [value, setValue] = useState(settings.budget.monthly.toString());

  useEffect(() => {
    setValue(settings.budget.monthly.toString());
  }, [settings.budget.monthly]);

  const today = new Date();
  const monthStartTime = new Date(today.getFullYear(), today.getMonth(), 1).getTime();

  const spent = useMemo(() => {
    return expenses
      .filter((e) => new Date(e.date).getTime() >= monthStartTime && e.status !== "Cancelled")
      .reduce((a, b) => a + b.amount, 0);
  }, [expenses, monthStartTime]);

  const budget = settings.budget.monthly;
  const pct = Math.min(100, (spent / Math.max(1, budget)) * 100);
  const remaining = Math.max(0, budget - spent);
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const daysPassed = today.getDate();
  const dailyBudget = budget / daysInMonth;
  const idealSpent = dailyBudget * daysPassed;
  const onTrack = spent <= idealSpent;

  const save = async () => {
    const v = parseFloat(value);
    if (!v || v <= 0) return toast.error("Enter a valid budget");
    await actions.setBudget(v);
    toast.success("Budget updated");
  };

  const resetBudget = async () => {
    await actions.setBudget(0);
    toast.success("Budget reset to 0");
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2 overflow-hidden border-none shadow-elegant">
          <div className="relative bg-gradient-brand p-8 text-white">
            <Wallet className="h-6 w-6 opacity-80" />
            <p className="mt-4 text-sm opacity-90">Monthly budget</p>
            <p className="mt-1 font-display text-5xl tracking-tight">
              {formatMoney(budget, settings.currency)}
            </p>
            <div className="mt-6 space-y-2">
              <div className="flex items-center justify-between text-sm opacity-90">
                <span>Spent {formatMoney(spent, settings.currency)}</span>
                <span>{pct.toFixed(0)}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-white/20">
                <div className="h-full bg-white transition-all" style={{ width: `${pct}%` }} />
              </div>
              <p className="text-sm opacity-90">
                {formatMoney(remaining, settings.currency)} remaining
              </p>
            </div>
          </div>
          <CardContent className="grid gap-4 p-6 sm:grid-cols-3">
            <MetricLine label="Daily budget" value={formatMoney(dailyBudget, settings.currency)} />
            <MetricLine
              label="Ideal spent"
              value={formatMoney(idealSpent, settings.currency)}
              sub={`by day ${daysPassed}`}
            />
            <MetricLine
              label="Status"
              value={onTrack ? "On track" : "Over pace"}
              accent={onTrack ? "success" : "warning"}
            />
          </CardContent>
        </Card>

        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle>Set your budget</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <label className="text-xs text-muted-foreground">Monthly amount</label>
              <Input type="number" value={value} onChange={(e) => setValue(e.target.value)} />
            </div>
            <Button className="w-full bg-gradient-brand text-white hover:opacity-90" onClick={save}>
              Save budget
            </Button>
            <Button
              className="w-full"
              variant="outline"
              onClick={resetBudget}
              disabled={budget === 0}
            >
              Reset budget to 0
            </Button>
            <div className="rounded-xl bg-accent/50 p-3 text-xs text-muted-foreground">
              Set a realistic monthly cap. We'll alert you at 80%, 90% and 100% of usage.
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <ThresholdCard
          label="80% warning"
          reached={pct >= 80}
          value={formatMoney(budget * 0.8, settings.currency)}
        />
        <ThresholdCard
          label="90% critical"
          reached={pct >= 90}
          value={formatMoney(budget * 0.9, settings.currency)}
        />
        <ThresholdCard
          label="100% exceeded"
          reached={pct >= 100}
          value={formatMoney(budget, settings.currency)}
        />
      </div>
    </div>
  );
}

function MetricLine({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: "success" | "warning";
}) {
  const color = accent === "success" ? "text-success" : accent === "warning" ? "text-warning" : "";
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`mt-1 text-lg font-semibold ${color}`}>{value}</p>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}

function ThresholdCard({
  label,
  reached,
  value,
}: {
  label: string;
  reached: boolean;
  value: string;
}) {
  return (
    <Card className={`shadow-soft ${reached ? "border-warning/50 bg-warning/5" : ""}`}>
      <CardContent className="flex items-center gap-3 p-4">
        <div
          className={`grid h-10 w-10 place-items-center rounded-xl ${reached ? "bg-warning/20 text-warning" : "bg-accent text-muted-foreground"}`}
        >
          {reached ? <AlertTriangle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">{label}</p>
          <p className="text-xs text-muted-foreground">Trigger at {value}</p>
        </div>
        {reached && <Badge className="bg-warning text-warning-foreground">Reached</Badge>}
      </CardContent>
    </Card>
  );
}
