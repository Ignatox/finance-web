'use client';

import { useState, useMemo } from 'react';
import { Plus, Trash2, Edit2, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import Modal from '@/components/ui/Modal';
import {
  useApp, useUserSavingsGoals, useUserSavingsCategories, useActiveUser
} from '@/lib/context';
import * as store from '@/lib/store';
import { SavingsGoal } from '@/lib/types';
import { formatCurrency, formatDate, getTodayISO } from '@/lib/utils';
import StatCard from '@/components/ui/StatCard';

type GoalFormData = {
  name: string;
  categoryId: string;
  targetAmount: string;
  currentAmount: string;
  targetDate: string;
  notes: string;
};

type TxFormData = {
  goalId: string;
  amount: string;
  type: 'deposit' | 'withdrawal';
  date: string;
  notes: string;
};

const defaultGoalForm: GoalFormData = {
  name: '', categoryId: '', targetAmount: '', currentAmount: '0', targetDate: '', notes: '',
};

const defaultTxForm: TxFormData = {
  goalId: '', amount: '', type: 'deposit', date: getTodayISO(), notes: '',
};

export default function AhorrosPage() {
  const { dispatch, data } = useApp();
  const goals = useUserSavingsGoals();
  const categories = useUserSavingsCategories();
  const activeUser = useActiveUser();

  const [goalModal, setGoalModal] = useState(false);
  const [txModal, setTxModal] = useState(false);
  const [editGoalId, setEditGoalId] = useState<string | null>(null);
  const [goalForm, setGoalForm] = useState<GoalFormData>(defaultGoalForm);
  const [txForm, setTxForm] = useState<TxFormData>(defaultTxForm);
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);

  const catMap = Object.fromEntries(categories.map(c => [c.id, c]));

  const totalSaved = goals.reduce((s, g) => s + g.currentAmount, 0);
  const totalTarget = goals.reduce((s, g) => s + g.targetAmount, 0);
  const overallProgress = totalTarget > 0 ? (totalSaved / totalTarget) * 100 : 0;

  function openAddGoal() {
    setEditGoalId(null);
    setGoalForm({ ...defaultGoalForm, categoryId: categories[0]?.id ?? '' });
    setGoalModal(true);
  }

  function openEditGoal(goal: SavingsGoal) {
    setEditGoalId(goal.id);
    setGoalForm({
      name: goal.name,
      categoryId: goal.categoryId,
      targetAmount: String(goal.targetAmount),
      currentAmount: String(goal.currentAmount),
      targetDate: goal.targetDate?.split('T')[0] ?? '',
      notes: goal.notes ?? '',
    });
    setGoalModal(true);
  }

  function handleGoalSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload: Omit<SavingsGoal, 'id' | 'createdAt'> = {
      userId: data.activeUserId,
      name: goalForm.name,
      categoryId: goalForm.categoryId,
      targetAmount: parseFloat(goalForm.targetAmount),
      currentAmount: parseFloat(goalForm.currentAmount),
      targetDate: goalForm.targetDate || undefined,
      notes: goalForm.notes || undefined,
    };
    if (editGoalId) {
      dispatch(d => store.updateSavingsGoal(d, editGoalId, payload));
    } else {
      dispatch(d => store.addSavingsGoal(d, payload));
    }
    setGoalModal(false);
  }

  function openTx(goalId: string, type: 'deposit' | 'withdrawal') {
    setTxForm({ ...defaultTxForm, goalId, type });
    setTxModal(true);
  }

  function handleTxSubmit(e: React.FormEvent) {
    e.preventDefault();
    dispatch(d => store.addSavingsTransaction(d, {
      userId: data.activeUserId,
      goalId: txForm.goalId,
      amount: parseFloat(txForm.amount),
      type: txForm.type,
      date: txForm.date,
      notes: txForm.notes || undefined,
    }));
    setTxModal(false);
  }

  function handleDeleteGoal(id: string) {
    if (confirm('¿Eliminar este objetivo de ahorro?')) {
      dispatch(d => store.deleteSavingsGoal(d, id));
    }
  }

  const goalTransactions = useMemo(() => {
    if (!selectedGoalId) return [];
    return data.savingsTransactions
      .filter(t => t.goalId === selectedGoalId)
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [data.savingsTransactions, selectedGoalId]);

  return (
    <AppLayout>
      <div className="flex items-start justify-between mb-6 fade-in">
        <div>
          <h1 className="text-2xl font-bold text-white">Ahorros</h1>
          <p className="text-slate-500 text-sm mt-0.5">{goals.length} objetivos activos</p>
        </div>
        <button onClick={openAddGoal} className="btn btn-primary">
          <Plus size={16} />
          Nuevo objetivo
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <StatCard title="Total Ahorrado" value={totalSaved} icon="🏦" color="#22c55e" glowClass="stat-glow-green" />
        <StatCard title="Meta Total" value={totalTarget} icon="🎯" color="#6366f1" glowClass="stat-glow-purple" />
        <div className="glass-card p-5 flex flex-col justify-between">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Progreso general</p>
          <p className="text-2xl font-bold text-white mb-3">{overallProgress.toFixed(1)}%</p>
          <div className="progress-bar-track">
            <div className="progress-bar-fill" style={{
              width: `${Math.min(100, overallProgress)}%`,
              background: 'linear-gradient(90deg, #6366f1, #22c55e)',
            }} />
          </div>
        </div>
      </div>

      {/* Goals grid */}
      {goals.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <p className="text-4xl mb-3">🎯</p>
          <p className="text-slate-400 font-medium">Sin objetivos de ahorro</p>
          <p className="text-slate-600 text-sm mt-1">Crea tu primer objetivo para comenzar a ahorrar</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {goals.map(goal => {
            const cat = catMap[goal.categoryId];
            const progress = goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0;
            const remaining = Math.max(0, goal.targetAmount - goal.currentAmount);
            const isCompleted = progress >= 100;

            return (
              <div
                key={goal.id}
                className={`glass-card p-5 cursor-pointer transition-all hover:border-white/15 ${selectedGoalId === goal.id ? 'border-indigo-500/40' : ''}`}
                onClick={() => setSelectedGoalId(selectedGoalId === goal.id ? null : goal.id)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                      style={{ background: `${cat?.color ?? '#6366f1'}22` }}
                    >
                      {cat?.icon ?? '💰'}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">{goal.name}</p>
                      <p className="text-[11px] text-slate-500">{cat?.name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={e => { e.stopPropagation(); openEditGoal(goal); }}
                      className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white"
                    >
                      <Edit2 size={12} />
                    </button>
                    <button
                      onClick={e => { e.stopPropagation(); handleDeleteGoal(goal.id); }}
                      className="p-1.5 rounded-lg hover:bg-red-500/20 text-slate-400 hover:text-red-400"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>

                <div className="mb-3">
                  <div className="flex items-end justify-between mb-1.5">
                    <p className="text-xl font-bold text-white">{formatCurrency(goal.currentAmount)}</p>
                    <p className="text-xs text-slate-500">de {formatCurrency(goal.targetAmount)}</p>
                  </div>
                  <div className="progress-bar-track">
                    <div
                      className="progress-bar-fill"
                      style={{
                        width: `${Math.min(100, progress)}%`,
                        background: isCompleted
                          ? 'linear-gradient(90deg, #22c55e, #16a34a)'
                          : `linear-gradient(90deg, ${cat?.color ?? '#6366f1'}, ${cat?.color ?? '#6366f1'}99)`,
                      }}
                    />
                  </div>
                  <div className="flex justify-between mt-1">
                    <p className="text-[11px] text-slate-500">{progress.toFixed(1)}%</p>
                    {!isCompleted && <p className="text-[11px] text-slate-500">Faltan {formatCurrency(remaining)}</p>}
                    {isCompleted && <p className="text-[11px] text-green-400">✅ ¡Meta alcanzada!</p>}
                  </div>
                </div>

                {goal.targetDate && (
                  <p className="text-[11px] text-slate-500 mb-3">📅 Meta: {formatDate(goal.targetDate)}</p>
                )}

                <div className="flex gap-2" onClick={e => e.stopPropagation()}>
                  <button
                    onClick={() => openTx(goal.id, 'deposit')}
                    className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-medium bg-green-500/15 text-green-400 hover:bg-green-500/25 transition-colors"
                  >
                    <ArrowUpCircle size={12} />
                    Depositar
                  </button>
                  <button
                    onClick={() => openTx(goal.id, 'withdrawal')}
                    className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-medium bg-red-500/15 text-red-400 hover:bg-red-500/25 transition-colors"
                  >
                    <ArrowDownCircle size={12} />
                    Retirar
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Transaction history for selected goal */}
      {selectedGoalId && goalTransactions.length > 0 && (
        <div className="mt-8 glass-card p-5 fade-in">
          <h3 className="text-sm font-semibold text-white mb-4">
            Historial: {goals.find(g => g.id === selectedGoalId)?.name}
          </h3>
          <div className="space-y-2">
            {goalTransactions.map(tx => (
              <div key={tx.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/3">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm shrink-0 ${tx.type === 'deposit' ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                  {tx.type === 'deposit' ? '↑' : '↓'}
                </div>
                <div className="flex-1">
                  <p className="text-xs text-slate-400">{formatDate(tx.date)}</p>
                  {tx.notes && <p className="text-xs text-slate-500">{tx.notes}</p>}
                </div>
                <p
                  className="text-sm font-bold"
                  style={{ color: tx.type === 'deposit' ? '#22c55e' : '#ef4444' }}
                >
                  {tx.type === 'deposit' ? '+' : '-'}{formatCurrency(tx.amount)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Goal Modal */}
      <Modal isOpen={goalModal} onClose={() => setGoalModal(false)} title={editGoalId ? 'Editar Objetivo' : 'Nuevo Objetivo de Ahorro'}>
        <form onSubmit={handleGoalSubmit} className="space-y-4">
          <div>
            <label className="text-xs text-slate-400 mb-1.5 block">Nombre *</label>
            <input className="input-field" placeholder="Ej: Fondo de emergencia" value={goalForm.name}
              onChange={e => setGoalForm(f => ({ ...f, name: e.target.value }))} required />
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1.5 block">Categoría *</label>
            <select className="input-field" value={goalForm.categoryId}
              onChange={e => setGoalForm(f => ({ ...f, categoryId: e.target.value }))} required>
              <option value="">Seleccionar</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-400 mb-1.5 block">Meta ($) *</label>
              <input className="input-field" type="number" min="0" step="0.01" placeholder="0.00"
                value={goalForm.targetAmount} onChange={e => setGoalForm(f => ({ ...f, targetAmount: e.target.value }))} required />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1.5 block">Saldo actual ($)</label>
              <input className="input-field" type="number" min="0" step="0.01" placeholder="0.00"
                value={goalForm.currentAmount} onChange={e => setGoalForm(f => ({ ...f, currentAmount: e.target.value }))} />
            </div>
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1.5 block">Fecha objetivo</label>
            <input className="input-field" type="date" value={goalForm.targetDate}
              onChange={e => setGoalForm(f => ({ ...f, targetDate: e.target.value }))} />
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1.5 block">Notas</label>
            <textarea className="input-field resize-none" rows={2} value={goalForm.notes}
              onChange={e => setGoalForm(f => ({ ...f, notes: e.target.value }))} />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setGoalModal(false)} className="btn btn-secondary flex-1">Cancelar</button>
            <button type="submit" className="btn btn-primary flex-1">{editGoalId ? 'Guardar' : 'Crear objetivo'}</button>
          </div>
        </form>
      </Modal>

      {/* Transaction Modal */}
      <Modal isOpen={txModal} onClose={() => setTxModal(false)} title={txForm.type === 'deposit' ? 'Depositar' : 'Retirar'} size="sm">
        <form onSubmit={handleTxSubmit} className="space-y-4">
          <div>
            <label className="text-xs text-slate-400 mb-1.5 block">Monto *</label>
            <input className="input-field" type="number" min="0.01" step="0.01" placeholder="0.00"
              value={txForm.amount} onChange={e => setTxForm(f => ({ ...f, amount: e.target.value }))} required />
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1.5 block">Fecha *</label>
            <input className="input-field" type="date" value={txForm.date}
              onChange={e => setTxForm(f => ({ ...f, date: e.target.value }))} required />
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1.5 block">Notas</label>
            <textarea className="input-field resize-none" rows={2} value={txForm.notes}
              onChange={e => setTxForm(f => ({ ...f, notes: e.target.value }))} />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setTxModal(false)} className="btn btn-secondary flex-1">Cancelar</button>
            <button type="submit" className={`flex-1 btn ${txForm.type === 'deposit' ? 'btn-success' : 'btn-danger'}`}>
              {txForm.type === 'deposit' ? 'Depositar' : 'Retirar'}
            </button>
          </div>
        </form>
      </Modal>
    </AppLayout>
  );
}
