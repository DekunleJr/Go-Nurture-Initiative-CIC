const TOKEN_KEY = "access_token";
const PARTNER_KEY = "partner";
const USER_KEY = "user";

const isBrowser = () => typeof window !== "undefined";

export const authClient = {
  getToken(): string | null {
    return isBrowser() ? localStorage.getItem(TOKEN_KEY) : null;
  },

  setToken(token: string): void {
    if (isBrowser()) localStorage.setItem(TOKEN_KEY, token);
  },

  setUser(user: unknown): void {
    if (isBrowser()) localStorage.setItem(USER_KEY, JSON.stringify(user));
  },

  setPartner(partner: unknown): void {
    if (isBrowser()) localStorage.setItem(PARTNER_KEY, JSON.stringify(partner));
  },

  getUser<T>(): T | null {
    if (!isBrowser()) return null;
    const user = localStorage.getItem(USER_KEY);
    return user ? (JSON.parse(user) as T) : null;
  },

  clear(): void {
    if (!isBrowser()) return;
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(PARTNER_KEY);
  },

  isAuthenticated(): boolean {
    return Boolean(this.getToken());
  },
};
