'use client';

import { useMemo } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  Calendar,
} from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import StatCard from '@/components/ui/StatCard';
import {
  useUserExpenses,
  useUserIncome,
  useUserInstallments,
  useUserCards,
  useUserSavingsGoals,
  useUserInvestments,
  useActiveUser,
} from '@/lib/context';
import {
  formatCurrency,
  formatDate,
  getMonthlyExpenses,
  getMonthlyIncome,
  getTotalExpenses,
  getTotalIncome,
  getMonthlyInstallments,
  isDateWithinDays,
  getLast6Months,
} from '@/lib/utils';
import Link from 'next/link';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

export default function DashboardPage() {
  const expenses = useUserExpenses();
  const income = useUserIncome();
  const installments = useUserInstallments();
  const cards = useUserCards();
  const savingsGoals = useUserSavingsGoals();
  const investments = useUserInvestments();
  const activeUser = useActiveUser();

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  const monthlyExpenses = useMemo(
    () => getMonthlyExpenses(expenses, currentYear, currentMonth),
    [expenses, currentYear, currentMonth]
  );
  const monthlyIncome = useMemo(
    () => getMonthlyIncome(income, currentYear, currentMonth),
    [income, currentYear, currentMonth]
  );

  const totalExpenses = getTotalExpenses(monthlyExpenses);
  const totalIncome = getTotalIncome(monthlyIncome);
  const monthlyInstallmentTotal = getMonthlyInstallments(installments, currentYear, currentMonth);
  const balance = totalIncome - totalExpenses - monthlyInstallmentTotal;

  const totalSavings = savingsGoals.reduce((s, g) => s + g.currentAmount, 0);
  const activeInvestments = investments.filter(i => i.status === 'active');
  const totalInvested = activeInvestments.reduce((s, i) => s + i.initialAmount, 0);

  // Chart data
  const chartData = useMemo(() => {
    return getLast6Months().map(({ year, month, label }) => {
      const monthExp = getMonthlyExpenses(expenses, year, month);
      const monthInc = getMonthlyIncome(income, year, month);
      return {
        month: label,
        gastos: getTotalExpenses(monthExp),
        ingresos: getTotalIncome(monthInc),
      };
    });
  }, [expenses, income]);

  // Upcoming payments
  const upcomingInstallments = installments
    .filter(p => p.paidInstallments < p.totalInstallments && isDateWithinDays(p.nextPaymentDate, 15))
    .slice(0, 3);

  // Pending income
  const pendingIncome = income
    .filter(i => !i.isReceived && isDateWithinDays(i.expectedDate, 15))
    .slice(0, 3);

  const greeting = () => {
    const h = now.getHours();
    if (h < 12) return 'Buenos días';
    if (h < 18) return 'Buenas tardes';
    return 'Buenas noches';
  };

  return (
    <AppLayout>
      {/* Header */}
      <div className="mb-8 fade-in">
        <p className="text-slate-500 text-sm">{greeting()},</p>
        <h1 className="text-2xl md:text-3xl font-bold text-white mt-0.5">
          {activeUser?.name} <span className="text-xl">{activeUser?.avatar}</span>
        </h1>
        <p className="text-slate-500 text-sm mt-1 capitalize">
          {format(now, "EEEE, d 'de' MMMM yyyy", { locale: es })}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          title="Balance del Mes"
          value={balance}
          icon="⚖️"
          color={balance >= 0 ? '#22c55e' : '#ef4444'}
          glowClass={balance >= 0 ? 'stat-glow-green' : 'stat-glow-red'}
        />
        <StatCard
          title="Ingresos"
          value={totalIncome}
          icon="💰"
          color="#22c55e"
          glowClass="stat-glow-green"
        />
        <StatCard
          title="Gastos"
          value={totalExpenses + monthlyInstallmentTotal}
          icon="📤"
          color="#ef4444"
          glowClass="stat-glow-red"
        />
        <StatCard
          title="Ahorros"
          value={totalSavings}
          icon="🏦"
          color="#6366f1"
          glowClass="stat-glow-purple"
        />
      </div>

      {/* Chart + Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Chart */}
        <div className="lg:col-span-2 glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-white">Evolución Mensual</h2>
            <div className="flex items-center gap-4 text-xs text-slate-500">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#22c55e]" />Ingresos
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#ef4444]" />Gastos
              </span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="ingresosGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gastosGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
              <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false}
                tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{ background: '#12141a', border: '1px solid #ffffff14', borderRadius: 10, fontSize: 12 }}
                labelStyle={{ color: '#94a3b8' }}
                formatter={(v) => [formatCurrency(Number(v ?? 0))]}
              />
              <Area type="monotone" dataKey="ingresos" stroke="#22c55e" strokeWidth={2} fill="url(#ingresosGrad)" />
              <Area type="monotone" dataKey="gastos" stroke="#ef4444" strokeWidth={2} fill="url(#gastosGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Alerts */}
        <div className="glass-card p-5 flex flex-col gap-4">
          <h2 className="text-sm font-semibold text-white">Próximos Vencimientos</h2>
          {upcomingInstallments.length === 0 && pendingIncome.length === 0 && (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-slate-500 text-xs text-center">Sin vencimientos próximos</p>
            </div>
          )}
          {pendingIncome.map(inc => (
            <div key={inc.id} className="flex items-start gap-3 p-3 rounded-xl bg-green-500/10 border border-green-500/20">
              <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center text-sm shrink-0">
                💰
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-white truncate">{inc.description}</p>
                <p className="text-[11px] text-green-400 mt-0.5">
                  {formatCurrency(inc.amount)} · {formatDate(inc.expectedDate)}
                </p>
              </div>
              <ArrowUpRight size={14} className="text-green-400 shrink-0 mt-0.5" />
            </div>
          ))}
          {upcomingInstallments.map(inst => (
            <div key={inst.id} className="flex items-start gap-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
              <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center text-sm shrink-0">
                💳
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-white truncate">{inst.description}</p>
                <p className="text-[11px] text-amber-400 mt-0.5">
                  {formatCurrency(inst.installmentAmount)} · {formatDate(inst.nextPaymentDate)}
                </p>
                <p className="text-[10px] text-slate-500">
                  Cuota {inst.paidInstallments + 1}/{inst.totalInstallments}
                </p>
              </div>
              <AlertCircle size={14} className="text-amber-400 shrink-0 mt-0.5" />
            </div>
          ))}
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Nuevo Gasto', icon: '📤', href: '/gastos', color: '#ef4444' },
          { label: 'Registrar Ingreso', icon: '📥', href: '/ingresos', color: '#22c55e' },
          { label: 'Agregar Cuota', icon: '💳', href: '/tarjetas', color: '#f59e0b' },
          { label: 'Nueva Inversión', icon: '📈', href: '/inversiones', color: '#6366f1' },
        ].map(({ label, icon, href, color }) => (
          <Link
            key={href}
            href={href}
            className="glass-card p-4 flex items-center gap-3 hover:scale-[1.02] transition-transform cursor-pointer"
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0"
              style={{ background: `${color}22` }}
            >
              {icon}
            </div>
            <div>
              <p className="text-xs font-medium text-white leading-tight">{label}</p>
              <div className="flex items-center gap-1 mt-0.5">
                <Plus size={10} style={{ color }} />
                <span className="text-[10px]" style={{ color }}>Agregar</span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Investments summary */}
      {activeInvestments.length > 0 && (
        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-white">Inversiones Activas</h2>
            <Link href="/inversiones" className="text-xs text-indigo-400 hover:text-indigo-300">
              Ver todas →
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {activeInvestments.slice(0, 3).map(inv => {
              const current = inv.currentAmount ?? inv.initialAmount;
              const gain = current - inv.initialAmount;
              const gainPct = inv.initialAmount > 0 ? (gain / inv.initialAmount) * 100 : 0;
              return (
                <div key={inv.id} className="p-3 rounded-xl bg-white/3 border border-white/5">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-medium text-white truncate">{inv.name}</p>
                    {gain >= 0 ? (
                      <ArrowUpRight size={14} className="text-green-400 shrink-0" />
                    ) : (
                      <ArrowDownRight size={14} className="text-red-400 shrink-0" />
                    )}
                  </div>
                  <p className="text-sm font-bold text-white">{formatCurrency(current)}</p>
                  <p className="text-[11px] mt-0.5" style={{ color: gain >= 0 ? '#22c55e' : '#ef4444' }}>
                    {gain >= 0 ? '+' : ''}{formatCurrency(gain)} ({gainPct.toFixed(1)}%)
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </AppLayout>
  );
}
