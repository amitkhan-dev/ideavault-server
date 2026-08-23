import { Router } from 'express';
import { toNodeHandler } from 'better-auth/node';
import { getAuth } from '../lib/auth.js';

const router = Router();

// Better Auth All Routes Handler
router.use((req, res, next) => {
  return toNodeHandler(getAuth())(req, res, next);
});

export default router;