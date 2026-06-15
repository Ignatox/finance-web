'use client';

import { formatCurrency } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: number;
  subtitle?: string;
  trend?: number;
  icon?: string;
  color?: string;
  glowClass?: string;
  isCurrency?: boolean;
}

export default function StatCard({
  title,
  value,
  subtitle,
  trend,
  icon,
  color = '#6366f1',
  glowClass = 'stat-glow-purple',
  isCurrency = true,
}: StatCardProps) {
  const TrendIcon = trend === undefined ? null : trend > 0 ? TrendingUp : trend < 0 ? TrendingDown : Minus;
  const trendColor = trend === undefined ? '' : trend > 0 ? '#22c55e' : trend < 0 ? '#ef4444' : '#64748b';

  return (
    <div className={`glass-card p-5 ${glowClass} fade-in`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">{title}</p>
          <p className="text-2xl font-bold text-white">
            {isCurrency ? formatCurrency(value) : value.toLocaleString('es-AR')}
          </p>
          {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
        </div>
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
          style={{ background: `${color}22` }}
        >
          {icon}
        </div>
      </div>

      {TrendIcon && trend !== undefined && (
        <div className="mt-3 flex items-center gap-1.5">
          <TrendIcon size={13} style={{ color: trendColor }} />
          <span className="text-xs font-medium" style={{ color: trendColor }}>
            {Math.abs(trend).toFixed(1)}% vs mes anterior
          </span>
        </div>
      )}
    </div>
  );
}
