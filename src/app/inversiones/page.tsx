'use client';

import { useState } from 'react';
import { Plus, Trash2, Edit2, TrendingUp, TrendingDown, CheckCircle2, Clock } from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import Modal from '@/components/ui/Modal';
import { useApp, useUserInvestments, useActiveUser } from '@/lib/context';
import * as store from '@/lib/store';
import { Investment, InvestmentType, InvestmentStatus } from '@/lib/types';
import {
  formatCurrency, formatDate, getTodayISO,
  getInvestmentReturn, getInvestmentReturnPct, INVESTMENT_TYPE_LABELS,
} from '@/lib/utils';
import StatCard from '@/components/ui/StatCard';

type FormData = {
  name: string;
  type: InvestmentType;
  initialAmount: string;
  currentAmount: string;
  finalAmount: string;
  startDate: string;
  endDate: string;
  status: InvestmentStatus;
  platform: string;
  notes: string;
};

const defaultForm: FormData = {
  name: '',
  type: 'fixed_term',
  initialAmount: '',
  currentAmount: '',
  finalAmount: '',
  startDate: getTodayISO(),
  endDate: '',
  status: 'active',
  platform: '',
  notes: '',
};

const TYPE_ICONS: Record<string, string> = {
  stocks: '📊',
  crypto: '₿',
  bonds: '📜',
  real_estate: '🏠',
  fixed_term: '🏦',
  fund: '📈',
  other: '💼',
};

