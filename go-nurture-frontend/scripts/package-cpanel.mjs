// Assembles ./deploy: everything you upload to the cPanel "Node.js App" folder.
//   npm run package:cpanel   ->  builds, then creates ./deploy (and deploy.zip if `zip`/tar is available)
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { execSync } from "node:child_process";
import path from "node:path";

const root = process.cwd();
const standalone = path.join(root, ".next", "standalone");
const out = path.join(root, "deploy");

if (!existsSync(path.join(standalone, "server.js"))) {
  console.error("Missing .next/standalone/server.js - run `npm run build` first.");
  process.exit(1);
}

// Guard: NEXT_PUBLIC_* values are baked into the browser bundle at build time.
// A leftover local .env.local (API on localhost:8000 / old Render URL) would
// silently break the production site.
function scan(dir) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) scan(p);
    else if (/\.(js|html)$/.test(e.name)) {
      const text = readFileSync(p, "utf8");
      for (const bad of ["localhost:8000", "onrender.com"]) {
        if (text.includes(bad)) {
          console.error(
            `\nBuild contains "${bad}" (${path.relative(root, p)}).\n` +
              `Create .env.production.local with NEXT_PUBLIC_API_URL=/ and NEXT_PUBLIC_SITE_URL=https://your-domain, then rebuild.`,
          );
          process.exit(1);
        }
      }
    }
  }
}
scan(path.join(root, ".next", "static"));

rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });

// 1. The self-contained server (server.js, package.json, minimal node_modules, drizzle/ migrations)
cpSync(standalone, out, { recursive: true });
// 2. Static assets and public files are NOT copied by Next into standalone
cpSync(path.join(root, ".next", "static"), path.join(out, ".next", "static"), { recursive: true });
cpSync(path.join(root, "public"), path.join(out, "public"), { recursive: true });
// 3. Migrations (also traced into standalone, copied explicitly to be safe)
cpSync(path.join(root, "drizzle"), path.join(out, "drizzle"), { recursive: true });

// Never ship secrets or local env files.
for (const f of [".env", ".env.local", ".env.production"]) rmSync(path.join(out, f), { force: true });

// Passenger (used by cPanel) starts the app via a plain startup file.
writeFileSync(
  path.join(out, "app.js"),
  `// cPanel "Application startup file". Delegates to the Next.js standalone server.\nrequire("./server.js");\n`,
);

console.log(`\nCreated ${out}`);
try {
  const zip = path.join(root, "deploy.zip");
  rmSync(zip, { force: true });
  if (process.platform === "win32") {
    // Windows' bsdtar writes a normal zip with forward-slash paths. Use the
    // System32 copy explicitly: Git Bash's GNU tar treats "C:" as a host name.
    const tar = path.join(process.env.SystemRoot ?? "C:\\Windows", "System32", "tar.exe");
    execSync(`"${tar}" -a -c -f "${zip}" -C "${out}" .`, { stdio: "inherit" });
  } else {
    execSync(`cd "${out}" && zip -qr "${zip}" .`, { stdio: "inherit" });
  }
  console.log(`Created ${zip} - upload this to the cPanel app folder and extract it.`);
} catch {
  console.log("Could not create deploy.zip automatically; zip the contents of ./deploy yourself.");
}
