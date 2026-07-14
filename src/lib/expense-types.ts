export const CATEGORIES = [
  "Food",
  "Shopping",
  "Travel",
  "Fuel",
  "Hotel",
  "Medical",
  "Training",
  "Office",
  "Entertainment",
  "Education",
  "Recharge",
  "Subscription",
  "Bills",
  "Electricity",
  "Internet",
  "Rent",
  "Maintenance",
  "Tax",
  "Investment",
  "Insurance",
  "Clothing",
  "Electronics",
  "Groceries",
  "Coffee",
  "Snacks",
  "Gifts",
  "Personal",
  "Other",
] as const;

export type Category = (typeof CATEGORIES)[number];

export const PAYMENT_METHODS = [
  "Cash",
  "UPI",
  "Credit Card",
  "Debit Card",
  "Bank Transfer",
  "Wallet",
  "Cheque",
  "Other",
] as const;

export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const STATUSES = ["Paid", "Pending", "Cancelled"] as const;
export type Status = (typeof STATUSES)[number];

export const RECURRENCE = ["None", "Daily", "Weekly", "Monthly", "Yearly"] as const;
export type Recurrence = (typeof RECURRENCE)[number];

export interface Expense {
  id: string;
  date: string; // ISO date yyyy-mm-dd
  time: string; // HH:mm
  amount: number;
  category: Category;
  paymentMethod: PaymentMethod;
  description: string;
  vendor?: string;
  location?: string;
  notes?: string;
  tags: string[];
  currency: string;
  status: Status;
  recurrence: Recurrence;
  createdAt: number;
}

export interface Budget {
  monthly: number;
}

export interface Settings {
  currency: string;
  budget: Budget;
}

export const ONLINE_METHODS: PaymentMethod[] = [
  "UPI",
  "Credit Card",
  "Debit Card",
  "Bank Transfer",
  "Wallet",
];
