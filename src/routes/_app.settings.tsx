import { createFileRoute } from "@tanstack/react-router";
import { useExpenseStore, actions } from "@/lib/expense-store";
import { CURRENCIES } from "@/lib/currency";
import { exportCSV } from "@/lib/expense-utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/theme-provider";
import { Sun, Moon, Monitor, Download, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { useRef } from "react";

export const Route = createFileRoute("/_app/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const { expenses, settings } = useExpenseStore();
  const { theme, setTheme } = useTheme();
  const fileRef = useRef<HTMLInputElement>(null);

  const backup = () => {
    const blob = new Blob([JSON.stringify({ expenses, settings }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `spendly-backup-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Backup downloaded");
  };

  const restore = (file: File) => {
    file.text().then(async (txt) => {
      try {
        const data = JSON.parse(txt);
        if (Array.isArray(data.expenses)) {
          await actions.importExpenses(data.expenses);
          toast.success(`Imported ${data.expenses.length} expenses`);
        }
      } catch {
        toast.error("Invalid backup file");
      }
    });
  };

  return (
    <div className="grid max-w-3xl gap-4">
      <Card className="shadow-soft">
        <CardHeader><CardTitle>Appearance</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-2">
            {[
              { v: "light", l: "Light", i: <Sun className="h-4 w-4" /> },
              { v: "dark", l: "Dark", i: <Moon className="h-4 w-4" /> },
              { v: "system", l: "System", i: <Monitor className="h-4 w-4" /> },
            ].map((t) => (
              <button
                key={t.v}
                onClick={() => setTheme(t.v as any)}
                className={`flex flex-col items-center gap-2 rounded-xl border p-4 transition-all hover:border-primary ${theme === t.v ? "border-primary bg-accent/50 shadow-soft" : ""}`}
              >
                {t.i}
                <span className="text-sm font-medium">{t.l}</span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-soft">
        <CardHeader><CardTitle>Currency</CardTitle></CardHeader>
        <CardContent>
          <Select value={settings.currency} onValueChange={async (v) => { await actions.updateSettings({ currency: v }); toast.success("Currency updated"); }}>
            <SelectTrigger className="w-full max-w-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(CURRENCIES).map(([code, meta]) => (
                <SelectItem key={code} value={code}>{meta.symbol} {code} — {meta.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card className="shadow-soft">
        <CardHeader><CardTitle>Data</CardTitle></CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <Button variant="outline" onClick={backup}><Download className="mr-2 h-4 w-4" /> Backup JSON</Button>
          <Button variant="outline" onClick={() => exportCSV(expenses)}><Download className="mr-2 h-4 w-4" /> Export CSV</Button>
          <Button variant="outline" onClick={() => fileRef.current?.click()}>
            <Upload className="mr-2 h-4 w-4" /> Restore backup
          </Button>
          <input ref={fileRef} type="file" accept="application/json" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) restore(f); e.target.value = ""; }} />
          <Button variant="destructive" onClick={async () => { if (confirm("Delete ALL expenses? This cannot be undone.")) { await actions.clearAll(); toast.success("All expenses deleted"); } }}>
            <Trash2 className="mr-2 h-4 w-4" /> Delete all data
          </Button>
        </CardContent>
      </Card>

      <Card className="shadow-soft">
        <CardHeader><CardTitle>About</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>Spendly · Beautiful personal finance</p>
          <p>{expenses.length} expenses securely stored in your account.</p>
        </CardContent>
      </Card>
    </div>
  );
}
