const LOGGED_IN_KEY = "logged_in";
const PARTNER_KEY = "partner";
const USER_KEY = "user";

const isBrowser = () => typeof window !== "undefined";

// The JWT itself now lives only in an httpOnly cookie set by the backend —
// it is never readable from client-side JS (mitigates token theft via XSS).
// `logged_in` here is just a UI hint so pages can redirect to /login without
// waiting on a network round trip; it grants no access on its own since the
// server still enforces auth via the cookie on every request.
export const authClient = {
  setLoggedIn(): void {
    if (isBrowser()) localStorage.setItem(LOGGED_IN_KEY, "1");
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
    localStorage.removeItem(LOGGED_IN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(PARTNER_KEY);
  },

  isLoggedIn(): boolean {
    return isBrowser() && localStorage.getItem(LOGGED_IN_KEY) === "1";
  },
};
