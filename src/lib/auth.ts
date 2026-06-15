// ============================================================
// Authentication Module – Client-side only
// Passwords are SHA-256 hashed with a salt. Never stored raw.
// ============================================================

const SALT = 'financeapp_salt_x9k';
const SESSION_KEY = 'financeapp_session';
const SESSION_DURATION_MS = 8 * 60 * 60 * 1000; // 8 hours

// Pre-computed hashes: SHA-256(password + SALT)
const CREDENTIALS: Record<string, { hash: string; userId: string; displayName: string }> = {
  julita: {
    hash: '5523d05141f604d86ac6ba43500d7acf4027deb36e62304362187048be9c6b11',
    userId: 'user1',
    displayName: 'Julita',
  },
  ignato: {
    hash: '0bbeb84f0a83061658930af786ed3bdfb6d0bc37f585ed90f0bf837aa6bdea58',
    userId: 'user2',
    displayName: 'Ignato',
  },
};

export interface Session {
  username: string;
  userId: string;
  displayName: string;
  expiresAt: number;
}

// ─── Hashing ────────────────────────────────────────────────

export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + SALT);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// ─── Login / Logout ─────────────────────────────────────────

export async function login(
  username: string,
  password: string
): Promise<{ success: true; session: Session } | { success: false; error: string }> {
  const normalizedUsername = username.trim().toLowerCase();
  const credential = CREDENTIALS[normalizedUsername];

  if (!credential) {
    // Artificial delay to prevent timing attacks
    await new Promise(r => setTimeout(r, 600 + Math.random() * 400));
    return { success: false, error: 'Usuario o contraseña incorrectos.' };
  }

  const inputHash = await hashPassword(password);

  if (inputHash !== credential.hash) {
    await new Promise(r => setTimeout(r, 600 + Math.random() * 400));
    return { success: false, error: 'Usuario o contraseña incorrectos.' };
  }

  const session: Session = {
    username: normalizedUsername,
    userId: credential.userId,
    displayName: credential.displayName,
    expiresAt: Date.now() + SESSION_DURATION_MS,
  };

  sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return { success: true, session };
}

export function logout(): void {
  sessionStorage.removeItem(SESSION_KEY);
}

// ─── Session helpers ─────────────────────────────────────────

export function getSession(): Session | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const session: Session = JSON.parse(raw);
    if (Date.now() > session.expiresAt) {
      sessionStorage.removeItem(SESSION_KEY);
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

export function isAuthenticated(): boolean {
  return getSession() !== null;
}

// Renew session on activity
export function renewSession(): void {
  const session = getSession();
  if (session) {
    session.expiresAt = Date.now() + SESSION_DURATION_MS;
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  }
}
