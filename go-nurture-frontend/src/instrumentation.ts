export async function register() {
  // Only the Node.js server runtime talks to MySQL; skip edge and `next build`.
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  if (process.env.NEXT_PHASE === "phase-production-build") return;
  if (!process.env.DATABASE_URL) {
    console.warn("DATABASE_URL not set; skipping database startup tasks.");
    return;
  }
  const { startup } = await import("./server/startup");
  try {
    await startup();
  } catch (err) {
    console.error("Startup failed:", err);
    throw err;
  }
}
