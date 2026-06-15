'use client';

import {
  AppData,
  User,
  Expense,
  Card,
  InstallmentPurchase,
  Income,
  SavingsGoal,
  SavingsTransaction,
  Investment,
  ExpenseCategory,
  IncomeCategory,
  SavingsCategory,
  DEFAULT_CATEGORIES,
  DEFAULT_INCOME_CATEGORIES,
  DEFAULT_SAVINGS_CATEGORIES,
} from './types';

const STORAGE_KEY = 'financeapp_data';

const DEFAULT_USERS: User[] = [
  { id: 'user1', name: 'Usuario 1', avatar: '👤', color: '#6366f1' },
  { id: 'user2', name: 'Usuario 2', avatar: '👥', color: '#ec4899' },
];

function getDefaultData(): AppData {
  const users = DEFAULT_USERS;
  const expenseCategories: ExpenseCategory[] = users.flatMap(u =>
    DEFAULT_CATEGORIES.map(c => ({ ...c, userId: u.id }))
  );
  const incomeCategories: IncomeCategory[] = users.flatMap(u =>
    DEFAULT_INCOME_CATEGORIES.map(c => ({ ...c, userId: u.id }))
  );
  const savingsCategories: SavingsCategory[] = users.flatMap(u =>
    DEFAULT_SAVINGS_CATEGORIES.map(c => ({ ...c, userId: u.id }))
  );

  return {
    users,
    activeUserId: 'user1',
    expenseCategories,
    incomeCategories,
    savingsCategories,
    expenses: [],
    cards: [],
    installmentPurchases: [],
    income: [],
    savingsGoals: [],
    savingsTransactions: [],
    investments: [],
  };
}

export function loadData(): AppData {
  if (typeof window === 'undefined') return getDefaultData();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return getDefaultData();
    const parsed = JSON.parse(raw) as AppData;
    // Merge missing defaults
    if (!parsed.users || parsed.users.length === 0) parsed.users = DEFAULT_USERS;
    if (!parsed.expenseCategories) parsed.expenseCategories = [];
    if (!parsed.incomeCategories) parsed.incomeCategories = [];
    if (!parsed.savingsCategories) parsed.savingsCategories = [];
    if (!parsed.expenses) parsed.expenses = [];
    if (!parsed.cards) parsed.cards = [];
    if (!parsed.installmentPurchases) parsed.installmentPurchases = [];
    if (!parsed.income) parsed.income = [];
    if (!parsed.savingsGoals) parsed.savingsGoals = [];
    if (!parsed.savingsTransactions) parsed.savingsTransactions = [];
    if (!parsed.investments) parsed.investments = [];
    return parsed;
  } catch {
    return getDefaultData();
  }
}

export function saveData(data: AppData): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

// ─── CRUD helpers ─────────────────────────────────────────

export function generateId(): string {
  return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
}

export function addExpense(data: AppData, expense: Omit<Expense, 'id' | 'createdAt'>): AppData {
  const newExpense: Expense = { ...expense, id: generateId(), createdAt: new Date().toISOString() };
  return { ...data, expenses: [...data.expenses, newExpense] };
}

export function updateExpense(data: AppData, id: string, updates: Partial<Expense>): AppData {
  return { ...data, expenses: data.expenses.map(e => e.id === id ? { ...e, ...updates } : e) };
}

export function deleteExpense(data: AppData, id: string): AppData {
  return { ...data, expenses: data.expenses.filter(e => e.id !== id) };
}

export function addCard(data: AppData, card: Omit<Card, 'id'>): AppData {
  const newCard: Card = { ...card, id: generateId() };
  return { ...data, cards: [...data.cards, newCard] };
}

export function updateCard(data: AppData, id: string, updates: Partial<Card>): AppData {
  return { ...data, cards: data.cards.map(c => c.id === id ? { ...c, ...updates } : c) };
}

export function deleteCard(data: AppData, id: string): AppData {
  return { ...data, cards: data.cards.filter(c => c.id !== id) };
}

export function addInstallmentPurchase(data: AppData, purchase: Omit<InstallmentPurchase, 'id' | 'createdAt'>): AppData {
  const newPurchase: InstallmentPurchase = { ...purchase, id: generateId(), createdAt: new Date().toISOString() };
  return { ...data, installmentPurchases: [...data.installmentPurchases, newPurchase] };
}

