'use client';

import { useEffect, useState, ReactNode, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { getSession, renewSession } from '@/lib/auth';

interface AuthGuardProps {
  children: ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [checked, setChecked] = useState(false);

  // Use a ref so the effect never changes its deps array size
  const pathnameRef = useRef(pathname);
  pathnameRef.current = pathname;

  // Single useEffect with a FIXED deps array — [pathname, router] always 2 elements
  useEffect(() => {
    const currentPath = pathnameRef.current;

    if (currentPath === '/login') {
      setChecked(true);
      return;
    }

    const session = getSession();
    if (!session) {
      router.replace('/login');
      return;
    }

    renewSession();
    setChecked(true);
  }, [pathname, router]); // always exactly 2 deps — no conditionals here

  // Render login page immediately without the auth splash screen
  if (pathname === '/login') {
    return <>{children}</>;
  }

  if (!checked) {
    return (
      <div className="min-h-screen bg-[#0a0b0f] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl"
            style={{ background: 'linear-gradient(135deg, #6366f1 0%, #ec4899 100%)' }}
          >
            💰
          </div>
          <div className="flex gap-1.5">
            {[0, 1, 2].map(i => (
              <div
                key={i}
                className="w-1.5 h-1.5 rounded-full bg-indigo-500"
                style={{ animation: `pulse-dot 1.2s ease-in-out ${i * 0.2}s infinite` }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
