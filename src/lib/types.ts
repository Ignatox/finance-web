// ============================================================
// Finance App - Type Definitions
// ============================================================

export type UserId = string;

export interface User {
  id: UserId;
  name: string;
  avatar: string; // emoji or initials
  color: string; // accent color
}

// ─── Categories ─────────────────────────────────────────────

export type ExpenseCategoryId = string;

export interface ExpenseCategory {
  id: ExpenseCategoryId;
  name: string;
  icon: string; // emoji
  color: string;
  budget?: number; // optional monthly budget
  userId: UserId;
}

export const DEFAULT_CATEGORIES: Omit<ExpenseCategory, 'userId'>[] = [
  { id: 'food', name: 'Comida', icon: '🍔', color: '#f59e0b' },
  { id: 'outings', name: 'Salidas', icon: '🎉', color: '#8b5cf6' },
  { id: 'fixed', name: 'Gastos Fijos', icon: '🔒', color: '#3b82f6' },
  { id: 'clothing', name: 'Ropa', icon: '👕', color: '#ec4899' },
  { id: 'variable', name: 'Gastos Variables', icon: '📦', color: '#f97316' },
  { id: 'installments', name: 'Cuotas', icon: '💳', color: '#14b8a6' },
  { id: 'subscriptions', name: 'Suscripciones', icon: '📺', color: '#6366f1' },
  { id: 'health', name: 'Salud', icon: '🏥', color: '#10b981' },
  { id: 'transport', name: 'Transporte', icon: '🚗', color: '#64748b' },
];

// ─── Expenses ───────────────────────────────────────────────

export interface Expense {
  id: string;
  userId: UserId;
  description: string;
  amount: number;
  categoryId: ExpenseCategoryId;
  date: string; // ISO date string
  isRecurring: boolean;
  recurringDay?: number; // day of month if recurring
  notes?: string;
  createdAt: string;
}

// ─── Cards ──────────────────────────────────────────────────

export type CardType = 'credit' | 'debit';

export interface Card {
  id: string;
  userId: UserId;
  name: string;
  bank: string;
  lastFour: string;
  type: CardType;
  color: string;
  closingDay: number; // day of month billing closes
  dueDay: number;     // day of month payment is due
  creditLimit?: number;
}

// ─── Installment Purchases ──────────────────────────────────

export interface InstallmentPurchase {
  id: string;
  userId: UserId;
  description: string;
  totalAmount: number;
  installmentAmount: number;
  totalInstallments: number;
  paidInstallments: number;
  cardId: string;
  categoryId: ExpenseCategoryId;
  startDate: string; // ISO date string
  nextPaymentDate: string;
  notes?: string;
  createdAt: string;
}

// ─── Income ─────────────────────────────────────────────────

export type IncomeCategoryId = string;

export interface IncomeCategory {
  id: IncomeCategoryId;
  name: string;
  icon: string;
  color: string;
  userId: UserId;
}

export const DEFAULT_INCOME_CATEGORIES: Omit<IncomeCategory, 'userId'>[] = [
  { id: 'salary', name: 'Sueldo', icon: '💼', color: '#22c55e' },
  { id: 'freelance', name: 'Freelance', icon: '💻', color: '#06b6d4' },
  { id: 'bonus', name: 'Bonus', icon: '🎯', color: '#f59e0b' },
  { id: 'rental', name: 'Alquiler', icon: '🏠', color: '#8b5cf6' },
  { id: 'other_income', name: 'Otros', icon: '💰', color: '#64748b' },
];

export interface Income {
  id: string;
  userId: UserId;
  description: string;
  amount: number;
  categoryId: IncomeCategoryId;
  expectedDate: string; // ISO date string
  receivedDate?: string; // null until "Cobré" is clicked
  isReceived: boolean;
  isRecurring: boolean;
  recurringDay?: number;
  notes?: string;
  createdAt: string;
}

// ─── Savings ────────────────────────────────────────────────

export type SavingsCategoryId = string;

export interface SavingsCategory {
  id: SavingsCategoryId;
  name: string;
  icon: string;
  color: string;
  userId: UserId;
}

export const DEFAULT_SAVINGS_CATEGORIES: Omit<SavingsCategory, 'userId'>[] = [
  { id: 'emergency', name: 'Fondo de Emergencia', icon: '🛡️', color: '#ef4444' },
  { id: 'travel', name: 'Viajes', icon: '✈️', color: '#06b6d4' },
  { id: 'home', name: 'Casa', icon: '🏠', color: '#10b981' },
  { id: 'education', name: 'Educación', icon: '📚', color: '#8b5cf6' },
  { id: 'retirement', name: 'Retiro', icon: '🌴', color: '#f59e0b' },
  { id: 'other_savings', name: 'Otros', icon: '🏦', color: '#64748b' },
];

export interface SavingsGoal {
  id: string;
  userId: UserId;
  name: string;
  categoryId: SavingsCategoryId;
  targetAmount: number;
  currentAmount: number;
  targetDate?: string;
  notes?: string;
  createdAt: string;
}

export interface SavingsTransaction {
  id: string;
  userId: UserId;
  goalId: string;
  amount: number;
  type: 'deposit' | 'withdrawal';
  date: string;
  notes?: string;
  createdAt: string;
}

// ─── Investments ─────────────────────────────────────────────

export type InvestmentType = 'stocks' | 'crypto' | 'bonds' | 'real_estate' | 'fixed_term' | 'fund' | 'other';
export type InvestmentStatus = 'active' | 'closed';

export interface Investment {
  id: string;
  userId: UserId;
  name: string;
  type: InvestmentType;
  initialAmount: number;
  currentAmount?: number;
  finalAmount?: number; // set when closed
  startDate: string;
  endDate?: string;
  status: InvestmentStatus;
  platform?: string;
  notes?: string;
  createdAt: string;
}

// ─── App State ──────────────────────────────────────────────

export interface AppData {
  users: User[];
  activeUserId: UserId;
  expenseCategories: ExpenseCategory[];
  incomeCategories: IncomeCategory[];
  savingsCategories: SavingsCategory[];
  expenses: Expense[];
  cards: Card[];
  installmentPurchases: InstallmentPurchase[];
  income: Income[];
  savingsGoals: SavingsGoal[];
  savingsTransactions: SavingsTransaction[];
  investments: Investment[];
}
