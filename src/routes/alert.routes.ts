import { Router } from 'express';
import { AlertController } from '../controllers/alert.controller.js';
import { validateBody, validateQuery } from '../middleware/validation.js';
import { authMiddleware, companyMiddleware } from '../middleware/auth.js';
import { createAlertSchema, paginationSchema } from '../schemas/validation.js';

const router = Router();

// GET /alerts
router.get('/',
  authMiddleware,
  companyMiddleware,
  validateQuery(paginationSchema),
  AlertController.findAll
);

// POST /alerts
router.post('/',
  authMiddleware,
  companyMiddleware,
  validateBody(createAlertSchema),
  AlertController.create
);

// PUT /alerts/:id/resolve
router.put('/:id/resolve',
  authMiddleware,
  companyMiddleware,
  AlertController.resolve
);

export default router;