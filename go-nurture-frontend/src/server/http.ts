import { ZodError, type ZodType } from "zod";

/** Error with an HTTP status. Rendered as the same shape the old FastAPI API used. */
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public code = "HTTP_ERROR",
    public details?: unknown,
  ) {
    super(message);
  }
}

export const badRequest = (m: string) => new ApiError(400, m);
export const unauthorized = (m = "Could not validate credentials") => new ApiError(401, m);
export const forbidden = (m: string) => new ApiError(403, m);
export const notFound = (m: string) => new ApiError(404, m);

export function errorBody(code: string, message: string, details?: unknown) {
  return {
    detail: message,
    error: { code, message, ...(details !== undefined ? { details } : {}) },
  };
}

export interface Ctx {
  req: Request;
  url: URL;
  params: Record<string, string>;
  /** Cookies to set on the response (name -> serialized Set-Cookie value). */
  setCookies: string[];
  /** Work to run after the response is sent (emails etc.). */
  after: Array<() => Promise<unknown>>;
}

export type Handler = (ctx: Ctx) => Promise<unknown> | unknown;

interface RouteDef {
  method: string;
  pattern: RegExp;
  keys: string[];
  handler: Handler;
  status: number;
}

const routes: RouteDef[] = [];

export function route(method: string, path: string, handler: Handler, status = 200) {
  const keys: string[] = [];
  const pattern = new RegExp(
    "^" +
      path.replace(/:([A-Za-z_]+)/g, (_m, k: string) => {
        keys.push(k);
        return "([^/]+)";
      }) +
      "/?$",
  );
  routes.push({ method, pattern, keys, handler, status });
}

export function matchRoute(method: string, pathname: string) {
  let pathMatched = false;
  for (const r of routes) {
    const m = r.pattern.exec(pathname);
    if (!m) continue;
    pathMatched = true;
    if (r.method !== method) continue;
    const params: Record<string, string> = {};
    r.keys.forEach((k, i) => (params[k] = decodeURIComponent(m[i + 1])));
    return { route: r, params };
  }
  return { route: undefined, params: {}, pathMatched };
}

/** Parse + validate a JSON body with zod; 422 on failure (matches old behaviour). */
export async function parseBody<T>(ctx: Ctx, schema: ZodType<T>): Promise<T> {
  let raw: unknown;
  try {
    raw = await ctx.req.json();
  } catch {
    throw new ApiError(422, "Request validation failed", "VALIDATION_ERROR", [
      { msg: "Body must be valid JSON" },
    ]);
  }
  const parsed = schema.safeParse(raw);
  if (!parsed.success) throw validationError(parsed.error);
  return parsed.data;
}

export function validationError(err: ZodError) {
  const details = err.issues.map((i) => ({
    loc: ["body", ...i.path],
    msg: i.message,
    type: i.code,
  }));
  const first = details[0];
  const where = first && first.loc.length > 1 ? `${first.loc.slice(1).join(".")}: ` : "";
  return new ApiError(422, first ? `${where}${first.msg}` : "Request validation failed", "VALIDATION_ERROR", details);
}

export function intParam(url: URL, name: string, def: number, min: number, max: number) {
  const raw = url.searchParams.get(name);
  const n = raw === null ? def : Number.parseInt(raw, 10);
  if (Number.isNaN(n) || n < min || n > max) {
    throw new ApiError(422, `${name} must be between ${min} and ${max}`, "VALIDATION_ERROR");
  }
  return n;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function uuidParam(value: string, label = "ID") {
  if (!UUID_RE.test(value)) throw new ApiError(422, `Invalid ${label}`, "VALIDATION_ERROR");
  return value.toLowerCase();
}
