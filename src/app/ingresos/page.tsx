'use client';

import { useState, useMemo } from 'react';
import { Plus, Trash2, Edit2, CheckCircle2, Clock } from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import Modal from '@/components/ui/Modal';
import { useApp, useUserIncome, useUserIncomeCategories, useActiveUser } from '@/lib/context';
import * as store from '@/lib/store';
import { Income } from '@/lib/types';
import { formatCurrency, formatDate, getTodayISO, getMonthlyIncome, getTotalIncome } from '@/lib/utils';
import StatCard from '@/components/ui/StatCard';

type FormData = {
  description: string;
  amount: string;
  categoryId: string;
  expectedDate: string;
  isRecurring: boolean;
  recurringDay: string;
  notes: string;
};

const defaultForm: FormData = {
  description: '',
  amount: '',
  categoryId: '',
  expectedDate: getTodayISO(),
  isRecurring: false,
  recurringDay: '',
  notes: '',
};

export default function IngresosPage() {
  const { dispatch, data } = useApp();
  const income = useUserIncome();
  const categories = useUserIncomeCategories();
  const activeUser = useActiveUser();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(defaultForm);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [tab, setTab] = useState<'pending' | 'received'>('pending');

  const now = new Date();
  const [year, month] = selectedMonth.split('-').map(Number);

  const monthlyIncome = useMemo(() => getMonthlyIncome(income, year, month), [income, year, month]);
  const received = monthlyIncome.filter(i => i.isReceived);
  const pending = monthlyIncome.filter(i => !i.isReceived);
  const totalReceived = getTotalIncome(received.length ? received : []);
  const totalPending = pending.reduce((s, i) => s + i.amount, 0);

  const displayList = tab === 'pending' ? pending : received;
  const catMap = Object.fromEntries(categories.map(c => [c.id, c]));

  function openAdd() {
    setEditingId(null);
    setForm({ ...defaultForm, categoryId: categories[0]?.id ?? '' });
    setIsModalOpen(true);
  }

  function openEdit(inc: Income) {
    setEditingId(inc.id);
    setForm({
      description: inc.description,
      amount: String(inc.amount),
      categoryId: inc.categoryId,
      expectedDate: inc.expectedDate.split('T')[0],
      isRecurring: inc.isRecurring,
      recurringDay: String(inc.recurringDay ?? ''),
      notes: inc.notes ?? '',
    });
    setIsModalOpen(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload: Omit<Income, 'id' | 'createdAt'> = {
      userId: data.activeUserId,
      description: form.description,
      amount: parseFloat(form.amount),
      categoryId: form.categoryId,
      expectedDate: form.expectedDate,
      isReceived: false,
      isRecurring: form.isRecurring,
      recurringDay: form.isRecurring && form.recurringDay ? parseInt(form.recurringDay) : undefined,
      notes: form.notes || undefined,
    };
    if (editingId) {
      dispatch(d => store.updateIncome(d, editingId, payload));
    } else {
      dispatch(d => store.addIncome(d, payload));
    }
    setIsModalOpen(false);
  }

  function handleDelete(id: string) {
    if (confirm('¿Eliminar este ingreso?')) {
      dispatch(d => store.deleteIncome(d, id));
    }
  }

  function handleMarkReceived(id: string) {
    dispatch(d => store.markIncomeReceived(d, id));
  }

  return (
    <AppLayout>
      <div className="flex items-start justify-between mb-6 fade-in">
        <div>
          <h1 className="text-2xl font-bold text-white">Ingresos</h1>
          <p className="text-slate-500 text-sm mt-0.5">Gestión de ingresos y cobros</p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="month"
            className="input-field w-auto"
            value={selectedMonth}
            onChange={e => setSelectedMonth(e.target.value)}
          />
          <button onClick={openAdd} className="btn btn-primary">
            <Plus size={16} />
            Agregar
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        <StatCard
          title="Total Cobrado"
          value={totalReceived}
          icon="✅"
          color="#22c55e"
          glowClass="stat-glow-green"
        />
        <StatCard
          title="Pendiente de Cobro"
          value={totalPending}
          icon="⏳"
          color="#f59e0b"
          glowClass="stat-glow-amber"
        />
        <div className="col-span-2 md:col-span-1">
          <StatCard
            title="Balance Total"
            value={totalReceived + totalPending}
            icon="💰"
            color="#6366f1"
            glowClass="stat-glow-purple"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-white/5 rounded-xl mb-6 w-fit">
        <button
          onClick={() => setTab('pending')}
          className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
          style={{
            background: tab === 'pending' ? '#ffffff12' : 'transparent',
            color: tab === 'pending' ? 'white' : '#64748b',
          }}
        >
          Pendientes {pending.length > 0 && (
            <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-xs bg-amber-500/20 text-amber-400">
              {pending.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setTab('received')}
          className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
          style={{
            background: tab === 'received' ? '#ffffff12' : 'transparent',
            color: tab === 'received' ? 'white' : '#64748b',
          }}
        >
          Cobrados {received.length > 0 && (
            <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-xs bg-green-500/20 text-green-400">
              {received.length}
            </span>
          )}
        </button>
      </div>

      {/* List */}
      {displayList.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <p className="text-4xl mb-3">{tab === 'pending' ? '⏳' : '✅'}</p>
          <p className="text-slate-400">
            {tab === 'pending' ? 'Sin ingresos pendientes este mes' : 'Sin ingresos cobrados este mes'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {displayList.map(inc => {
            const cat = catMap[inc.categoryId];
            return (
              <div key={inc.id} className="glass-card p-4 flex items-center gap-4 group hover:border-white/10 transition-all">
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0"
                  style={{ background: `${cat?.color ?? '#22c55e'}22` }}
                >
                  {cat?.icon ?? '💰'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{inc.description}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <span
                      className="text-[11px] px-1.5 py-0.5 rounded-full"
                      style={{ background: `${cat?.color ?? '#22c55e'}22`, color: cat?.color ?? '#22c55e' }}
                    >
                      {cat?.name}
                    </span>
                    <span className="text-[11px] text-slate-500 flex items-center gap-1">
                      <Clock size={10} />
                      Esperado: {formatDate(inc.expectedDate)}
                    </span>
                    {inc.isRecurring && <span className="text-[11px] text-slate-500">🔄 Recurrente</span>}
                  </div>
                  {inc.isReceived && inc.receivedDate && (
                    <p className="text-[11px] text-green-400 mt-1 flex items-center gap-1">
                      <CheckCircle2 size={10} />
                      Cobrado el {formatDate(inc.receivedDate)}
                    </p>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold text-white">{formatCurrency(inc.amount)}</p>
                  {!inc.isReceived && (
                    <button
                      onClick={() => handleMarkReceived(inc.id)}
                      className="mt-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                      style={{
                        background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                        color: 'white',
                        boxShadow: '0 2px 8px rgba(34, 197, 94, 0.3)',
                      }}
                    >
                      💰 Cobré
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  <button
                    onClick={() => openEdit(inc)}
                    className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white"
                  >
                    <Edit2 size={13} />
                  </button>
                  <button
                    onClick={() => handleDelete(inc.id)}
                    className="p-1.5 rounded-lg hover:bg-red-500/20 text-slate-400 hover:text-red-400"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId ? 'Editar Ingreso' : 'Nuevo Ingreso'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs text-slate-400 mb-1.5 block">Descripción *</label>
            <input className="input-field" placeholder="Ej: Sueldo Junio" value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-400 mb-1.5 block">Monto *</label>
              <input className="input-field" type="number" min="0" step="0.01" placeholder="0.00"
                value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} required />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1.5 block">Fecha esperada *</label>
              <input className="input-field" type="date" value={form.expectedDate}
                onChange={e => setForm(f => ({ ...f, expectedDate: e.target.value }))} required />
            </div>
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1.5 block">Categoría *</label>
            <select className="input-field" value={form.categoryId}
              onChange={e => setForm(f => ({ ...f, categoryId: e.target.value }))} required>
              <option value="">Seleccionar categoría</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.isRecurring}
                onChange={e => setForm(f => ({ ...f, isRecurring: e.target.checked }))}
                className="w-4 h-4 rounded accent-indigo-500" />
              <span className="text-sm text-slate-300">Es un ingreso recurrente</span>
            </label>
          </div>
          {form.isRecurring && (
            <div>
              <label className="text-xs text-slate-400 mb-1.5 block">Día del mes (1-31)</label>
              <input className="input-field" type="number" min="1" max="31" placeholder="Ej: 10"
                value={form.recurringDay} onChange={e => setForm(f => ({ ...f, recurringDay: e.target.value }))} />
            </div>
          )}
          <div>
            <label className="text-xs text-slate-400 mb-1.5 block">Notas</label>
            <textarea className="input-field resize-none" rows={2} value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-secondary flex-1">Cancelar</button>
            <button type="submit" className="btn btn-primary flex-1">{editingId ? 'Guardar' : 'Agregar'}</button>
          </div>
        </form>
      </Modal>
    </AppLayout>
  );
}
