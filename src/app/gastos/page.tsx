'use client';

import { useState, useMemo } from 'react';
import { Plus, Trash2, Edit2, Filter, Search } from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import Modal from '@/components/ui/Modal';
import {
  useApp,
  useUserExpenses,
  useUserExpenseCategories,
  useActiveUser,
} from '@/lib/context';
import * as store from '@/lib/store';
import { Expense } from '@/lib/types';
import { formatCurrency, formatDate, getTodayISO } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

type FormData = {
  description: string;
  amount: string;
  categoryId: string;
  date: string;
  isRecurring: boolean;
  recurringDay: string;
  notes: string;
};

const defaultForm: FormData = {
  description: '',
  amount: '',
  categoryId: '',
  date: getTodayISO(),
  isRecurring: false,
  recurringDay: '',
  notes: '',
};

export default function GastosPage() {
  const { dispatch, data } = useApp();
  const expenses = useUserExpenses();
  const categories = useUserExpenseCategories();
  const activeUser = useActiveUser();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(defaultForm);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  const filteredExpenses = useMemo(() => {
    return expenses
      .filter(e => {
        const matchesMonth = e.date.startsWith(selectedMonth);
        const matchesCategory = selectedCategory === 'all' || e.categoryId === selectedCategory;
        const matchesSearch = !searchQuery || e.description.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesMonth && matchesCategory && matchesSearch;
      })
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [expenses, selectedMonth, selectedCategory, searchQuery]);

  const totalFiltered = filteredExpenses.reduce((s, e) => s + e.amount, 0);

  function openAdd() {
    setEditingId(null);
    setForm({ ...defaultForm, categoryId: categories[0]?.id ?? '' });
    setIsModalOpen(true);
  }

  function openEdit(expense: Expense) {
    setEditingId(expense.id);
    setForm({
      description: expense.description,
      amount: String(expense.amount),
      categoryId: expense.categoryId,
      date: expense.date.split('T')[0],
      isRecurring: expense.isRecurring,
      recurringDay: String(expense.recurringDay ?? ''),
      notes: expense.notes ?? '',
    });
    setIsModalOpen(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload: Omit<Expense, 'id' | 'createdAt'> = {
      userId: data.activeUserId,
      description: form.description,
      amount: parseFloat(form.amount),
      categoryId: form.categoryId,
      date: form.date,
      isRecurring: form.isRecurring,
      recurringDay: form.isRecurring && form.recurringDay ? parseInt(form.recurringDay) : undefined,
      notes: form.notes || undefined,
    };

    if (editingId) {
      dispatch(d => store.updateExpense(d, editingId, payload));
    } else {
      dispatch(d => store.addExpense(d, payload));
    }
    setIsModalOpen(false);
  }

  function handleDelete(id: string) {
    if (confirm('¿Eliminar este gasto?')) {
      dispatch(d => store.deleteExpense(d, id));
    }
  }

  const categoryMap = Object.fromEntries(categories.map(c => [c.id, c]));

  // Group by day
  const grouped = useMemo(() => {
    const map: Record<string, Expense[]> = {};
    filteredExpenses.forEach(e => {
      const day = e.date.split('T')[0];
      if (!map[day]) map[day] = [];
      map[day].push(e);
    });
    return Object.entries(map).sort(([a], [b]) => b.localeCompare(a));
  }, [filteredExpenses]);

  return (
    <AppLayout>
      {/* Header */}
      <div className="flex items-start justify-between mb-6 fade-in">
        <div>
          <h1 className="text-2xl font-bold text-white">Gastos</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {filteredExpenses.length} registros · {formatCurrency(totalFiltered)}
          </p>
        </div>
        <button onClick={openAdd} className="btn btn-primary">
          <Plus size={16} />
          Agregar
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            className="input-field pl-9"
            placeholder="Buscar gastos..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
        <input
          type="month"
          className="input-field w-auto"
          value={selectedMonth}
          onChange={e => setSelectedMonth(e.target.value)}
        />
        <select
          className="input-field w-auto"
          value={selectedCategory}
          onChange={e => setSelectedCategory(e.target.value)}
        >
          <option value="all">Todas las categorías</option>
          {categories.map(c => (
            <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
          ))}
        </select>
      </div>

      {/* Category summary pills */}
      <div className="flex gap-2 flex-wrap mb-6">
        {categories.map(cat => {
          const total = filteredExpenses.filter(e => e.categoryId === cat.id).reduce((s, e) => s + e.amount, 0);
          if (!total) return null;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(selectedCategory === cat.id ? 'all' : cat.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all"
              style={{
                background: selectedCategory === cat.id ? `${cat.color}33` : '#ffffff08',
                border: `1px solid ${selectedCategory === cat.id ? cat.color + '55' : '#ffffff0a'}`,
                color: selectedCategory === cat.id ? cat.color : '#64748b',
              }}
            >
              <span>{cat.icon}</span>
              <span>{cat.name}</span>
              <span className="font-bold">{formatCurrency(total)}</span>
            </button>
          );
        })}
      </div>

      {/* Expense list */}
      {grouped.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <p className="text-4xl mb-3">📭</p>
          <p className="text-slate-400 font-medium">Sin gastos registrados</p>
          <p className="text-slate-600 text-sm mt-1">Haz clic en "Agregar" para registrar tu primer gasto</p>
        </div>
      ) : (
        <div className="space-y-6">
          {grouped.map(([day, dayExpenses]) => (
            <div key={day}>
              <div className="flex items-center gap-3 mb-3">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider capitalize">
                  {format(parseISO(day), "EEEE, d 'de' MMMM", { locale: es })}
                </p>
                <div className="flex-1 h-px bg-white/5" />
                <p className="text-xs text-slate-500 font-medium">
                  {formatCurrency(dayExpenses.reduce((s, e) => s + e.amount, 0))}
                </p>
              </div>
              <div className="space-y-2">
                {dayExpenses.map(expense => {
                  const cat = categoryMap[expense.categoryId];
                  return (
                    <div
                      key={expense.id}
                      className="glass-card p-4 flex items-center gap-4 group hover:border-white/10 transition-all"
                    >
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0"
                        style={{ background: `${cat?.color ?? '#6366f1'}22` }}
                      >
                        {cat?.icon ?? '📦'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{expense.description}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span
                            className="text-[11px] font-medium px-1.5 py-0.5 rounded-full"
                            style={{ background: `${cat?.color ?? '#6366f1'}22`, color: cat?.color ?? '#6366f1' }}
                          >
                            {cat?.name ?? 'Sin categoría'}
                          </span>
                          {expense.isRecurring && (
                            <span className="text-[11px] text-slate-500">🔄 Recurrente</span>
                          )}
                        </div>
                      </div>
                      <p className="text-sm font-bold text-white shrink-0">{formatCurrency(expense.amount)}</p>
                      <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                        <button
                          onClick={() => openEdit(expense)}
                          className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          onClick={() => handleDelete(expense.id)}
                          className="p-1.5 rounded-lg hover:bg-red-500/20 text-slate-400 hover:text-red-400"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingId ? 'Editar Gasto' : 'Nuevo Gasto'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs text-slate-400 mb-1.5 block">Descripción *</label>
            <input
              className="input-field"
              placeholder="Ej: Almuerzo en restaurante"
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-400 mb-1.5 block">Monto *</label>
              <input
                className="input-field"
                type="number"
                placeholder="0.00"
                min="0"
                step="0.01"
                value={form.amount}
                onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                required
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1.5 block">Fecha *</label>
              <input
                className="input-field"
                type="date"
                value={form.date}
                onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                required
              />
            </div>
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1.5 block">Categoría *</label>
            <select
              className="input-field"
              value={form.categoryId}
              onChange={e => setForm(f => ({ ...f, categoryId: e.target.value }))}
              required
            >
              <option value="">Seleccionar categoría</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isRecurring}
                onChange={e => setForm(f => ({ ...f, isRecurring: e.target.checked }))}
                className="w-4 h-4 rounded accent-indigo-500"
              />
              <span className="text-sm text-slate-300">Es un gasto recurrente</span>
            </label>
          </div>
          {form.isRecurring && (
            <div>
              <label className="text-xs text-slate-400 mb-1.5 block">Día del mes (1-31)</label>
              <input
                className="input-field"
                type="number"
                min="1"
                max="31"
                placeholder="Ej: 15"
                value={form.recurringDay}
                onChange={e => setForm(f => ({ ...f, recurringDay: e.target.value }))}
              />
            </div>
          )}
          <div>
            <label className="text-xs text-slate-400 mb-1.5 block">Notas</label>
            <textarea
              className="input-field resize-none"
              rows={2}
              placeholder="Notas opcionales..."
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-secondary flex-1">
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary flex-1">
              {editingId ? 'Guardar cambios' : 'Agregar gasto'}
            </button>
          </div>
        </form>
      </Modal>
    </AppLayout>
  );
}
