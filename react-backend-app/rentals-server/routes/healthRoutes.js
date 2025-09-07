import { Router } from 'express';
const router = Router();

router.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'rentals-server', ts: Date.now() });
});

export default router;