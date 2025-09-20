import { Router } from 'express';
import { LocationController } from '../controllers/location.controller.js';
import { validateBody, validateQuery } from '../middleware/validation.js';
import { authMiddleware, companyMiddleware } from '../middleware/auth.js';
import { createLocationSchema, locationQuerySchema } from '../schemas/validation.js';

const router = Router();

// GET /locations
router.get('/',
  authMiddleware,
  companyMiddleware,
  validateQuery(locationQuerySchema),
  LocationController.findAll
);

// POST /locations
router.post('/',
  validateBody(createLocationSchema),
  LocationController.create
);

// GET /locations/route
router.get('/route',
  authMiddleware,
  companyMiddleware,
  validateQuery(locationQuerySchema),
  LocationController.getRoute
);

// GET /locations/heatmap
router.get('/heatmap',
  authMiddleware,
  companyMiddleware,
  validateQuery(locationQuerySchema),
  LocationController.getHeatmap
);

export default router;