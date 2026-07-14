import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useExpenseStore, actions } from "@/lib/expense-store";
import { formatMoney } from "@/lib/currency";
import { CATEGORIES, PAYMENT_METHODS } from "@/lib/expense-types";
import { exportCSV } from "@/lib/expense-utils";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Download, Trash2, Pencil, ArrowUpDown } from "lucide-react";
import { ExpenseDialog } from "@/components/expense-dialog";
import { toast } from "sonner";
import type { Expense } from "@/lib/expense-types";

export const Route = createFileRoute("/_app/expenses")({
  component: ExpensesPage,
});

const RANGES = [
  { key: "all", label: "All time" },
  { key: "7", label: "Last 7 days" },
  { key: "30", label: "Last 30 days" },
  { key: "month", label: "This month" },
  { key: "year", label: "This year" },
];

function ExpensesPage() {
  const { expenses, settings } = useExpenseStore();
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState<string>("all");
  const [pay, setPay] = useState<string>("all");
  const [range, setRange] = useState<string>("all");
  const [sortDesc, setSortDesc] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [editing, setEditing] = useState<Expense | null>(null);

  const filtered = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return expenses
      .filter((e) => {
        if (cat !== "all" && e.category !== cat) return false;
        if (pay !== "all" && e.paymentMethod !== pay) return false;
        if (range !== "all") {
          const d = new Date(e.date);
          if (range === "7" || range === "30") {
            const days = Number(range);
            const from = new Date(now);
            from.setDate(from.getDate() - (days - 1));
            if (d < from) return false;
          } else if (range === "month") {
            if (d.getMonth() !== now.getMonth() || d.getFullYear() !== now.getFullYear()) return false;
          } else if (range === "year") {
            if (d.getFullYear() !== now.getFullYear()) return false;
          }
        }
        if (query) {
          const q = query.toLowerCase();
          const hay = `${e.description} ${e.vendor} ${e.location} ${e.category} ${e.tags.join(" ")}`.toLowerCase();
          if (!hay.includes(q)) return false;
        }
        return true;
      })
      .sort((a, b) => {
        const A = `${a.date} ${a.time}`;
        const B = `${b.date} ${b.time}`;
        return sortDesc ? B.localeCompare(A) : A.localeCompare(B);
      });
  }, [expenses, query, cat, pay, range, sortDesc]);

  const total = filtered.reduce((a, b) => a + b.amount, 0);

  const toggleAll = () => {
    if (selected.size === filtered.length) setSelected(new Set());
    else setSelected(new Set(filtered.map((e) => e.id)));
  };
  const toggle = (id: string) => {
    const n = new Set(selected);
    n.has(id) ? n.delete(id) : n.add(id);
    setSelected(n);
  };
  const bulkDelete = async () => {
    await actions.deleteMany([...selected]);
    toast.success(`Deleted ${selected.size} expenses`);
    setSelected(new Set());
  };

  return (
    <div className="space-y-5">
      {/* Filter bar */}
      <Card className="p-4 shadow-soft">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-0 flex-1">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search description, vendor, tag…" value={query} onChange={(e) => setQuery(e.target.value)} className="h-9 pl-8" />
          </div>
          <FilterSelect value={range} onChange={setRange} options={[{ v: "all", l: "All time" }, ...RANGES.slice(1).map((r) => ({ v: r.key, l: r.label }))]} placeholder="Range" />
          <FilterSelect value={cat} onChange={setCat} options={[{ v: "all", l: "All categories" }, ...CATEGORIES.map((c) => ({ v: c, l: c }))]} placeholder="Category" />
          <FilterSelect value={pay} onChange={setPay} options={[{ v: "all", l: "All methods" }, ...PAYMENT_METHODS.map((c) => ({ v: c, l: c }))]} placeholder="Method" />
          <Button variant="outline" size="sm" onClick={() => exportCSV(filtered)}>
            <Download className="mr-1.5 h-4 w-4" /> Export CSV
          </Button>
        </div>
        {selected.size > 0 && (
          <div className="mt-3 flex items-center gap-3 border-t pt-3">
            <span className="text-sm">{selected.size} selected</span>
            <Button variant="destructive" size="sm" onClick={bulkDelete}>
              <Trash2 className="mr-1.5 h-4 w-4" /> Delete selected
            </Button>
            <Button variant="outline" size="sm" onClick={() => exportCSV(filtered.filter((f) => selected.has(f.id)))}>
              <Download className="mr-1.5 h-4 w-4" /> Export selected
            </Button>
          </div>
        )}
      </Card>

      {/* Summary bar */}
      <div className="flex items-center justify-between rounded-2xl border bg-card px-5 py-3 shadow-soft">
        <div>
          <p className="text-xs text-muted-foreground">Showing</p>
          <p className="text-sm font-medium">{filtered.length} transactions</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">Total</p>
          <p className="font-display text-2xl tracking-tight">{formatMoney(total, settings.currency)}</p>
        </div>
      </div>

      {/* Table */}
      <Card className="overflow-hidden shadow-soft">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left">
                  <Checkbox checked={selected.size > 0 && selected.size === filtered.length} onCheckedChange={toggleAll} />
                </th>
                <th className="px-3 py-3 text-left">
                  <button className="inline-flex items-center gap-1 hover:text-foreground" onClick={() => setSortDesc((s) => !s)}>
                    Date <ArrowUpDown className="h-3 w-3" />
                  </button>
                </th>
                <th className="px-3 py-3 text-left">Description</th>
                <th className="px-3 py-3 text-left">Category</th>
                <th className="px-3 py-3 text-left">Method</th>
                <th className="px-3 py-3 text-left">Status</th>
                <th className="px-3 py-3 text-right">Amount</th>
                <th className="px-3 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-16 text-center">
                    <p className="text-sm text-muted-foreground">No expenses match your filters.</p>
                  </td>
                </tr>
              )}
              {filtered.map((e) => (
                <tr key={e.id} className="group transition-colors hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <Checkbox checked={selected.has(e.id)} onCheckedChange={() => toggle(e.id)} />
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap">
                    <p className="font-medium">{e.date}</p>
                    <p className="text-xs text-muted-foreground">{e.time}</p>
                  </td>
                  <td className="px-3 py-3">
                    <p className="line-clamp-1 font-medium">{e.description || "—"}</p>
                    <p className="line-clamp-1 text-xs text-muted-foreground">{e.vendor || e.location || ""}</p>
                  </td>
                  <td className="px-3 py-3"><Badge variant="secondary" className="font-normal">{e.category}</Badge></td>
                  <td className="px-3 py-3 text-muted-foreground">{e.paymentMethod}</td>
                  <td className="px-3 py-3">
                    <StatusBadge status={e.status} />
                  </td>
                  <td className="px-3 py-3 text-right font-semibold tabular-nums">{formatMoney(e.amount, e.currency)}</td>
                  <td className="px-3 py-3 text-right">
                    <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button size="icon" variant="ghost" onClick={() => setEditing(e)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={async () => { await actions.deleteExpense(e.id); toast.success("Expense deleted"); }}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {editing && (
        <ExpenseDialog expense={editing} open={!!editing} onOpenChange={(v) => !v && setEditing(null)} />
      )}
    </div>
  );
}

function FilterSelect({ value, onChange, options, placeholder }: { value: string; onChange: (v: string) => void; options: { v: string; l: string }[]; placeholder?: string }) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="h-9 w-[160px] text-sm"><SelectValue placeholder={placeholder} /></SelectTrigger>
      <SelectContent>
        {options.map((o) => (<SelectItem key={o.v} value={o.v}>{o.l}</SelectItem>))}
      </SelectContent>
    </Select>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    Paid: "bg-success/15 text-success-foreground border-success/30",
    Pending: "bg-warning/15 text-warning-foreground border-warning/30",
    Cancelled: "bg-destructive/15 text-destructive border-destructive/30",
  };
  return <Badge variant="outline" className={`font-normal ${map[status] ?? ""}`}>{status}</Badge>;
}
