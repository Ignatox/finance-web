'use client';

import { useState } from 'react';
import { Plus, Trash2, Edit2, User, Palette } from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import Modal from '@/components/ui/Modal';
import {
  useApp,
  useUserExpenseCategories,
  useUserIncomeCategories,
  useUserSavingsCategories,
  useActiveUser,
} from '@/lib/context';
import * as store from '@/lib/store';
import { ExpenseCategory, IncomeCategory, SavingsCategory } from '@/lib/types';

const EMOJI_OPTIONS = ['🍔','🎉','🔒','👕','📦','💳','📺','🏥','🚗','🏠','✈️','📚','🌴','💼','💻','🎯','💰','📊','⚡','🎮','🐾','🛒','💊','🍕','☕','🎵','📱','🏋️','🚴','🎨'];
const COLOR_OPTIONS = ['#6366f1','#ec4899','#14b8a6','#f59e0b','#22c55e','#ef4444','#3b82f6','#8b5cf6','#f97316','#64748b','#06b6d4','#84cc16'];

type CatType = 'expense' | 'income' | 'savings';

export default function ConfiguracionPage() {
  const { dispatch, data } = useApp();
  const expenseCats = useUserExpenseCategories();
  const incomeCats = useUserIncomeCategories();
  const savingsCats = useUserSavingsCategories();
  const activeUser = useActiveUser();

  const [tab, setTab] = useState<CatType>('expense');
  const [catModal, setcatModal] = useState(false);
  const [editCatId, setEditCatId] = useState<string | null>(null);
  const [catForm, setCatForm] = useState({ name: '', icon: '📦', color: '#6366f1', budget: '' });

  const [userModal, setUserModal] = useState(false);
  const [userForm, setUserForm] = useState({ name: '', avatar: '👤', color: '#6366f1' });
  const [editUserId, setEditUserId] = useState<string | null>(null);

  const categories: (ExpenseCategory | IncomeCategory | SavingsCategory)[] =
    tab === 'expense' ? expenseCats : tab === 'income' ? incomeCats : savingsCats;

  function openAddCat() {
    setEditCatId(null);
    setCatForm({ name: '', icon: '📦', color: '#6366f1', budget: '' });
    setcatModal(true);
  }

  function openEditCat(cat: any) {
    setEditCatId(cat.id);
    setCatForm({ name: cat.name, icon: cat.icon, color: cat.color, budget: cat.budget ? String(cat.budget) : '' });
    setcatModal(true);
  }

  function handleCatSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (tab === 'expense') {
      const payload: Omit<ExpenseCategory, 'id'> = {
        userId: data.activeUserId,
        name: catForm.name,
        icon: catForm.icon,
        color: catForm.color,
        budget: catForm.budget ? parseFloat(catForm.budget) : undefined,
      };
      if (editCatId) {
        dispatch(d => store.updateExpenseCategory(d, editCatId, payload));
      } else {
        dispatch(d => store.addExpenseCategory(d, payload));
      }
    }
    // Income/savings categories would follow same pattern
    setcatModal(false);
  }

  function handleDeleteCat(id: string) {
    if (confirm('¿Eliminar esta categoría?')) {
      if (tab === 'expense') {
        dispatch(d => store.deleteExpenseCategory(d, id));
      }
    }
  }

  function openEditUser(user: typeof data.users[0]) {
    setEditUserId(user.id);
    setUserForm({ name: user.name, avatar: user.avatar, color: user.color });
    setUserModal(true);
  }

  function handleUserSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (editUserId) {
      dispatch(d => store.updateUser(d, editUserId, userForm));
    }
    setUserModal(false);
  }

  function handleExport() {
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `financeapp_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const imported = JSON.parse(ev.target?.result as string);
        if (confirm('¿Importar estos datos? Reemplazará todos tus datos actuales.')) {
          store.saveData(imported);
          window.location.reload();
        }
      } catch {
        alert('Archivo inválido');
      }
    };
    reader.readAsText(file);
  }

  return (
    <AppLayout>
      <div className="mb-6 fade-in">
        <h1 className="text-2xl font-bold text-white">Configuración</h1>
        <p className="text-slate-500 text-sm mt-0.5">Personaliza la app según tus necesidades</p>
      </div>

      {/* Users section */}
      <div className="glass-card p-5 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <User size={16} className="text-indigo-400" />
          <h2 className="text-sm font-semibold text-white">Usuarios</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {data.users.map(user => (
            <div
              key={user.id}
              className="flex items-center gap-3 p-3 rounded-xl border transition-all"
              style={{
                background: user.id === data.activeUserId ? `${user.color}11` : '#ffffff05',
                border: `1px solid ${user.id === data.activeUserId ? user.color + '33' : '#ffffff09'}`,
              }}
            >
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-xl shrink-0"
                style={{ background: `${user.color}33` }}
              >
                {user.avatar}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-white">{user.name}</p>
                <p className="text-[11px] text-slate-500">
                  {user.id === data.activeUserId ? '● Activo ahora' : 'Inactivo'}
                </p>
              </div>
              <button
                onClick={() => openEditUser(user)}
                className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white"
              >
                <Edit2 size={13} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Categories section */}
      <div className="glass-card p-5 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Palette size={16} className="text-pink-400" />
            <h2 className="text-sm font-semibold text-white">Categorías</h2>
          </div>
          <button onClick={openAddCat} className="btn btn-secondary text-xs py-1.5 px-3">
            <Plus size={13} />
            Agregar
          </button>
        </div>

        {/* Category tabs */}
        <div className="flex gap-1 p-1 bg-white/5 rounded-xl mb-4 w-fit">
          {(['expense', 'income', 'savings'] as CatType[]).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
              style={{
                background: tab === t ? '#ffffff12' : 'transparent',
                color: tab === t ? 'white' : '#64748b',
              }}
            >
              {t === 'expense' ? '📤 Gastos' : t === 'income' ? '📥 Ingresos' : '🏦 Ahorros'}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {categories.map((cat: any) => (
            <div
              key={cat.id}
              className="flex items-center gap-2.5 p-3 rounded-xl group"
              style={{ background: `${cat.color}11`, border: `1px solid ${cat.color}22` }}
            >
              <span className="text-lg">{cat.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-white truncate">{cat.name}</p>
                {cat.budget && (
                  <p className="text-[10px] text-slate-500">${cat.budget.toLocaleString('es-AR')}/mes</p>
                )}
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                {tab === 'expense' && (
                  <button onClick={() => openEditCat(cat)} className="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-white">
                    <Edit2 size={11} />
                  </button>
                )}
                <button onClick={() => handleDeleteCat(cat.id)} className="p-1 rounded hover:bg-red-500/20 text-slate-400 hover:text-red-400">
                  <Trash2 size={11} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Data management */}
      <div className="glass-card p-5">
        <h2 className="text-sm font-semibold text-white mb-4">Gestión de Datos</h2>
        <div className="flex flex-wrap gap-3">
          <button onClick={handleExport} className="btn btn-secondary">
            📤 Exportar backup JSON
          </button>
          <label className="btn btn-secondary cursor-pointer">
            📥 Importar backup
            <input type="file" accept=".json" onChange={handleImport} className="hidden" />
          </label>
          <button
            onClick={() => {
              if (confirm('¿Borrar TODOS los datos? Esta acción no se puede deshacer.')) {
                localStorage.removeItem('financeapp_data');
                window.location.reload();
              }
            }}
            className="btn btn-danger"
          >
            🗑️ Borrar todos los datos
          </button>
        </div>
      </div>

      {/* Category Modal */}
      <Modal isOpen={catModal} onClose={() => setcatModal(false)} title={editCatId ? 'Editar Categoría' : 'Nueva Categoría'} size="sm">
        <form onSubmit={handleCatSubmit} className="space-y-4">
          <div>
            <label className="text-xs text-slate-400 mb-1.5 block">Nombre *</label>
            <input className="input-field" placeholder="Ej: Tecnología" value={catForm.name}
              onChange={e => setCatForm(f => ({ ...f, name: e.target.value }))} required />
          </div>
          {tab === 'expense' && (
            <div>
              <label className="text-xs text-slate-400 mb-1.5 block">Presupuesto mensual</label>
              <input className="input-field" type="number" min="0" placeholder="Opcional"
                value={catForm.budget} onChange={e => setCatForm(f => ({ ...f, budget: e.target.value }))} />
            </div>
          )}
          <div>
            <label className="text-xs text-slate-400 mb-2 block">Ícono</label>
            <div className="flex flex-wrap gap-1.5">
              {EMOJI_OPTIONS.map(emoji => (
                <button key={emoji} type="button"
                  onClick={() => setCatForm(f => ({ ...f, icon: emoji }))}
                  className="w-8 h-8 rounded-lg text-lg flex items-center justify-center transition-all"
                  style={{ background: catForm.icon === emoji ? '#6366f122' : '#ffffff08', border: `1px solid ${catForm.icon === emoji ? '#6366f144' : 'transparent'}` }}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-2 block">Color</label>
            <div className="flex gap-2 flex-wrap">
              {COLOR_OPTIONS.map(c => (
                <button key={c} type="button"
                  onClick={() => setCatForm(f => ({ ...f, color: c }))}
                  className="w-7 h-7 rounded-full transition-all"
                  style={{
                    background: c,
                    transform: catForm.color === c ? 'scale(1.25)' : 'scale(1)',
                    boxShadow: catForm.color === c ? `0 0 0 2px #0a0b0f, 0 0 0 4px ${c}` : 'none',
                  }}
                />
              ))}
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setcatModal(false)} className="btn btn-secondary flex-1">Cancelar</button>
            <button type="submit" className="btn btn-primary flex-1">{editCatId ? 'Guardar' : 'Crear'}</button>
          </div>
        </form>
      </Modal>

      {/* User Modal */}
      <Modal isOpen={userModal} onClose={() => setUserModal(false)} title="Editar Usuario" size="sm">
        <form onSubmit={handleUserSubmit} className="space-y-4">
          <div>
            <label className="text-xs text-slate-400 mb-1.5 block">Nombre *</label>
            <input className="input-field" value={userForm.name}
              onChange={e => setUserForm(f => ({ ...f, name: e.target.value }))} required />
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-2 block">Avatar</label>
            <div className="flex flex-wrap gap-1.5">
              {['👤','👥','🧑','👩','👨','🙋','💁','🧑‍💼','👩‍💼','👨‍💼'].map(emoji => (
                <button key={emoji} type="button"
                  onClick={() => setUserForm(f => ({ ...f, avatar: emoji }))}
                  className="w-9 h-9 rounded-lg text-xl flex items-center justify-center transition-all"
                  style={{ background: userForm.avatar === emoji ? '#6366f122' : '#ffffff08', border: `1px solid ${userForm.avatar === emoji ? '#6366f144' : 'transparent'}` }}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-2 block">Color de acento</label>
            <div className="flex gap-2 flex-wrap">
              {COLOR_OPTIONS.map(c => (
                <button key={c} type="button"
                  onClick={() => setUserForm(f => ({ ...f, color: c }))}
                  className="w-7 h-7 rounded-full transition-all"
                  style={{
                    background: c,
                    transform: userForm.color === c ? 'scale(1.25)' : 'scale(1)',
                    boxShadow: userForm.color === c ? `0 0 0 2px #0a0b0f, 0 0 0 4px ${c}` : 'none',
                  }}
                />
              ))}
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setUserModal(false)} className="btn btn-secondary flex-1">Cancelar</button>
            <button type="submit" className="btn btn-primary flex-1">Guardar</button>
          </div>
        </form>
      </Modal>
    </AppLayout>
  );
}
