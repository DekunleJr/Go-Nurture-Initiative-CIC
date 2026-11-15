import { after } from "next/server";
import { ApiError, errorBody, matchRoute, route, type Ctx } from "./http";
import { env } from "./env";
import { processEmailQueue } from "./email";

import "./handlers/auth";
import "./handlers/public";
import "./handlers/facilitator";
import "./handlers/admin";

route("GET", "/api/health", () => ({ status: "healthy", version: "1.0.0" }));

// Hit this from a cPanel cron job to retry failed emails:
//   curl -s "https://yourdomain/api/cron/email-queue?secret=$CRON_SECRET"
route("GET", "/api/cron/email-queue", async (ctx) => {
  const secret = env.cronSecret;
  if (!secret || ctx.url.searchParams.get("secret") !== secret) throw new ApiError(401, "Unauthorized");
  return { processed: await processEmailQueue() };
});

function json(body: unknown, status: number, cookies: string[] = []) {
  const headers = new Headers({ "Content-Type": "application/json", "Cache-Control": "no-store" });
  for (const c of cookies) headers.append("Set-Cookie", c);
  return new Response(JSON.stringify(body), { status, headers });
}

export async function dispatch(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const pathname = url.pathname.replace(/\/+$/, "") || "/";
  const found = matchRoute(req.method, pathname);

  if (!found.route) {
    const status = found.pathMatched ? 405 : 404;
    return json(errorBody("HTTP_ERROR", status === 405 ? "Method Not Allowed" : "Not Found"), status);
  }

  const ctx: Ctx = { req, url, params: found.params, setCookies: [], after: [] };
  try {
    const result = await found.route.handler(ctx);
    if (ctx.after.length) {
      after(async () => {
        for (const task of ctx.after) {
          try {
            await task();
          } catch (e) {
            console.error("[after] background task failed", e);
          }
        }
      });
    }
    return json(result ?? null, found.route.status, ctx.setCookies);
  } catch (e) {
    if (e instanceof ApiError) {
      return json(errorBody(e.code, e.message, e.details), e.status, ctx.setCookies);
    }
    console.error(`[api] ${req.method} ${pathname} failed`, e);
    return json(errorBody("INTERNAL_ERROR", "Internal server error"), 500);
  }
}