export function updateInstallmentPurchase(data: AppData, id: string, updates: Partial<InstallmentPurchase>): AppData {
  return { ...data, installmentPurchases: data.installmentPurchases.map(p => p.id === id ? { ...p, ...updates } : p) };
}

export function deleteInstallmentPurchase(data: AppData, id: string): AppData {
  return { ...data, installmentPurchases: data.installmentPurchases.filter(p => p.id !== id) };
}

export function addIncome(data: AppData, income: Omit<Income, 'id' | 'createdAt'>): AppData {
  const newIncome: Income = { ...income, id: generateId(), createdAt: new Date().toISOString() };
  return { ...data, income: [...data.income, newIncome] };
}

export function updateIncome(data: AppData, id: string, updates: Partial<Income>): AppData {
  return { ...data, income: data.income.map(i => i.id === id ? { ...i, ...updates } : i) };
}

export function deleteIncome(data: AppData, id: string): AppData {
  return { ...data, income: data.income.filter(i => i.id !== id) };
}

export function markIncomeReceived(data: AppData, id: string): AppData {
  return updateIncome(data, id, { isReceived: true, receivedDate: new Date().toISOString() });
}

export function addSavingsGoal(data: AppData, goal: Omit<SavingsGoal, 'id' | 'createdAt'>): AppData {
  const newGoal: SavingsGoal = { ...goal, id: generateId(), createdAt: new Date().toISOString() };
  return { ...data, savingsGoals: [...data.savingsGoals, newGoal] };
}

export function updateSavingsGoal(data: AppData, id: string, updates: Partial<SavingsGoal>): AppData {
  return { ...data, savingsGoals: data.savingsGoals.map(g => g.id === id ? { ...g, ...updates } : g) };
}

export function deleteSavingsGoal(data: AppData, id: string): AppData {
  return { ...data, savingsGoals: data.savingsGoals.filter(g => g.id !== id) };
}

export function addSavingsTransaction(data: AppData, tx: Omit<SavingsTransaction, 'id' | 'createdAt'>): AppData {
  const newTx: SavingsTransaction = { ...tx, id: generateId(), createdAt: new Date().toISOString() };
  // Update goal currentAmount
  const delta = tx.type === 'deposit' ? tx.amount : -tx.amount;
  const updatedGoals = data.savingsGoals.map(g =>
    g.id === tx.goalId ? { ...g, currentAmount: Math.max(0, g.currentAmount + delta) } : g
  );
  return { ...data, savingsGoals: updatedGoals, savingsTransactions: [...data.savingsTransactions, newTx] };
}

export function addInvestment(data: AppData, investment: Omit<Investment, 'id' | 'createdAt'>): AppData {
  const newInvestment: Investment = { ...investment, id: generateId(), createdAt: new Date().toISOString() };
  return { ...data, investments: [...data.investments, newInvestment] };
}

export function updateInvestment(data: AppData, id: string, updates: Partial<Investment>): AppData {
  return { ...data, investments: data.investments.map(i => i.id === id ? { ...i, ...updates } : i) };
}

export function deleteInvestment(data: AppData, id: string): AppData {
  return { ...data, investments: data.investments.filter(i => i.id !== id) };
}

export function addExpenseCategory(data: AppData, cat: Omit<ExpenseCategory, 'id'>): AppData {
  const newCat: ExpenseCategory = { ...cat, id: generateId() };
  return { ...data, expenseCategories: [...data.expenseCategories, newCat] };
}

export function updateExpenseCategory(data: AppData, id: string, updates: Partial<ExpenseCategory>): AppData {
  return { ...data, expenseCategories: data.expenseCategories.map(c => c.id === id ? { ...c, ...updates } : c) };
}

export function deleteExpenseCategory(data: AppData, id: string): AppData {
  return { ...data, expenseCategories: data.expenseCategories.filter(c => c.id !== id) };
}

export function updateUser(data: AppData, id: string, updates: Partial<User>): AppData {
  return { ...data, users: data.users.map(u => u.id === id ? { ...u, ...updates } : u) };
}

export function setActiveUser(data: AppData, userId: string): AppData {
  return { ...data, activeUserId: userId };
}
