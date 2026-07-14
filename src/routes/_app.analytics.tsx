import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { useExpenseStore } from "@/lib/expense-store";
import { formatMoney } from "@/lib/currency";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ONLINE_METHODS } from "@/lib/expense-types";
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart,
  Pie, PieChart, PolarAngleAxis, PolarGrid, Radar, RadarChart, ResponsiveContainer,
  Tooltip, XAxis, YAxis,
} from "recharts";

export const Route = createFileRoute("/_app/analytics")({
  component: AnalyticsPage,
});

const COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)", "var(--primary)"];

function AnalyticsPage() {
  const { expenses, settings } = useExpenseStore();
  const c = settings.currency;

  const data = useMemo(() => {
    const byDay = new Map<string, number>();
    const byMonth = new Map<string, number>();
    const byCat = new Map<string, number>();
    const byMethod = new Map<string, number>();
    let cash = 0, online = 0;
    for (const e of expenses) {
      if (e.status === "Cancelled") continue;
      byDay.set(e.date, (byDay.get(e.date) ?? 0) + e.amount);
      const m = e.date.slice(0, 7);
      byMonth.set(m, (byMonth.get(m) ?? 0) + e.amount);
      byCat.set(e.category, (byCat.get(e.category) ?? 0) + e.amount);
      byMethod.set(e.paymentMethod, (byMethod.get(e.paymentMethod) ?? 0) + e.amount);
      if (ONLINE_METHODS.includes(e.paymentMethod)) online += e.amount;
      else if (e.paymentMethod === "Cash") cash += e.amount;
    }
    const today = new Date();
    const daily: { label: string; amount: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      daily.push({ label: `${d.getMonth() + 1}/${d.getDate()}`, amount: byDay.get(key) ?? 0 });
    }
    const monthly = [...byMonth.entries()].sort().slice(-6).map(([k, v]) => ({ label: k.slice(5), amount: v }));
    const catArr = [...byCat.entries()].sort((a, b) => b[1] - a[1]).map(([name, value]) => ({ name, value }));
    const methods = [...byMethod.entries()].map(([name, value]) => ({ name, value }));
    return { daily, monthly, catArr, methods, cash, online };
  }, [expenses]);

  const radar = data.catArr.slice(0, 6).map((x) => ({ category: x.name, value: x.value }));
  const cashOnline = [{ name: "Payments", Cash: data.cash, Online: data.online }];

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Daily expense trend">
          <ResponsiveContainer>
            <AreaChart data={data.daily} margin={{ top: 10, right: 8, left: -12, bottom: 0 }}>
              <defs>
                <linearGradient id="a" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="label" fontSize={11} stroke="var(--muted-foreground)" tickLine={false} axisLine={false} />
              <YAxis fontSize={11} stroke="var(--muted-foreground)" tickLine={false} axisLine={false} />
              <Tooltip formatter={(v: number) => formatMoney(v, c)} contentStyle={tt} />
              <Area type="monotone" dataKey="amount" stroke="var(--primary)" strokeWidth={2} fill="url(#a)" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Monthly comparison">
          <ResponsiveContainer>
            <BarChart data={data.monthly} margin={{ top: 10, right: 8, left: -12, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="label" fontSize={11} stroke="var(--muted-foreground)" tickLine={false} axisLine={false} />
              <YAxis fontSize={11} stroke="var(--muted-foreground)" tickLine={false} axisLine={false} />
              <Tooltip formatter={(v: number) => formatMoney(v, c)} contentStyle={tt} />
              <Bar dataKey="amount" fill="var(--chart-2)" radius={[10, 10, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <ChartCard title="Expense distribution" className="lg:col-span-1">
          <ResponsiveContainer>
            <PieChart>
              <Pie data={data.catArr.slice(0, 8)} dataKey="value" nameKey="name" outerRadius={100} paddingAngle={2}>
                {data.catArr.slice(0, 8).map((_, i) => (<Cell key={i} fill={COLORS[i % COLORS.length]} />))}
              </Pie>
              <Tooltip formatter={(v: number) => formatMoney(v, c)} contentStyle={tt} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Top categories" className="lg:col-span-2">
          <ResponsiveContainer>
            <BarChart data={data.catArr.slice(0, 8)} layout="vertical" margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
              <XAxis type="number" fontSize={11} stroke="var(--muted-foreground)" tickLine={false} axisLine={false} />
              <YAxis dataKey="name" type="category" fontSize={11} width={90} stroke="var(--muted-foreground)" tickLine={false} axisLine={false} />
              <Tooltip formatter={(v: number) => formatMoney(v, c)} contentStyle={tt} />
              <Bar dataKey="value" radius={[0, 8, 8, 0]}>
                {data.catArr.slice(0, 8).map((_, i) => (<Cell key={i} fill={COLORS[i % COLORS.length]} />))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <ChartCard title="Payment methods">
          <ResponsiveContainer>
            <PieChart>
              <Pie data={data.methods} dataKey="value" nameKey="name" innerRadius={55} outerRadius={100} paddingAngle={2}>
                {data.methods.map((_, i) => (<Cell key={i} fill={COLORS[i % COLORS.length]} />))}
              </Pie>
              <Tooltip formatter={(v: number) => formatMoney(v, c)} contentStyle={tt} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Cash vs online">
          <ResponsiveContainer>
            <BarChart data={cashOnline} margin={{ top: 10, right: 8, left: -12, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="name" fontSize={11} stroke="var(--muted-foreground)" tickLine={false} axisLine={false} />
              <YAxis fontSize={11} stroke="var(--muted-foreground)" tickLine={false} axisLine={false} />
              <Tooltip formatter={(v: number) => formatMoney(v, c)} contentStyle={tt} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="Cash" stackId="a" fill="var(--chart-4)" radius={[0, 0, 0, 0]} />
              <Bar dataKey="Online" stackId="a" fill="var(--chart-1)" radius={[10, 10, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Category radar">
          <ResponsiveContainer>
            <RadarChart data={radar}>
              <PolarGrid stroke="var(--border)" />
              <PolarAngleAxis dataKey="category" fontSize={10} stroke="var(--muted-foreground)" />
              <Radar dataKey="value" stroke="var(--primary)" fill="var(--primary)" fillOpacity={0.35} />
              <Tooltip formatter={(v: number) => formatMoney(v, c)} contentStyle={tt} />
            </RadarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <ChartCard title="Expense growth" height="h-80">
        <ResponsiveContainer>
          <LineChart data={growthSeries(data.daily)} margin={{ top: 10, right: 8, left: -12, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis dataKey="label" fontSize={11} stroke="var(--muted-foreground)" tickLine={false} axisLine={false} />
            <YAxis fontSize={11} stroke="var(--muted-foreground)" tickLine={false} axisLine={false} />
            <Tooltip formatter={(v: number) => formatMoney(v, c)} contentStyle={tt} />
            <Line type="monotone" dataKey="cum" stroke="var(--primary)" strokeWidth={2.5} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}

function growthSeries(daily: { label: string; amount: number }[]) {
  let cum = 0;
  return daily.map((d) => ({ label: d.label, cum: (cum += d.amount) }));
}

const tt = {
  background: "var(--popover)",
  border: "1px solid var(--border)",
  borderRadius: 12,
  fontSize: 12,
};

function ChartCard({ title, children, className, height = "h-64" }: { title: string; children: React.ReactNode; className?: string; height?: string }) {
  return (
    <Card className={`shadow-soft ${className ?? ""}`}>
      <CardHeader className="pb-3"><CardTitle className="text-base">{title}</CardTitle></CardHeader>
      <CardContent><div className={`${height} w-full`}>{children}</div></CardContent>
    </Card>
  );
}
