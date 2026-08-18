import { Router } from "express";

const router = Router();

const healthResponse = (_req: unknown, res: { json: (body: unknown) => void }) => {
  res.json({ ok: true, service: "bytecraft-os-server" });
};

router.get("/health", healthResponse);
router.get("/api/health", healthResponse);

export default router;
