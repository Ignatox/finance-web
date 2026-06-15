'use client';

import { useState } from 'react';
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
  Menu,
  X,
  LogOut,
} from 'lucide-react';
import { useActiveUser } from '@/lib/context';
import { logout } from '@/lib/auth';
import UserSwitcher from './UserSwitcher';

const NAV_ITEMS = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/gastos', label: 'Gastos', icon: Receipt },
  { href: '/tarjetas', label: 'Tarjetas', icon: CreditCard },
  { href: '/ingresos', label: 'Ingresos', icon: TrendingUp },
  { href: '/ahorros', label: 'Ahorros', icon: PiggyBank },
  { href: '/inversiones', label: 'Inversiones', icon: LineChart },
  { href: '/resumen', label: 'Resumen', icon: BarChart3 },
  { href: '/configuracion', label: 'Config', icon: Settings },
];

export default function MobileNav() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const activeUser = useActiveUser();

  function handleLogout() {
    logout();
    setIsOpen(false);
    router.push('/login');
  }

  return (
    <>
      {/* Top bar */}
      <header className="md:hidden flex items-center justify-between px-4 py-3 border-b border-white/5 bg-[#0d0f16]">
        <div className="flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center text-sm"
            style={{ background: 'linear-gradient(135deg, #6366f1 0%, #ec4899 100%)' }}
          >
            💰
          </div>
          <span className="font-bold text-sm text-white">FinanceApp</span>
        </div>
        <button
          onClick={() => setIsOpen(true)}
          className="p-2 rounded-lg hover:bg-white/5 text-slate-400"
        >
          <Menu size={20} />
        </button>
      </header>

      {/* Mobile bottom tab bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 border-t border-white/5 bg-[#0d0f16] z-40 px-2 py-2">
        <div className="flex justify-around">
          {NAV_ITEMS.slice(0, 6).map(({ href, label, icon: Icon }) => {
            const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className="flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl transition-all"
                style={{ color: isActive ? activeUser?.color ?? '#6366f1' : '#4b5563' }}
              >
                <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                <span className="text-[10px] font-medium">{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Drawer */}
      {isOpen && (
        <div className="md:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/60" onClick={() => setIsOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-72 bg-[#0d0f16] border-r border-white/5 flex flex-col">
            <div className="flex items-center justify-between px-4 py-4 border-b border-white/5">
              <span className="font-bold text-white">FinanceApp</span>
              <button onClick={() => setIsOpen(false)} className="p-1 rounded-lg hover:bg-white/5 text-slate-400">
                <X size={18} />
              </button>
            </div>
            <div className="px-4 py-3 border-b border-white/5">
              <UserSwitcher />
            </div>
            <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5">
              {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
                const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href);
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setIsOpen(false)}
                    className={`nav-item ${isActive ? 'active' : ''}`}
                  >
                    <Icon size={16} />
                    <span>{label}</span>
                  </Link>
                );
              })}
            </nav>
            <div className="px-4 pb-4 pt-2 border-t border-white/5">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
              >
                <LogOut size={14} />
                Cerrar sesión
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
