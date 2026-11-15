import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Self-contained server bundle: `.next/standalone/server.js` runs the whole
  // app (pages + the /api routes in src/server) with a minimal node_modules.
  output: "standalone",
  // The SQL migrations are read from ./drizzle at runtime, so make sure they
  // are copied into the standalone output.
  outputFileTracingIncludes: {
    "/*": ["./drizzle/**/*"],
  },
  // Shared hosting: skip the native `sharp` image optimizer (the build machine's
  // binaries would not run on the Linux server). Images are served as-is.
  images: { unoptimized: true },
  // The API lives in this app now (src/app/api/[...path] -> src/server), so
  // the old /api/* rewrite to a separate Python backend is gone.
};

export default nextConfig;
