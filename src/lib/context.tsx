'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { AppData, UserId } from '@/lib/types';
import { loadData, saveData } from '@/lib/store';
import * as store from '@/lib/store';

interface AppContextType {
  data: AppData;
  activeUserId: UserId;
  setData: (data: AppData) => void;
  switchUser: (userId: UserId) => void;
  // Pass-through wrappers that auto-save
  dispatch: (fn: (data: AppData) => AppData) => void;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [data, setDataState] = useState<AppData>(() => loadData());

  // Persist on every change
  const setData = useCallback((newData: AppData) => {
    setDataState(newData);
    saveData(newData);
  }, []);

  const dispatch = useCallback((fn: (data: AppData) => AppData) => {
    setDataState(prev => {
      const next = fn(prev);
      saveData(next);
      return next;
    });
  }, []);

  const switchUser = useCallback((userId: UserId) => {
    dispatch(d => store.setActiveUser(d, userId));
  }, [dispatch]);

  // Re-load on first client render (handles SSR)
  useEffect(() => {
    setDataState(loadData());
  }, []);

  return (
    <AppContext.Provider value={{ data, activeUserId: data.activeUserId, setData, switchUser, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}

export function useActiveUser() {
  const { data } = useApp();
  return data.users.find(u => u.id === data.activeUserId) ?? data.users[0];
}

export function useUserExpenses() {
  const { data } = useApp();
  return data.expenses.filter(e => e.userId === data.activeUserId);
}

export function useUserIncome() {
  const { data } = useApp();
  return data.income.filter(i => i.userId === data.activeUserId);
}

export function useUserCards() {
  const { data } = useApp();
  return data.cards.filter(c => c.userId === data.activeUserId);
}

export function useUserInstallments() {
  const { data } = useApp();
  return data.installmentPurchases.filter(p => p.userId === data.activeUserId);
}

export function useUserSavingsGoals() {
  const { data } = useApp();
  return data.savingsGoals.filter(g => g.userId === data.activeUserId);
}

export function useUserInvestments() {
  const { data } = useApp();
  return data.investments.filter(i => i.userId === data.activeUserId);
}

export function useUserExpenseCategories() {
  const { data } = useApp();
  return data.expenseCategories.filter(c => c.userId === data.activeUserId);
}

export function useUserIncomeCategories() {
  const { data } = useApp();
  return data.incomeCategories.filter(c => c.userId === data.activeUserId);
}

export function useUserSavingsCategories() {
  const { data } = useApp();
  return data.savingsCategories.filter(c => c.userId === data.activeUserId);
}
