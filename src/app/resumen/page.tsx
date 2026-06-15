'use client';

import { useState, useMemo } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import {
  useUserExpenses,
  useUserIncome,
  useUserInstallments,
  useUserExpenseCategories,
} from '@/lib/context';
import {
  formatCurrency,
  getMonthlyExpenses,
  getMonthlyIncome,
  getTotalExpenses,
  getTotalIncome,
  getExpensesByCategory,
  getMonthlyInstallments,
  getLast6Months,
} from '@/lib/utils';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line, AreaChart, Area,
} from 'recharts';

export default function ResumenPage() {
  const expenses = useUserExpenses();
  const income = useUserIncome();
  const installments = useUserInstallments();
  const categories = useUserExpenseCategories();

  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  const [year, month] = selectedMonth.split('-').map(Number);

  const monthlyExpenses = useMemo(() => getMonthlyExpenses(expenses, year, month), [expenses, year, month]);
  const monthlyIncome = useMemo(() => getMonthlyIncome(income, year, month), [income, year, month]);
  const totalExpenses = getTotalExpenses(monthlyExpenses);
  const totalIncome = getTotalIncome(monthlyIncome);
  const totalInstallments = getMonthlyInstallments(installments, year, month);
  const balance = totalIncome - totalExpenses - totalInstallments;

  const catMap = Object.fromEntries(categories.map(c => [c.id, c]));

  // Category breakdown for pie
  const categoryData = useMemo(() => {
    const byCategory = getExpensesByCategory(monthlyExpenses);
    return Object.entries(byCategory)
      .map(([id, amount]) => ({
        name: catMap[id]?.name ?? 'Otro',
        value: amount,
        color: catMap[id]?.color ?? '#6366f1',
        icon: catMap[id]?.icon ?? '📦',
      }))
      .sort((a, b) => b.value - a.value);
  }, [monthlyExpenses, catMap]);

  // 6-month trend
  const trendData = useMemo(() => {
    return getLast6Months().map(({ year: y, month: m, label }) => {
      const monthExp = getMonthlyExpenses(expenses, y, m);
      const monthInc = getMonthlyIncome(income, y, m);
      const monthInst = getMonthlyInstallments(installments, y, m);
      const totalExp = getTotalExpenses(monthExp) + monthInst;
      const totalInc = getTotalIncome(monthInc);
      return {
        month: label,
        gastos: totalExp,
        ingresos: totalInc,
        balance: totalInc - totalExp,
      };
    });
  }, [expenses, income, installments]);

  // Daily expenses for the selected month
  const dailyData = useMemo(() => {
    const dailyMap: Record<string, number> = {};
    monthlyExpenses.forEach(e => {
      const day = e.date.split('T')[0].split('-')[2];
      dailyMap[day] = (dailyMap[day] || 0) + e.amount;
    });
    return Object.entries(dailyMap)
      .map(([day, amount]) => ({ day: `${day}`, amount }))
      .sort((a, b) => parseInt(a.day) - parseInt(b.day));
  }, [monthlyExpenses]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="p-3 rounded-xl border border-white/10 text-xs" style={{ background: '#12141a' }}>
          <p className="text-slate-400 mb-1">{label}</p>
          {payload.map((p: any) => (
            <p key={p.name} style={{ color: p.color }}>{p.name}: {formatCurrency(p.value)}</p>
          ))}
        </div>
      );
    }
    return null;
  };

  const PieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="p-3 rounded-xl border border-white/10 text-xs" style={{ background: '#12141a' }}>
          <p className="text-white font-medium">{payload[0].name}</p>
          <p style={{ color: payload[0].payload.color }}>{formatCurrency(payload[0].value)}</p>
          <p className="text-slate-500">{((payload[0].value / totalExpenses) * 100).toFixed(1)}%</p>
        </div>
      );
    }
    return null;
  };

  return (
    <AppLayout>
      <div className="flex items-start justify-between mb-6 fade-in">
        <div>
          <h1 className="text-2xl font-bold text-white">Resumen Mensual</h1>
          <p className="text-slate-500 text-sm mt-0.5">Análisis detallado de tus finanzas</p>
        </div>
        <input
          type="month"
          className="input-field w-auto"
          value={selectedMonth}
          onChange={e => setSelectedMonth(e.target.value)}
        />
      </div>

      {/* Month KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Ingresos', value: totalIncome, color: '#22c55e', icon: '💰' },
          { label: 'Gastos', value: totalExpenses, color: '#ef4444', icon: '📤' },
          { label: 'Cuotas', value: totalInstallments, color: '#f59e0b', icon: '💳' },
          { label: 'Balance', value: balance, color: balance >= 0 ? '#22c55e' : '#ef4444', icon: '⚖️' },
        ].map(({ label, value, color, icon }) => (
          <div key={label} className="glass-card p-4 text-center">
            <p className="text-2xl mb-1">{icon}</p>
            <p className="text-xl font-bold" style={{ color }}>{formatCurrency(value)}</p>
            <p className="text-xs text-slate-500 mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Charts grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Category Pie */}
        <div className="glass-card p-5">
          <h2 className="text-sm font-semibold text-white mb-4">Gastos por Categoría</h2>
          {categoryData.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-slate-500 text-sm">Sin gastos este mes</div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {categoryData.map((entry, idx) => (
                      <Cell key={idx} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<PieTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-3 space-y-2">
                {categoryData.map((cat, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: cat.color }} />
                    <span className="text-xs text-slate-400 flex-1">{cat.icon} {cat.name}</span>
                    <span className="text-xs font-semibold text-white">{formatCurrency(cat.value)}</span>
                    <span className="text-[11px] text-slate-500 w-10 text-right">
                      {totalExpenses > 0 ? ((cat.value / totalExpenses) * 100).toFixed(0) : 0}%
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Daily expenses bar */}
        <div className="glass-card p-5">
          <h2 className="text-sm font-semibold text-white mb-4">Gastos Diarios</h2>
          {dailyData.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-slate-500 text-sm">Sin gastos este mes</div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={dailyData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" vertical={false} />
                <XAxis dataKey="day" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false}
                  tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="amount" name="Gastos" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* 6-month trend */}
      <div className="glass-card p-5 mb-6">
        <h2 className="text-sm font-semibold text-white mb-4">Tendencia 6 Meses</h2>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={trendData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="gradIngresos" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradGastos" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
            <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false}
              tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="ingresos" name="Ingresos" stroke="#22c55e" strokeWidth={2} fill="url(#gradIngresos)" />
            <Area type="monotone" dataKey="gastos" name="Gastos" stroke="#ef4444" strokeWidth={2} fill="url(#gradGastos)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Balance trend */}
      <div className="glass-card p-5">
        <h2 className="text-sm font-semibold text-white mb-4">Balance Neto Mensual</h2>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={trendData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" vertical={false} />
            <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false}
              tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
            <Tooltip content={<CustomTooltip />} />
            <Bar
              dataKey="balance"
              name="Balance"
              radius={[4, 4, 0, 0]}
              fill="#6366f1"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </AppLayout>
  );
}
