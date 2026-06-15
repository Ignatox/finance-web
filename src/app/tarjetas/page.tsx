'use client';

import { useState, useMemo } from 'react';
import { Plus, Trash2, Edit2, CreditCard as CreditCardIcon, Calendar, AlertCircle } from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import Modal from '@/components/ui/Modal';
import { useApp, useUserCards, useUserInstallments, useUserExpenseCategories, useActiveUser } from '@/lib/context';
import * as store from '@/lib/store';
import { Card, InstallmentPurchase } from '@/lib/types';
import { formatCurrency, formatDate, getTodayISO, CARD_COLORS, isDateWithinDays } from '@/lib/utils';
import { addMonths, format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

// ─── Card Form ────────────────────────────────────────────

type CardFormData = {
  name: string;
  bank: string;
  lastFour: string;
  type: 'credit' | 'debit';
  color: string;
  closingDay: string;
  dueDay: string;
  creditLimit: string;
};

const defaultCardForm: CardFormData = {
  name: '',
  bank: '',
  lastFour: '',
  type: 'credit',
  color: CARD_COLORS[0],
  closingDay: '25',
  dueDay: '5',
  creditLimit: '',
};

// ─── Installment Form ─────────────────────────────────────

type InstFormData = {
  description: string;
  totalAmount: string;
  totalInstallments: string;
  cardId: string;
  categoryId: string;
  startDate: string;
  notes: string;
};

const defaultInstForm: InstFormData = {
  description: '',
  totalAmount: '',
  totalInstallments: '12',
  cardId: '',
  categoryId: '',
  startDate: getTodayISO(),
  notes: '',
};

export default function TarjetasPage() {
  const { dispatch, data } = useApp();
  const cards = useUserCards();
  const installments = useUserInstallments();
  const categories = useUserExpenseCategories();
  const activeUser = useActiveUser();

  const [cardModal, setCardModal] = useState(false);
  const [instModal, setInstModal] = useState(false);
  const [editCardId, setEditCardId] = useState<string | null>(null);
  const [editInstId, setEditInstId] = useState<string | null>(null);
  const [cardForm, setCardForm] = useState<CardFormData>(defaultCardForm);
  const [instForm, setInstForm] = useState<InstFormData>(defaultInstForm);
  const [activeCardId, setActiveCardId] = useState<string | 'all'>('all');

  function openAddCard() {
    setEditCardId(null);
    setCardForm(defaultCardForm);
    setCardModal(true);
  }

  function openEditCard(card: Card) {
    setEditCardId(card.id);
    setCardForm({
      name: card.name,
      bank: card.bank,
      lastFour: card.lastFour,
      type: card.type,
      color: card.color,
      closingDay: String(card.closingDay),
      dueDay: String(card.dueDay),
      creditLimit: card.creditLimit ? String(card.creditLimit) : '',
    });
    setCardModal(true);
  }

  function handleCardSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload: Omit<Card, 'id'> = {
      userId: data.activeUserId,
      name: cardForm.name,
      bank: cardForm.bank,
      lastFour: cardForm.lastFour,
      type: cardForm.type,
      color: cardForm.color,
      closingDay: parseInt(cardForm.closingDay),
      dueDay: parseInt(cardForm.dueDay),
      creditLimit: cardForm.creditLimit ? parseFloat(cardForm.creditLimit) : undefined,
    };
    if (editCardId) {
      dispatch(d => store.updateCard(d, editCardId, payload));
    } else {
      dispatch(d => store.addCard(d, payload));
    }
    setCardModal(false);
  }

  function handleDeleteCard(id: string) {
    if (confirm('¿Eliminar esta tarjeta?')) {
      dispatch(d => store.deleteCard(d, id));
    }
  }

  function openAddInst(cardId?: string) {
    setEditInstId(null);
    setInstForm({
      ...defaultInstForm,
      cardId: cardId ?? cards[0]?.id ?? '',
      categoryId: categories.find(c => c.id === 'installments')?.id ?? categories[0]?.id ?? '',
    });
    setInstModal(true);
  }

  function openEditInst(inst: InstallmentPurchase) {
    setEditInstId(inst.id);
    setInstForm({
      description: inst.description,
      totalAmount: String(inst.totalAmount),
      totalInstallments: String(inst.totalInstallments),
      cardId: inst.cardId,
      categoryId: inst.categoryId,
      startDate: inst.startDate.split('T')[0],
      notes: inst.notes ?? '',
    });
    setInstModal(true);
  }

  function handleInstSubmit(e: React.FormEvent) {
    e.preventDefault();
    const total = parseFloat(instForm.totalAmount);
    const numInst = parseInt(instForm.totalInstallments);
    const instAmt = parseFloat((total / numInst).toFixed(2));
    const start = parseISO(instForm.startDate);
    const nextPaymentDate = addMonths(start, editInstId
      ? (installments.find(i => i.id === editInstId)?.paidInstallments ?? 0)
      : 0
    ).toISOString().split('T')[0];

    const payload: Omit<InstallmentPurchase, 'id' | 'createdAt'> = {
      userId: data.activeUserId,
      description: instForm.description,
      totalAmount: total,
      installmentAmount: instAmt,
      totalInstallments: numInst,
      paidInstallments: editInstId ? (installments.find(i => i.id === editInstId)?.paidInstallments ?? 0) : 0,
      cardId: instForm.cardId,
      categoryId: instForm.categoryId,
      startDate: instForm.startDate,
      nextPaymentDate,
      notes: instForm.notes || undefined,
    };

    if (editInstId) {
      dispatch(d => store.updateInstallmentPurchase(d, editInstId, payload));
    } else {
      dispatch(d => store.addInstallmentPurchase(d, payload));
    }
    setInstModal(false);
  }

  function handlePayInstallment(inst: InstallmentPurchase) {
    const newPaid = inst.paidInstallments + 1;
    const nextDate = addMonths(parseISO(inst.nextPaymentDate), 1).toISOString().split('T')[0];
    dispatch(d => store.updateInstallmentPurchase(d, inst.id, {
      paidInstallments: newPaid,
      nextPaymentDate: nextDate,
    }));
  }

  function handleDeleteInst(id: string) {
    if (confirm('¿Eliminar esta compra en cuotas?')) {
      dispatch(d => store.deleteInstallmentPurchase(d, id));
    }
  }

  const filteredInstallments = useMemo(() => {
    if (activeCardId === 'all') return installments;
    return installments.filter(i => i.cardId === activeCardId);
  }, [installments, activeCardId]);

  const cardMap = Object.fromEntries(cards.map(c => [c.id, c]));
  const catMap = Object.fromEntries(categories.map(c => [c.id, c]));

  return (
    <AppLayout>
      <div className="flex items-start justify-between mb-6 fade-in">
        <div>
          <h1 className="text-2xl font-bold text-white">Tarjetas y Cuotas</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {cards.length} tarjetas · {installments.filter(i => i.paidInstallments < i.totalInstallments).length} cuotas activas
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => openAddInst()} className="btn btn-secondary text-sm">
            <Plus size={14} />
            Cuota
          </button>
          <button onClick={openAddCard} className="btn btn-primary text-sm">
            <Plus size={14} />
            Tarjeta
          </button>
        </div>
      </div>

      {/* Cards visual */}
      <div className="mb-8">
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Mis Tarjetas</h2>
        {cards.length === 0 ? (
          <div className="glass-card p-8 text-center">
            <p className="text-4xl mb-3">💳</p>
            <p className="text-slate-400">No tenés tarjetas registradas</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {cards.map(card => {
              const cardInstallments = installments.filter(i => i.cardId === card.id && i.paidInstallments < i.totalInstallments);
              const monthlyTotal = cardInstallments.reduce((s, i) => s + i.installmentAmount, 0);
              const upcomingDue = isDateWithinDays(
                new Date(new Date().getFullYear(), new Date().getMonth(), card.dueDay).toISOString(),
                7
              );
              return (
                <div
                  key={card.id}
                  className="relative rounded-2xl p-5 cursor-pointer transition-all hover:scale-[1.02]"
                  style={{
                    background: `linear-gradient(135deg, ${card.color}cc 0%, ${card.color}66 100%)`,
                    border: `1px solid ${card.color}44`,
                    boxShadow: `0 8px 32px ${card.color}22`,
                  }}
                  onClick={() => setActiveCardId(activeCardId === card.id ? 'all' : card.id)}
                >
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <p className="font-bold text-white text-sm">{card.name}</p>
                      <p className="text-white/60 text-xs">{card.bank}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="badge bg-white/20 text-white text-[10px]">
                        {card.type === 'credit' ? 'Crédito' : 'Débito'}
                      </span>
                      <button
                        onClick={e => { e.stopPropagation(); openEditCard(card); }}
                        className="p-1 rounded-lg bg-white/10 hover:bg-white/20 text-white"
                      >
                        <Edit2 size={12} />
                      </button>
                      <button
                        onClick={e => { e.stopPropagation(); handleDeleteCard(card.id); }}
                        className="p-1 rounded-lg bg-white/10 hover:bg-red-500/40 text-white"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                  <p className="text-white/60 text-xs tracking-widest mb-1">•••• •••• •••• {card.lastFour}</p>
                  <div className="flex items-end justify-between mt-4">
                    <div>
                      <p className="text-white/60 text-[10px]">Cuotas mensuales</p>
                      <p className="text-white font-bold">{formatCurrency(monthlyTotal)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-white/60 text-[10px]">Vence día {card.dueDay}</p>
                      {upcomingDue && (
                        <div className="flex items-center gap-1 text-amber-300 text-[10px]">
                          <AlertCircle size={10} />
                          <span>Próximo vencimiento</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            <button
              onClick={openAddCard}
              className="rounded-2xl p-5 border-2 border-dashed border-white/10 hover:border-white/20 flex items-center justify-center gap-3 text-slate-500 hover:text-slate-400 transition-all"
            >
              <Plus size={20} />
              <span className="text-sm font-medium">Agregar tarjeta</span>
            </button>
          </div>
        )}
      </div>

      {/* Installments */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
            Compras en Cuotas
            {activeCardId !== 'all' && (
              <button onClick={() => setActiveCardId('all')} className="ml-2 text-indigo-400 normal-case font-normal text-xs">
                (Ver todas)
              </button>
            )}
          </h2>
          <button onClick={() => openAddInst()} className="btn btn-secondary text-xs py-1.5 px-3">
            <Plus size={13} />
            Nueva cuota
          </button>
        </div>

        {filteredInstallments.length === 0 ? (
          <div className="glass-card p-8 text-center">
            <p className="text-4xl mb-3">📋</p>
            <p className="text-slate-400">Sin compras en cuotas</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredInstallments.map(inst => {
              const card = cardMap[inst.cardId];
              const cat = catMap[inst.categoryId];
              const remaining = inst.totalInstallments - inst.paidInstallments;
              const progress = (inst.paidInstallments / inst.totalInstallments) * 100;
              const remainingAmount = remaining * inst.installmentAmount;
              const isAlmostDue = isDateWithinDays(inst.nextPaymentDate, 7);

              return (
                <div key={inst.id} className="glass-card p-4 group">
                  <div className="flex items-start gap-4">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0"
                      style={{ background: `${cat?.color ?? '#6366f1'}22` }}
                    >
                      {cat?.icon ?? '💳'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium text-white truncate">{inst.description}</p>
                        <div className="flex items-center gap-2 shrink-0">
                          {isAlmostDue && remaining > 0 && (
                            <span className="badge bg-amber-500/20 text-amber-400 text-[10px]">
                              ¡Vence pronto!
                            </span>
                          )}
                          <p className="text-sm font-bold text-white">{formatCurrency(inst.installmentAmount)}/mes</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        {card && (
                          <span
                            className="text-[11px] font-medium flex items-center gap-1"
                            style={{ color: card.color }}
                          >
                            <CreditCardIcon size={10} />
                            {card.name}
                          </span>
                        )}
                        <span className="text-[11px] text-slate-500">
                          Cuota {inst.paidInstallments + 1}/{inst.totalInstallments}
                        </span>
                        {remaining > 0 && (
                          <span className="text-[11px] text-slate-500 flex items-center gap-1">
                            <Calendar size={10} />
                            {formatDate(inst.nextPaymentDate)}
                          </span>
                        )}
                      </div>
                      <div className="mt-2">
                        <div className="progress-bar-track">
                          <div
                            className="progress-bar-fill"
                            style={{
                              width: `${progress}%`,
                              background: `linear-gradient(90deg, ${card?.color ?? '#6366f1'} 0%, ${card?.color ?? '#6366f1'}99 100%)`,
                            }}
                          />
                        </div>
                        <div className="flex justify-between mt-1">
                          <p className="text-[10px] text-slate-500">
                            Pagado: {formatCurrency(inst.paidInstallments * inst.installmentAmount)}
                          </p>
                          <p className="text-[10px] text-slate-500">
                            Restante: {formatCurrency(remainingAmount)}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      {remaining > 0 && (
                        <button
                          onClick={() => handlePayInstallment(inst)}
                          className="text-[11px] px-2.5 py-1.5 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 font-medium"
                        >
                          ✓ Pagué
                        </button>
                      )}
                      <button
                        onClick={() => openEditInst(inst)}
                        className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white"
                      >
                        <Edit2 size={12} />
                      </button>
                      <button
                        onClick={() => handleDeleteInst(inst.id)}
                        className="p-1.5 rounded-lg hover:bg-red-500/20 text-slate-400 hover:text-red-400"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                  {remaining === 0 && (
                    <div className="mt-2 text-center text-[11px] text-green-400 font-medium">
                      ✅ Completamente pagada
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Card Modal */}
      <Modal isOpen={cardModal} onClose={() => setCardModal(false)} title={editCardId ? 'Editar Tarjeta' : 'Nueva Tarjeta'}>
        <form onSubmit={handleCardSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-400 mb-1.5 block">Nombre *</label>
              <input className="input-field" placeholder="Ej: Visa Personal" value={cardForm.name}
                onChange={e => setCardForm(f => ({ ...f, name: e.target.value }))} required />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1.5 block">Banco *</label>
              <input className="input-field" placeholder="Ej: Galicia" value={cardForm.bank}
                onChange={e => setCardForm(f => ({ ...f, bank: e.target.value }))} required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-400 mb-1.5 block">Últimos 4 dígitos</label>
              <input className="input-field" placeholder="1234" maxLength={4} value={cardForm.lastFour}
                onChange={e => setCardForm(f => ({ ...f, lastFour: e.target.value.replace(/\D/g, '') }))} />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1.5 block">Tipo</label>
              <select className="input-field" value={cardForm.type}
                onChange={e => setCardForm(f => ({ ...f, type: e.target.value as 'credit' | 'debit' }))}>
                <option value="credit">Crédito</option>
                <option value="debit">Débito</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-400 mb-1.5 block">Día de cierre</label>
              <input className="input-field" type="number" min="1" max="31" value={cardForm.closingDay}
                onChange={e => setCardForm(f => ({ ...f, closingDay: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1.5 block">Día de vencimiento</label>
              <input className="input-field" type="number" min="1" max="31" value={cardForm.dueDay}
                onChange={e => setCardForm(f => ({ ...f, dueDay: e.target.value }))} />
            </div>
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1.5 block">Límite de crédito</label>
            <input className="input-field" type="number" placeholder="Opcional" value={cardForm.creditLimit}
              onChange={e => setCardForm(f => ({ ...f, creditLimit: e.target.value }))} />
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-2 block">Color</label>
            <div className="flex gap-2 flex-wrap">
              {CARD_COLORS.map(c => (
                <button key={c} type="button"
                  onClick={() => setCardForm(f => ({ ...f, color: c }))}
                  className="w-7 h-7 rounded-full transition-all"
                  style={{
                    background: c,
                    transform: cardForm.color === c ? 'scale(1.25)' : 'scale(1)',
                    boxShadow: cardForm.color === c ? `0 0 0 2px #0a0b0f, 0 0 0 4px ${c}` : 'none',
                  }}
                />
              ))}
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setCardModal(false)} className="btn btn-secondary flex-1">Cancelar</button>
            <button type="submit" className="btn btn-primary flex-1">{editCardId ? 'Guardar' : 'Agregar'}</button>
          </div>
        </form>
      </Modal>

      {/* Installment Modal */}
      <Modal isOpen={instModal} onClose={() => setInstModal(false)} title={editInstId ? 'Editar Cuota' : 'Nueva Compra en Cuotas'}>
        <form onSubmit={handleInstSubmit} className="space-y-4">
          <div>
            <label className="text-xs text-slate-400 mb-1.5 block">Descripción *</label>
            <input className="input-field" placeholder="Ej: Notebook Samsung" value={instForm.description}
              onChange={e => setInstForm(f => ({ ...f, description: e.target.value }))} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-400 mb-1.5 block">Monto total *</label>
              <input className="input-field" type="number" min="0" step="0.01" placeholder="0.00"
                value={instForm.totalAmount}
                onChange={e => setInstForm(f => ({ ...f, totalAmount: e.target.value }))} required />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1.5 block">Cantidad de cuotas *</label>
              <input className="input-field" type="number" min="1" max="60" value={instForm.totalInstallments}
                onChange={e => setInstForm(f => ({ ...f, totalInstallments: e.target.value }))} required />
            </div>
          </div>
          {instForm.totalAmount && instForm.totalInstallments && (
            <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-center">
              <p className="text-indigo-400 text-sm font-semibold">
                {formatCurrency(parseFloat(instForm.totalAmount) / parseInt(instForm.totalInstallments))} / mes
              </p>
            </div>
          )}
          <div>
            <label className="text-xs text-slate-400 mb-1.5 block">Tarjeta *</label>
            <select className="input-field" value={instForm.cardId}
              onChange={e => setInstForm(f => ({ ...f, cardId: e.target.value }))} required>
              <option value="">Seleccionar tarjeta</option>
              {cards.map(c => <option key={c.id} value={c.id}>{c.name} - {c.bank}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1.5 block">Categoría</label>
            <select className="input-field" value={instForm.categoryId}
              onChange={e => setInstForm(f => ({ ...f, categoryId: e.target.value }))}>
              <option value="">Sin categoría</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1.5 block">Fecha de inicio *</label>
            <input className="input-field" type="date" value={instForm.startDate}
              onChange={e => setInstForm(f => ({ ...f, startDate: e.target.value }))} required />
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1.5 block">Notas</label>
            <textarea className="input-field resize-none" rows={2} value={instForm.notes}
              onChange={e => setInstForm(f => ({ ...f, notes: e.target.value }))} />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setInstModal(false)} className="btn btn-secondary flex-1">Cancelar</button>
            <button type="submit" className="btn btn-primary flex-1">{editInstId ? 'Guardar' : 'Agregar'}</button>
          </div>
        </form>
      </Modal>
    </AppLayout>
  );
}
