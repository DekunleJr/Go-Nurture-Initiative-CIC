/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    // Server-side proxy target for /api requests. Read from API_PROXY_ORIGIN
    // (a server-only env var), NOT from NEXT_PUBLIC_API_URL — in same-origin
    // production setups NEXT_PUBLIC_API_URL is "/" and using it here would
    // make the rewrite forward to itself. All env vars are resolved at build
    // time for the rewrite table, so changing API_PROXY_ORIGIN requires a
    // rebuild/redeploy.
    const origin = (process.env.API_PROXY_ORIGIN || "http://localhost:8000")
      .replace(/\/$/, "")
      .replace(/\/api$/, "");

    return [
      {
        source: "/api/:path*",
        destination: `${origin}/api/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;