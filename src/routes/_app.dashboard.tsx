import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { useExpenseStore } from "@/lib/expense-store";
import { formatMoney } from "@/lib/currency";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  ArrowDownRight,
  ArrowUpRight,
  Wallet,
  TrendingUp,
  Calendar,
  Sparkles,
  ReceiptText,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/dashboard")({
  component: Dashboard,
});

function Dashboard() {
  const { expenses, settings } = useExpenseStore();
  const c = settings.currency;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 6);
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const yearStart = new Date(today.getFullYear(), 0, 1);
  const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);

  const stats = useMemo(() => {
    const byDay = new Map<string, number>();
    let todayS = 0, yestS = 0, weekS = 0, monthS = 0, yearS = 0, total = 0, lastMonth = 0;
    const catMap = new Map<string, number>();
    for (const e of expenses) {
      if (e.status === "Cancelled") continue;
      const d = new Date(e.date);
      byDay.set(e.date, (byDay.get(e.date) ?? 0) + e.amount);
      total += e.amount;
      if (d >= today && d.toDateString() === today.toDateString()) todayS += e.amount;
      if (d.toDateString() === yesterday.toDateString()) yestS += e.amount;
      if (d >= weekAgo) weekS += e.amount;
      if (d >= monthStart) monthS += e.amount;
      if (d >= yearStart) yearS += e.amount;
      if (d >= lastMonthStart && d <= lastMonthEnd) lastMonth += e.amount;
      catMap.set(e.category, (catMap.get(e.category) ?? 0) + e.amount);
    }
    const daysInMonth = today.getDate();
    const avgDaily = monthS / Math.max(1, daysInMonth);
    const topCat = [...catMap.entries()].sort((a, b) => b[1] - a[1])[0];
    const monthDeltaPct = lastMonth > 0 ? ((monthS - lastMonth) / lastMonth) * 100 : 0;
    return { todayS, yestS, weekS, monthS, yearS, total, avgDaily, topCat, byDay, catMap, monthDeltaPct, lastMonth };
  }, [expenses]);

  const budget = settings.budget.monthly;
  const budgetPct = Math.min(100, (stats.monthS / Math.max(1, budget)) * 100);

  const last30 = useMemo(() => {
    const arr: { date: string; label: string; amount: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      arr.push({ date: key, label: `${d.getMonth() + 1}/${d.getDate()}`, amount: stats.byDay.get(key) ?? 0 });
    }
    return arr;
  }, [stats.byDay]);

  const topCategories = useMemo(() => {
    return [...stats.catMap.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([name, value]) => ({ name, value }));
  }, [stats.catMap]);

  const CHART_COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)", "var(--primary)"];

  const recent = expenses.slice(0, 6);

  return (
    <div className="space-y-6">
      {/* Hero + budget */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="glass overflow-hidden border-none shadow-elegant lg:col-span-2">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-brand opacity-90" />
            <div className="absolute inset-0 opacity-30" style={{ background: "radial-gradient(circle at 20% 20%, white, transparent 40%)" }} />
            <div className="relative p-6 text-white sm:p-8">
              <div className="flex items-center gap-2 text-sm opacity-90">
                <Sparkles className="h-4 w-4" /> This month
              </div>
              <p className="mt-4 font-display text-5xl leading-none tracking-tight sm:text-6xl">
                {formatMoney(stats.monthS, c)}
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
                <span className="opacity-80">vs last month {formatMoney(stats.lastMonth, c)}</span>
                <Badge className="border-none bg-white/20 text-white backdrop-blur">
                  {stats.monthDeltaPct >= 0 ? <ArrowUpRight className="mr-1 h-3 w-3" /> : <ArrowDownRight className="mr-1 h-3 w-3" />}
                  {Math.abs(stats.monthDeltaPct).toFixed(1)}%
                </Badge>
              </div>
              <div className="mt-8 grid grid-cols-3 gap-4 border-t border-white/20 pt-5">
                <MiniStat label="Today" value={formatMoney(stats.todayS, c)} />
                <MiniStat label="Yesterday" value={formatMoney(stats.yestS, c)} />
                <MiniStat label="This week" value={formatMoney(stats.weekS, c)} />
              </div>
            </div>
          </div>
        </Card>

        <Card className="shadow-soft">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">Monthly budget</CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="font-display text-4xl tracking-tight">{formatMoney(Math.max(0, budget - stats.monthS), c)}</p>
              <p className="mt-1 text-xs text-muted-foreground">remaining of {formatMoney(budget, c)}</p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Used</span>
                <span className="font-medium">{budgetPct.toFixed(0)}%</span>
              </div>
              <Progress value={budgetPct} className="h-2" />
              {budgetPct >= 100 && <Badge variant="destructive">Budget exceeded</Badge>}
              {budgetPct >= 80 && budgetPct < 100 && <Badge className="bg-warning text-warning-foreground">Approaching limit</Badge>}
            </div>
            <div className="grid grid-cols-2 gap-3 border-t pt-4 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Avg / day</p>
                <p className="font-semibold">{formatMoney(stats.avgDaily, c)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Top category</p>
                <p className="truncate font-semibold">{stats.topCat?.[0] ?? "—"}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* KPI cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={<Calendar className="h-4 w-4" />} label="This year" value={formatMoney(stats.yearS, c)} sub="Year to date" />
        <StatCard icon={<TrendingUp className="h-4 w-4" />} label="Total tracked" value={formatMoney(stats.total, c)} sub={`${expenses.length} transactions`} />
        <StatCard icon={<ReceiptText className="h-4 w-4" />} label="Avg / transaction" value={formatMoney(expenses.length ? stats.total / expenses.length : 0, c)} sub="All time" />
        <StatCard icon={<Sparkles className="h-4 w-4" />} label="Highest category" value={stats.topCat?.[0] ?? "—"} sub={stats.topCat ? formatMoney(stats.topCat[1], c) : ""} />
      </div>

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2 shadow-soft">
          <CardHeader>
            <CardTitle>Spending — last 30 days</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72 w-full">
              <ResponsiveContainer>
                <AreaChart data={last30} margin={{ top: 10, right: 8, left: -12, bottom: 0 }}>
                  <defs>
                    <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="label" fontSize={11} stroke="var(--muted-foreground)" tickLine={false} axisLine={false} />
                  <YAxis fontSize={11} stroke="var(--muted-foreground)" tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{
                      background: "var(--popover)",
                      border: "1px solid var(--border)",
                      borderRadius: 12,
                      fontSize: 12,
                    }}
                    formatter={(v: number) => formatMoney(v, c)}
                  />
                  <Area type="monotone" dataKey="amount" stroke="var(--primary)" strokeWidth={2} fill="url(#g)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle>Top categories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72 w-full">
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={topCategories} dataKey="value" nameKey="name" innerRadius={50} outerRadius={90} paddingAngle={2}>
                    {topCategories.map((_, i) => (<Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />))}
                  </Pie>
                  <Tooltip formatter={(v: number) => formatMoney(v, c)} contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 12, fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-1.5">
              {topCategories.slice(0, 4).map((cat, i) => (
                <div key={cat.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
                    <span className="text-muted-foreground">{cat.name}</span>
                  </div>
                  <span className="font-medium">{formatMoney(cat.value, c)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Weekly + Recent */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-1 shadow-soft">
          <CardHeader>
            <CardTitle>Weekly comparison</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-56 w-full">
              <ResponsiveContainer>
                <BarChart data={weeklyBars(last30)} margin={{ top: 8, right: 4, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="week" fontSize={11} stroke="var(--muted-foreground)" tickLine={false} axisLine={false} />
                  <YAxis fontSize={11} stroke="var(--muted-foreground)" tickLine={false} axisLine={false} />
                  <Tooltip formatter={(v: number) => formatMoney(v, c)} contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 12, fontSize: 12 }} />
                  <Bar dataKey="amount" fill="var(--primary)" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 shadow-soft">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent transactions</CardTitle>
            <Link to="/expenses" className="text-xs font-medium text-primary hover:underline">View all →</Link>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {recent.length === 0 && (
                <div className="p-8 text-center text-sm text-muted-foreground">No transactions yet — add your first expense.</div>
              )}
              {recent.map((e) => (
                <div key={e.id} className="flex items-center gap-3 px-6 py-3.5">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent text-accent-foreground">
                    <ReceiptText className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{e.description || e.category}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {e.category} · {e.paymentMethod} · {e.date}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold tabular-nums">-{formatMoney(e.amount, e.currency)}</p>
                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{e.status}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function weeklyBars(days: { date: string; amount: number }[]) {
  const weeks: { week: string; amount: number }[] = [];
  for (let i = 0; i < days.length; i += 7) {
    const chunk = days.slice(i, i + 7);
    weeks.push({ week: `W${Math.floor(i / 7) + 1}`, amount: chunk.reduce((a, b) => a + b.amount, 0) });
  }
  return weeks;
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs opacity-80">{label}</p>
      <p className="mt-1 text-lg font-semibold tabular-nums">{value}</p>
    </div>
  );
}

function StatCard({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub?: string }) {
  return (
    <Card className="shadow-soft transition-all hover:shadow-elegant">
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground">{label}</span>
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-accent text-accent-foreground">{icon}</span>
        </div>
        <p className="mt-3 truncate font-display text-3xl tracking-tight">{value}</p>
        {sub && <p className="mt-1 truncate text-xs text-muted-foreground">{sub}</p>}
      </CardContent>
    </Card>
  );
}
