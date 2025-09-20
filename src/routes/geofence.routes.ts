import { Router } from 'express';
import { GeofenceController } from '../controllers/geofence.controller.js';
import { validateBody, validateQuery } from '../middleware/validation.js';
import { authMiddleware, companyMiddleware } from '../middleware/auth.js';
import { createGeofenceSchema, paginationSchema } from '../schemas/validation.js';

const router = Router();

// GET /geofences
router.get('/',
  authMiddleware,
  companyMiddleware,
  validateQuery(paginationSchema),
  GeofenceController.findAll
);

// GET /geofences/:id
router.get('/:id',
  authMiddleware,
  companyMiddleware,
  GeofenceController.findById
);

// POST /geofences
router.post('/',
  authMiddleware,
  companyMiddleware,
  validateBody(createGeofenceSchema),
  GeofenceController.create
);

// PUT /geofences/:id
router.put('/:id',
  authMiddleware,
  companyMiddleware,
  GeofenceController.update
);

// DELETE /geofences/:id
router.delete('/:id',
  authMiddleware,
  companyMiddleware,
  GeofenceController.delete
);

// GET /geofences/check/location
router.get('/check/location',
  authMiddleware,
  companyMiddleware,
  GeofenceController.checkDeviceLocation
);

export default router;