export default function InversionesPage() {
  const { dispatch, data } = useApp();
  const investments = useUserInvestments();
  const activeUser = useActiveUser();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(defaultForm);
  const [tab, setTab] = useState<'active' | 'closed'>('active');
  const [closeModal, setCloseModal] = useState<{ id: string; finalAmount: string } | null>(null);

  const active = investments.filter(i => i.status === 'active');
  const closed = investments.filter(i => i.status === 'closed');
  const displayList = tab === 'active' ? active : closed;

  const totalInvested = active.reduce((s, i) => s + i.initialAmount, 0);
  const totalCurrent = active.reduce((s, i) => s + (i.currentAmount ?? i.initialAmount), 0);
  const totalGain = totalCurrent - totalInvested;
  const totalGainClosed = closed.reduce((s, i) => s + getInvestmentReturn(i), 0);

  function openAdd() {
    setEditingId(null);
    setForm(defaultForm);
    setIsModalOpen(true);
  }

  function openEdit(inv: Investment) {
    setEditingId(inv.id);
    setForm({
      name: inv.name,
      type: inv.type,
      initialAmount: String(inv.initialAmount),
      currentAmount: inv.currentAmount ? String(inv.currentAmount) : '',
      finalAmount: inv.finalAmount ? String(inv.finalAmount) : '',
      startDate: inv.startDate.split('T')[0],
      endDate: inv.endDate?.split('T')[0] ?? '',
      status: inv.status,
      platform: inv.platform ?? '',
      notes: inv.notes ?? '',
    });
    setIsModalOpen(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload: Omit<Investment, 'id' | 'createdAt'> = {
      userId: data.activeUserId,
      name: form.name,
      type: form.type,
      initialAmount: parseFloat(form.initialAmount),
      currentAmount: form.currentAmount ? parseFloat(form.currentAmount) : undefined,
      finalAmount: form.finalAmount ? parseFloat(form.finalAmount) : undefined,
      startDate: form.startDate,
      endDate: form.endDate || undefined,
      status: form.status,
      platform: form.platform || undefined,
      notes: form.notes || undefined,
    };
    if (editingId) {
      dispatch(d => store.updateInvestment(d, editingId, payload));
    } else {
      dispatch(d => store.addInvestment(d, payload));
    }
    setIsModalOpen(false);
  }

  function handleDelete(id: string) {
    if (confirm('¿Eliminar esta inversión?')) {
      dispatch(d => store.deleteInvestment(d, id));
    }
  }

  function handleClose(id: string) {
    const finalAmount = parseFloat(closeModal?.finalAmount ?? '0');
    if (isNaN(finalAmount)) return;
    dispatch(d => store.updateInvestment(d, id, {
      status: 'closed',
      finalAmount,
      endDate: new Date().toISOString().split('T')[0],
    }));
    setCloseModal(null);
  }

  return (
    <AppLayout>
      <div className="flex items-start justify-between mb-6 fade-in">
        <div>
          <h1 className="text-2xl font-bold text-white">Inversiones</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {active.length} activas · {closed.length} cerradas
          </p>
        </div>
        <button onClick={openAdd} className="btn btn-primary">
          <Plus size={16} />
          Nueva inversión
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard title="Capital Invertido" value={totalInvested} icon="💰" color="#6366f1" glowClass="stat-glow-purple" />
        <StatCard title="Valor Actual" value={totalCurrent} icon="📊" color="#3b82f6" />
        <StatCard
          title="Ganancia No Realizada"
          value={totalGain}
          icon={totalGain >= 0 ? '📈' : '📉'}
          color={totalGain >= 0 ? '#22c55e' : '#ef4444'}
          glowClass={totalGain >= 0 ? 'stat-glow-green' : 'stat-glow-red'}
        />
        <StatCard
          title="Ganancia Realizada"
          value={totalGainClosed}
          icon="✅"
          color={totalGainClosed >= 0 ? '#22c55e' : '#ef4444'}
          glowClass={totalGainClosed >= 0 ? 'stat-glow-green' : 'stat-glow-red'}
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-white/5 rounded-xl mb-6 w-fit">
        {(['active', 'closed'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
            style={{
              background: tab === t ? '#ffffff12' : 'transparent',
              color: tab === t ? 'white' : '#64748b',
            }}
          >
            {t === 'active' ? `Activas (${active.length})` : `Cerradas (${closed.length})`}
          </button>
        ))}
      </div>

      {/* List */}
      {displayList.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <p className="text-4xl mb-3">{tab === 'active' ? '📈' : '📋'}</p>
          <p className="text-slate-400">
            {tab === 'active' ? 'Sin inversiones activas' : 'Sin inversiones cerradas'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {displayList.map(inv => {
            const gain = getInvestmentReturn(inv);
            const gainPct = getInvestmentReturnPct(inv);
            const current = inv.finalAmount ?? inv.currentAmount ?? inv.initialAmount;
            const isPositive = gain >= 0;

            return (
              <div key={inv.id} className="glass-card p-5 group hover:border-white/10 transition-all">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-11 h-11 rounded-xl flex items-center justify-center text-2xl"
                      style={{ background: isPositive ? '#22c55e22' : '#ef444422' }}
                    >
                      {TYPE_ICONS[inv.type]}
                    </div>
                    <div>
                      <p className="font-semibold text-white text-sm">{inv.name}</p>
                      <p className="text-[11px] text-slate-500">
                        {INVESTMENT_TYPE_LABELS[inv.type]}
                        {inv.platform && ` · ${inv.platform}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    {inv.status === 'active' && (
                      <button
                        onClick={() => setCloseModal({ id: inv.id, finalAmount: String(current) })}
                        className="text-[11px] px-2 py-1 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 font-medium"
                      >
                        Cerrar
                      </button>
                    )}
                    <button onClick={() => openEdit(inv)} className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white">
                      <Edit2 size={12} />
                    </button>
                    <button onClick={() => handleDelete(inv.id)} className="p-1.5 rounded-lg hover:bg-red-500/20 text-slate-400 hover:text-red-400">
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="p-2.5 rounded-xl bg-white/3">
                    <p className="text-[10px] text-slate-500 mb-1">Inicial</p>
                    <p className="text-sm font-semibold text-white">{formatCurrency(inv.initialAmount)}</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white/3">
                    <p className="text-[10px] text-slate-500 mb-1">{inv.status === 'closed' ? 'Final' : 'Actual'}</p>
                    <p className="text-sm font-semibold text-white">{formatCurrency(current)}</p>
                  </div>
                  <div className="p-2.5 rounded-xl" style={{ background: isPositive ? '#22c55e15' : '#ef444415' }}>
                    <p className="text-[10px] text-slate-500 mb-1">Ganancia</p>
                    <p className="text-sm font-semibold" style={{ color: isPositive ? '#22c55e' : '#ef4444' }}>
                      {isPositive ? '+' : ''}{formatCurrency(gain)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Clock size={11} />
                    {formatDate(inv.startDate)}
                    {inv.endDate && <> → {formatDate(inv.endDate)}</>}
                  </div>
                  <div className="flex items-center gap-1.5">
                    {inv.status === 'closed' ? (
                      <span className="badge bg-slate-500/20 text-slate-400">Cerrada</span>
                    ) : (
                      <span className="badge bg-green-500/20 text-green-400 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-400 pulse-dot" />
                        Activa
                      </span>
                    )}
                    <span
                      className="text-sm font-bold flex items-center gap-1"
                      style={{ color: isPositive ? '#22c55e' : '#ef4444' }}
                    >
                      {isPositive ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
                      {isPositive ? '+' : ''}{gainPct.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId ? 'Editar Inversión' : 'Nueva Inversión'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-400 mb-1.5 block">Nombre *</label>
              <input className="input-field" placeholder="Ej: Plazo fijo Galicia" value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1.5 block">Tipo *</label>
              <select className="input-field" value={form.type}
                onChange={e => setForm(f => ({ ...f, type: e.target.value as InvestmentType }))}>
                {Object.entries(INVESTMENT_TYPE_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{TYPE_ICONS[k]} {v}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-400 mb-1.5 block">Monto inicial *</label>
              <input className="input-field" type="number" min="0" step="0.01" placeholder="0.00"
                value={form.initialAmount} onChange={e => setForm(f => ({ ...f, initialAmount: e.target.value }))} required />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1.5 block">Valor actual</label>
              <input className="input-field" type="number" min="0" step="0.01" placeholder="Opcional"
                value={form.currentAmount} onChange={e => setForm(f => ({ ...f, currentAmount: e.target.value }))} />
            </div>
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1.5 block">Plataforma / Broker</label>
            <input className="input-field" placeholder="Ej: IOL, Binance, Galicia..." value={form.platform}
              onChange={e => setForm(f => ({ ...f, platform: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-400 mb-1.5 block">Fecha inicio *</label>
              <input className="input-field" type="date" value={form.startDate}
                onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} required />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1.5 block">Fecha fin (si aplica)</label>
              <input className="input-field" type="date" value={form.endDate}
                onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} />
            </div>
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1.5 block">Notas</label>
            <textarea className="input-field resize-none" rows={2} value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-secondary flex-1">Cancelar</button>
            <button type="submit" className="btn btn-primary flex-1">{editingId ? 'Guardar' : 'Agregar inversión'}</button>
          </div>
        </form>
      </Modal>

      {/* Close Investment Modal */}
      {closeModal && (
        <Modal isOpen={!!closeModal} onClose={() => setCloseModal(null)} title="Cerrar Inversión" size="sm">
          <div className="space-y-4">
            <p className="text-slate-400 text-sm">
              Ingresa el monto final al cerrar / retirar esta inversión.
            </p>
            <div>
              <label className="text-xs text-slate-400 mb-1.5 block">Monto final *</label>
              <input
                className="input-field"
                type="number"
                min="0"
                step="0.01"
                value={closeModal.finalAmount}
                onChange={e => setCloseModal(m => m ? { ...m, finalAmount: e.target.value } : null)}
              />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setCloseModal(null)} className="btn btn-secondary flex-1">Cancelar</button>
              <button onClick={() => handleClose(closeModal.id)} className="btn btn-success flex-1">
                <CheckCircle2 size={15} />
                Confirmar cierre
              </button>
            </div>
          </div>
        </Modal>
      )}
    </AppLayout>
  );
}
