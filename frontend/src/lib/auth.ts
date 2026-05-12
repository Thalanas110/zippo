import { api, type AuthApiSession, type AuthApiUser, type AuthRole } from "@/lib/api";

export type AppRole = "buyer" | "store_owner" | "driver" | "admin" | "guest";

export type StoredAuthState = {
  user: AuthApiUser;
  session: AuthApiSession;
};

export const AUTH_STORAGE_KEY = "zippo.auth.session";
export const AUTH_EVENT = "zippo:auth-changed";

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

export function readStoredAuthState(): StoredAuthState | null {
  if (!isBrowser()) return null;
  const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<StoredAuthState>;
    if (!parsed?.user?.id || !parsed?.session?.access_token) return null;
    return {
      user: parsed.user,
      session: parsed.session,
    };
  } catch {
    return null;
  }
}

export function writeStoredAuthState(state: StoredAuthState | null): void {
  if (!isBrowser()) return;
  if (!state) {
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
  } else {
    window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(state));
  }
  window.dispatchEvent(new Event(AUTH_EVENT));
}

export function getRoleFromUser(user: AuthApiUser | null): AppRole {
  if (!user) return "guest";
  const appRole = (user.app_metadata as Record<string, unknown> | undefined)?.role;
  const userRole = (user.user_metadata as Record<string, unknown> | undefined)?.role;
  const raw = String(appRole ?? userRole ?? "buyer").toLowerCase();
  if (raw === "admin") return "admin";
  if (raw === "driver") return "driver";
  if (raw === "store_owner" || raw === "seller") return "store_owner";
  return "buyer";
}

export function getNumericUserIdFromAuthUser(user: AuthApiUser | null): number {
  if (!user?.id) return 0;
  const cleaned = user.id.replace(/-/g, "");
  const slice = cleaned.slice(0, 12);
  try {
    const value = BigInt(`0x${slice}`);
    return Number((value % 1_000_000_000n) + 1n);
  } catch {
    return 0;
  }
}

export function getUserDisplayName(user: AuthApiUser | null): string {
  if (!user) return "Guest";
  const metadata = user.user_metadata as Record<string, unknown> | undefined;
  const fullName = metadata?.full_name;
  if (typeof fullName === "string" && fullName.trim()) {
    return fullName.trim();
  }
  const email = user.email ?? "";
  if (email && email.includes("@")) {
    const local = email.split("@")[0];
    const name = local.replace(/[._-]+/g, " ").trim();
    if (name) {
      return name
        .split(" ")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ");
    }
  }
  return "ZIPPO User";
}

export async function signInWithPassword(params: {
  email: string;
  password: string;
}): Promise<AuthApiUser> {
  const payload = await api.signIn(params);
  writeStoredAuthState({
    user: payload.user,
    session: payload.session,
  });
  return payload.user;
}

export async function signUpWithPassword(params: {
  email: string;
  password: string;
  role: AuthRole;
}): Promise<{ emailConfirmationRequired: boolean; signedIn: boolean; user: AuthApiUser | null }> {
  const payload = await api.signUp(params);
  const signedIn = Boolean(payload.user && payload.session);
  if (payload.user && payload.session) {
    writeStoredAuthState({
      user: payload.user,
      session: payload.session,
    });
  } else {
    writeStoredAuthState(null);
  }
  return {
    emailConfirmationRequired: payload.email_confirmation_required,
    signedIn,
    user: payload.user ?? null,
  };
}

export async function signOut(): Promise<void> {
  const stored = readStoredAuthState();
  try {
    if (stored?.session?.access_token) {
      await api.signOut(stored.session.access_token);
    }
  } finally {
    writeStoredAuthState(null);
  }
}

export async function updateCurrentUserProfile(params: {
  email?: string;
  password?: string;
  full_name?: string;
  phone?: string;
  barangay?: string;
  address_line?: string;
}): Promise<AuthApiUser> {
  const stored = readStoredAuthState();
  if (!stored?.session?.access_token) {
    throw new Error("You must be signed in to update account details.");
  }
  const updatedUser = await api.updateProfile(params);
  writeStoredAuthState({
    user: updatedUser,
    session: stored.session,
  });
  return updatedUser;
}

export async function verifyStoredSession(): Promise<StoredAuthState | null> {
  const stored = readStoredAuthState();
  if (!stored?.session?.access_token) {
    writeStoredAuthState(null);
    return null;
  }
  try {
    const verifiedUser = await api.getSessionUser(stored.session.access_token);
    const nextState: StoredAuthState = { user: verifiedUser, session: stored.session };
    writeStoredAuthState(nextState);
    return nextState;
  } catch {
    writeStoredAuthState(null);
    return null;
  }
}
