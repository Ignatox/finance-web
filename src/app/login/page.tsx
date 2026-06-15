'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Loader2, ShieldCheck, AlertCircle } from 'lucide-react';
import { login } from '@/lib/auth';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [attempts, setAttempts] = useState(0);

  const isLocked = attempts >= 5;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading || isLocked) return;

    setLoading(true);
    setError('');

    try {
      const result = await login(username, password);

      if (result.success) {
        setAttempts(0);
        // Sync the active user to the session's userId
        try {
          const raw = localStorage.getItem('financeapp_data');
          if (raw) {
            const data = JSON.parse(raw);
            data.activeUserId = result.session.userId;
            localStorage.setItem('financeapp_data', JSON.stringify(data));
          }
        } catch { /* ignore */ }
        router.push('/');
      } else {
        setAttempts(a => a + 1);
        setError(result.error);
      }
    } catch {
      setError('Error inesperado. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0b0f] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background blobs */}
      <div
        className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full opacity-10 pointer-events-none"
        style={{ background: 'radial-gradient(circle, #6366f1 0%, transparent 70%)' }}
      />
      <div
        className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full opacity-10 pointer-events-none"
        style={{ background: 'radial-gradient(circle, #ec4899 0%, transparent 70%)' }}
      />

      {/* Card */}
      <div
        className="w-full max-w-md relative fade-in"
        style={{
          background: '#12141a',
          border: '1px solid #ffffff12',
          borderRadius: '24px',
          boxShadow: '0 25px 60px rgba(0,0,0,0.5)',
        }}
      >
        {/* Top accent line */}
        <div
          className="h-1 rounded-t-[24px]"
          style={{ background: 'linear-gradient(90deg, #6366f1 0%, #ec4899 50%, #14b8a6 100%)' }}
        />

        <div className="p-8">
          {/* Logo & title */}
          <div className="text-center mb-8">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4"
              style={{ background: 'linear-gradient(135deg, #6366f1 0%, #ec4899 100%)', boxShadow: '0 8px 24px rgba(99,102,241,0.4)' }}
            >
              💰
            </div>
            <h1 className="text-2xl font-bold text-white">FinanceApp</h1>
            <p className="text-slate-500 text-sm mt-1">Ingresa con tus credenciales</p>
          </div>

          {/* Lock warning */}
          {isLocked && (
            <div className="flex items-start gap-3 p-3 rounded-xl bg-red-500/10 border border-red-500/20 mb-5">
              <AlertCircle size={16} className="text-red-400 shrink-0 mt-0.5" />
              <p className="text-xs text-red-300">
                Demasiados intentos fallidos. Recarga la página para intentar de nuevo.
              </p>
            </div>
          )}

          {/* Error */}
          {error && !isLocked && (
            <div className="flex items-start gap-3 p-3 rounded-xl bg-red-500/10 border border-red-500/20 mb-5 fade-in">
              <AlertCircle size={16} className="text-red-400 shrink-0 mt-0.5" />
              <p className="text-xs text-red-300">{error}</p>
            </div>
          )}

          {/* Attempts counter */}
          {attempts > 0 && attempts < 5 && (
            <p className="text-[11px] text-amber-400 text-center mb-4">
              Intento {attempts} de 5
            </p>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username */}
            <div>
              <label className="text-xs font-medium text-slate-400 mb-2 block">
                Usuario
              </label>
              <div className="relative">
                <input
                  id="login-username"
                  type="text"
                  autoComplete="username"
                  className="input-field pr-10"
                  placeholder="Tu nombre de usuario"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  disabled={loading || isLocked}
                  required
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">
                  👤
                </span>
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="text-xs font-medium text-slate-400 mb-2 block">
                Contraseña
              </label>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  className="input-field pr-10"
                  placeholder="••••••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  disabled={loading || isLocked}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              id="login-submit"
              disabled={loading || isLocked || !username || !password}
              className="w-full mt-2 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all duration-200"
              style={{
                background: loading || isLocked || !username || !password
                  ? '#1e2030'
                  : 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                color: loading || isLocked || !username || !password ? '#4b5563' : 'white',
                boxShadow: loading || isLocked || !username || !password
                  ? 'none'
                  : '0 4px 20px rgba(99,102,241,0.4)',
                cursor: loading || isLocked || !username || !password ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Verificando...
                </>
              ) : (
                <>
                  <ShieldCheck size={16} />
                  Iniciar sesión
                </>
              )}
            </button>
          </form>

          {/* Footer security note */}
          <div className="mt-6 pt-5 border-t border-white/5 text-center">
            <p className="text-[11px] text-slate-600 flex items-center justify-center gap-1.5">
              <ShieldCheck size={11} />
              Contraseñas protegidas con SHA-256 · Sesión de 8 hs
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
