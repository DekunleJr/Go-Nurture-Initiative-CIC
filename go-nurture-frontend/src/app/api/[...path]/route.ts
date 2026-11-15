import { dispatch } from "@/server/dispatch";

// Single entry point for the whole REST API; routing lives in src/server.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = (req: Request) => dispatch(req);
export const POST = (req: Request) => dispatch(req);
export const PATCH = (req: Request) => dispatch(req);
export const PUT = (req: Request) => dispatch(req);
export const DELETE = (req: Request) => dispatch(req);
