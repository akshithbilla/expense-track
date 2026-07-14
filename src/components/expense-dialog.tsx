import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CATEGORIES, PAYMENT_METHODS, STATUSES, RECURRENCE, type Expense } from "@/lib/expense-types";
import { actions, useExpenseStore } from "@/lib/expense-store";
import { Plus } from "lucide-react";
import { toast } from "sonner";

interface Props {
  trigger?: React.ReactNode;
  expense?: Expense;
  open?: boolean;
  onOpenChange?: (v: boolean) => void;
}

export function ExpenseDialog({ trigger, expense, open, onOpenChange }: Props) {
  const { settings } = useExpenseStore();
  const [internal, setInternal] = useState(false);
  const isOpen = open ?? internal;
  const setOpen = onOpenChange ?? setInternal;

  const today = new Date().toISOString().slice(0, 10);
  const now = new Date().toTimeString().slice(0, 5);

  const [form, setForm] = useState(() => ({
    date: expense?.date ?? today,
    time: expense?.time ?? now,
    amount: expense?.amount?.toString() ?? "",
    category: expense?.category ?? "Food",
    paymentMethod: expense?.paymentMethod ?? "UPI",
    description: expense?.description ?? "",
    vendor: expense?.vendor ?? "",
    location: expense?.location ?? "",
    notes: expense?.notes ?? "",
    tags: expense?.tags?.join(", ") ?? "",
    status: expense?.status ?? "Paid",
    recurrence: expense?.recurrence ?? "None",
    currency: expense?.currency ?? settings.currency,
  }));

  useEffect(() => {
    if (expense) {
      setForm({
        date: expense.date,
        time: expense.time,
        amount: expense.amount.toString(),
        category: expense.category,
        paymentMethod: expense.paymentMethod,
        description: expense.description,
        vendor: expense.vendor ?? "",
        location: expense.location ?? "",
        notes: expense.notes ?? "",
        tags: expense.tags.join(", "),
        status: expense.status,
        recurrence: expense.recurrence,
        currency: expense.currency,
      });
    }
  }, [expense]);

  const submit = async () => {
    const amt = parseFloat(form.amount);
    if (!amt || amt <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    const payload = {
      date: form.date,
      time: form.time,
      amount: amt,
      category: form.category as Expense["category"],
      paymentMethod: form.paymentMethod as Expense["paymentMethod"],
      description: form.description,
      vendor: form.vendor,
      location: form.location,
      notes: form.notes,
      tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
      currency: form.currency,
      status: form.status as Expense["status"],
      recurrence: form.recurrence as Expense["recurrence"],
    };
    if (expense) {
      await actions.updateExpense(expense.id, payload);
      toast.success("Expense updated");
    } else {
      await actions.addExpense(payload);
      toast.success("Expense added");
    }
    setOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      {!trigger && !open && (
        <DialogTrigger asChild>
          <Button className="bg-gradient-brand text-white shadow-elegant hover:opacity-90">
            <Plus className="mr-1.5 h-4 w-4" /> Add expense
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl">{expense ? "Edit expense" : "New expense"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Amount">
              <Input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                autoFocus
              />
            </Field>
            <Field label="Category">
              <SelectField value={form.category} onChange={(v) => setForm({ ...form, category: v })} options={CATEGORIES} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Date">
              <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
            </Field>
            <Field label="Time">
              <Input type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Payment method">
              <SelectField value={form.paymentMethod} onChange={(v) => setForm({ ...form, paymentMethod: v })} options={PAYMENT_METHODS} />
            </Field>
            <Field label="Status">
              <SelectField value={form.status} onChange={(v) => setForm({ ...form, status: v })} options={STATUSES} />
            </Field>
          </div>
          <Field label="Description">
            <Input placeholder="What was this for?" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Vendor">
              <Input placeholder="Amazon, Uber…" value={form.vendor} onChange={(e) => setForm({ ...form, vendor: e.target.value })} />
            </Field>
            <Field label="Location">
              <Input placeholder="City" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Recurrence">
              <SelectField value={form.recurrence} onChange={(v) => setForm({ ...form, recurrence: v })} options={RECURRENCE} />
            </Field>
            <Field label="Tags">
              <Input placeholder="work, trip" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} />
            </Field>
          </div>
          <Field label="Notes">
            <Textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </Field>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
          <Button className="bg-gradient-brand text-white hover:opacity-90" onClick={submit}>
            {expense ? "Save changes" : "Add expense"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1.5">
      <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

function SelectField({ value, onChange, options }: { value: string; onChange: (v: any) => void; options: readonly string[] }) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger><SelectValue /></SelectTrigger>
      <SelectContent>
        {options.map((o) => (<SelectItem key={o} value={o}>{o}</SelectItem>))}
      </SelectContent>
    </Select>
  );
}
