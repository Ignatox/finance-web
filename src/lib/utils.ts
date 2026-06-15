import { format, parseISO, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { es } from 'date-fns/locale';
import { Expense, Income, InstallmentPurchase, Investment } from './types';

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(dateStr: string): string {
  try {
    return format(parseISO(dateStr), 'dd MMM yyyy', { locale: es });
  } catch {
    return dateStr;
  }
}

export function formatMonth(dateStr: string): string {
  try {
    return format(parseISO(dateStr), 'MMMM yyyy', { locale: es });
  } catch {
    return dateStr;
  }
}

export function getMonthlyExpenses(expenses: Expense[], year: number, month: number): Expense[] {
  const start = startOfMonth(new Date(year, month - 1));
  const end = endOfMonth(new Date(year, month - 1));
  return expenses.filter(e => {
    try {
      const date = parseISO(e.date);
      return isWithinInterval(date, { start, end });
    } catch {
      return false;
    }
  });
}

export function getMonthlyIncome(income: Income[], year: number, month: number): Income[] {
  const start = startOfMonth(new Date(year, month - 1));
  const end = endOfMonth(new Date(year, month - 1));
  return income.filter(i => {
    try {
      const date = parseISO(i.expectedDate);
      return isWithinInterval(date, { start, end });
    } catch {
      return false;
    }
  });
}

export function getTotalExpenses(expenses: Expense[]): number {
  return expenses.reduce((sum, e) => sum + e.amount, 0);
}

export function getTotalIncome(income: Income[]): number {
  return income.filter(i => i.isReceived).reduce((sum, i) => sum + i.amount, 0);
}

export function getExpensesByCategory(expenses: Expense[]): Record<string, number> {
  return expenses.reduce((acc, e) => {
    acc[e.categoryId] = (acc[e.categoryId] || 0) + e.amount;
    return acc;
  }, {} as Record<string, number>);
}

export function getMonthlyInstallments(
  purchases: InstallmentPurchase[],
  year: number,
  month: number
): number {
  return purchases
    .filter(p => p.paidInstallments < p.totalInstallments)
    .reduce((sum, p) => {
      const start = parseISO(p.startDate);
      const purchaseMonth = start.getMonth() + 1;
      const purchaseYear = start.getFullYear();
      const monthsDiff = (year - purchaseYear) * 12 + (month - purchaseMonth);
      if (monthsDiff >= 0 && monthsDiff < p.totalInstallments) {
        return sum + p.installmentAmount;
      }
      return sum;
    }, 0);
}

export function getInvestmentReturn(investment: Investment): number {
  const final = investment.finalAmount ?? investment.currentAmount ?? investment.initialAmount;
  return final - investment.initialAmount;
}

export function getInvestmentReturnPct(investment: Investment): number {
  const ret = getInvestmentReturn(investment);
  return investment.initialAmount > 0 ? (ret / investment.initialAmount) * 100 : 0;
}

export function getLast6Months(): { year: number; month: number; label: string }[] {
  const result = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    result.push({
      year: d.getFullYear(),
      month: d.getMonth() + 1,
      label: format(d, 'MMM', { locale: es }),
    });
  }
  return result;
}

export function getTodayISO(): string {
  return new Date().toISOString().split('T')[0];
}

export function isDateToday(dateStr: string): boolean {
  return dateStr.split('T')[0] === getTodayISO();
}

export function isDateWithinDays(dateStr: string, days: number): boolean {
  const date = parseISO(dateStr);
  const today = new Date();
  const future = new Date(today);
  future.setDate(future.getDate() + days);
  return date >= today && date <= future;
}

export const INVESTMENT_TYPE_LABELS: Record<string, string> = {
  stocks: 'Acciones',
  crypto: 'Criptomonedas',
  bonds: 'Bonos',
  real_estate: 'Inmuebles',
  fixed_term: 'Plazo Fijo',
  fund: 'Fondo Común',
  other: 'Otro',
};

export const CARD_COLORS = [
  '#6366f1', '#ec4899', '#14b8a6', '#f59e0b', '#3b82f6', '#8b5cf6', '#ef4444', '#10b981',
];
