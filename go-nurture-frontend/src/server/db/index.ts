import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "./schema";
import { env } from "../env";

type G = typeof globalThis & { __gnPool?: mysql.Pool };

// One pool per process, reused across hot reloads and route modules.
function getPool(): mysql.Pool {
  const g = globalThis as G;
  if (!g.__gnPool) {
    g.__gnPool = mysql.createPool({
      uri: env.databaseUrl,
      connectionLimit: env.dbPoolSize,
      timezone: "Z",
    });
  }
  return g.__gnPool;
}

let _db: ReturnType<typeof makeDb> | undefined;
function makeDb() {
  return drizzle(getPool(), { schema, mode: "default" });
}

/** Lazily created so importing this module never opens a connection at build time. */
export function getDb() {
  return (_db ??= makeDb());
}

export { schema };
