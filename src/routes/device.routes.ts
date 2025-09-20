import { Router } from 'express';
import { DeviceController } from '../controllers/device.controller.js';
import { validateBody, validateQuery } from '../middleware/validation.js';
import { authMiddleware, companyMiddleware } from '../middleware/auth.js';
import { createDeviceSchema, updateDeviceSchema, deviceQuerySchema, locationQuerySchema } from '../schemas/validation.js';
import { z } from 'zod';

const router = Router();

const uuidSchema = z.object({
  id: z.string().uuid('ID deve ser um UUID válido')
});

// GET /devices
router.get('/',
  authMiddleware,
  companyMiddleware,
  validateQuery(deviceQuerySchema),
  DeviceController.findAll
);

// GET /devices/:id
router.get('/:id',
  authMiddleware,
  companyMiddleware,
  DeviceController.findById
);

// POST /devices
router.post('/',
  authMiddleware,
  companyMiddleware,
  validateBody(createDeviceSchema),
  DeviceController.create
);

// PUT /devices/:id
router.put('/:id',
  authMiddleware,
  companyMiddleware,
  validateBody(updateDeviceSchema),
  DeviceController.update
);

// DELETE /devices/:id
router.delete('/:id',
  authMiddleware,
  companyMiddleware,
  DeviceController.delete
);

// GET /devices/:id/locations
router.get('/:id/locations',
  authMiddleware,
  companyMiddleware,
  validateQuery(locationQuerySchema),
  DeviceController.getLocations
);

// GET /devices/:id/latest-location
router.get('/:id/latest-location',
  authMiddleware,
  companyMiddleware,
  DeviceController.getLatestLocation
);

export default router;