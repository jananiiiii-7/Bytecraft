import type { NextFunction, Request, Response } from "express";
import { createClient } from "@supabase/supabase-js";
import { env } from "../utils/env";

declare global { namespace Express { interface Request { userId?: string; authToken?: string } } }
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY ?? env.SUPABASE_PUBLISHABLE_KEY;
const client = env.SUPABASE_URL && supabaseKey ? createClient(env.SUPABASE_URL, supabaseKey) : null;
export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!client) {
    if (env.BYTECRAFT_DEMO_MODE === "true" && env.NODE_ENV !== "production") { req.userId = "demo-user"; return next(); }
    return res.status(503).json({ error: "Supabase authentication is not configured" });
  }
  const token = req.header("authorization")?.replace(/^Bearer\s+/i, "");
  req.authToken = token;
  if (!token) return res.status(401).json({ error: "Authentication required" });
  const { data, error } = await client.auth.getUser(token);
  if (error || !data.user) return res.status(401).json({ error: "Invalid session" });
  req.userId = data.user.id;
  return next();
}
