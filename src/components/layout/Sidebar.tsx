'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Receipt,
  CreditCard,
  TrendingUp,
  PiggyBank,
  LineChart,
  Settings,
  BarChart3,
  LogOut,
} from 'lucide-react';
import { useApp, useActiveUser } from '@/lib/context';
import { logout, getSession } from '@/lib/auth';
import UserSwitcher from './UserSwitcher';

const NAV_ITEMS = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/gastos', label: 'Gastos', icon: Receipt },
  { href: '/tarjetas', label: 'Tarjetas', icon: CreditCard },
  { href: '/ingresos', label: 'Ingresos', icon: TrendingUp },
  { href: '/ahorros', label: 'Ahorros', icon: PiggyBank },
  { href: '/inversiones', label: 'Inversiones', icon: LineChart },
  { href: '/resumen', label: 'Resumen', icon: BarChart3 },
  { href: '/configuracion', label: 'Configuración', icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const activeUser = useActiveUser();
  const session = getSession();

  function handleLogout() {
    logout();
    router.push('/login');
  }

  return (
    <aside className="hidden md:flex flex-col w-64 h-full border-r border-white/5 bg-[#0d0f16] shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-white/5">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center text-lg font-bold"
          style={{ background: 'linear-gradient(135deg, #6366f1 0%, #ec4899 100%)' }}
        >
          💰
        </div>
        <div>
          <p className="font-bold text-sm text-white leading-tight">FinanceApp</p>
          <p className="text-[11px] text-slate-500">Finanzas Personales</p>
        </div>
      </div>

      {/* User switcher */}
      <div className="px-4 py-3 border-b border-white/5">
        <UserSwitcher />
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`nav-item ${isActive ? 'active' : ''}`}
            >
              <Icon size={16} strokeWidth={isActive ? 2.5 : 2} />
              <span>{label}</span>
              {isActive && (
                <div
                  className="ml-auto w-1.5 h-1.5 rounded-full"
                  style={{ background: activeUser?.color ?? '#6366f1' }}
                />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom user info + logout */}
      <div className="px-4 py-4 border-t border-white/5 space-y-2">
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0"
            style={{ background: activeUser?.color ?? '#6366f1', opacity: 0.9 }}
          >
            {activeUser?.avatar}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-white truncate">{session?.displayName ?? activeUser?.name}</p>
            <p className="text-[11px] text-slate-500 truncate">@{session?.username}</p>
          </div>
          <div className="w-2 h-2 rounded-full bg-green-500 pulse-dot shrink-0" />
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
        >
          <LogOut size={13} />
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
