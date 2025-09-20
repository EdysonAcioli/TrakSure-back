import { Router } from 'express';
import { CompanyController } from '../controllers/company.controller.js';
import { validateBody, validateQuery } from '../middleware/validation.js';
import { authMiddleware, adminMiddleware } from '../middleware/auth.js';
import { createCompanySchema, updateCompanySchema, paginationSchema } from '../schemas/validation.js';
import { z } from 'zod';

const router = Router();

const uuidSchema = z.object({
  id: z.string().uuid('ID deve ser um UUID válido')
});

// GET /companies
router.get('/', 
  authMiddleware,
  validateQuery(paginationSchema),
  CompanyController.findAll
);

// GET /companies/:id
router.get('/:id',
  authMiddleware,
  CompanyController.findById
);

// POST /companies
router.post('/',
  authMiddleware,
  adminMiddleware,
  validateBody(createCompanySchema),
  CompanyController.create
);

// PUT /companies/:id
router.put('/:id',
  authMiddleware,
  adminMiddleware,
  validateBody(updateCompanySchema),
  CompanyController.update
);

// DELETE /companies/:id
router.delete('/:id',
  authMiddleware,
  adminMiddleware,
  CompanyController.delete
);

export default router;