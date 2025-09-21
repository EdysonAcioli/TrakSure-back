import { Router } from "express";
import { CompanyController } from "../controllers/company.controller.js";
import { validateBody, validateQuery } from "../middleware/validation.js";
import { authMiddleware, adminMiddleware } from "../middleware/auth.js";
import {
  createCompanySchema,
  updateCompanySchema,
  paginationSchema,
} from "../schemas/validation.js";
import { z } from "zod";

const router = Router();

const uuidSchema = z.object({
  id: z.string().uuid("ID deve ser um UUID válido"),
});

/**
 * @swagger
 * /companies:
 *   get:
 *     tags: [Empresas]
 *     summary: Listar empresas
 *     description: Retorna lista paginada de empresas
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Número da página
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Itens por página
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Buscar por nome ou email
 *     responses:
 *       200:
 *         description: Lista de empresas
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/PaginatedResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Company'
 */
router.get(
  "/",
  authMiddleware,
  validateQuery(paginationSchema),
  CompanyController.findAll
);

/**
 * @swagger
 * /companies/{id}:
 *   get:
 *     tags: [Empresas]
 *     summary: Obter empresa por ID
 *     description: Retorna dados de uma empresa específica
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID da empresa
 *     responses:
 *       200:
 *         description: Dados da empresa
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Company'
 *       404:
 *         description: Empresa não encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get("/:id", authMiddleware, CompanyController.findById);

/**
 * @swagger
 * /companies:
 *   post:
 *     tags: [Empresas]
 *     summary: Criar nova empresa
 *     description: Cria uma nova empresa (apenas administradores)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *             properties:
 *               name:
 *                 type: string
 *                 example: Empresa XYZ Ltda
 *               email:
 *                 type: string
 *                 format: email
 *                 example: contato@empresa.com
 *               phone:
 *                 type: string
 *                 example: (11) 99999-9999
 *               address:
 *                 type: string
 *                 example: Rua das Flores, 123
 *               cnpj:
 *                 type: string
 *                 example: 12.345.678/0001-90
 *               isActive:
 *                 type: boolean
 *                 default: true
 *                 example: true
 *     responses:
 *       201:
 *         description: Empresa criada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Company'
 *       403:
 *         description: Acesso negado (apenas administradores)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post(
  "/",
  authMiddleware,
  adminMiddleware,
  validateBody(createCompanySchema),
  CompanyController.create
);

/**
 * @swagger
 * /companies/{id}:
 *   put:
 *     tags: [Empresas]
 *     summary: Atualizar empresa
 *     description: Atualiza dados de uma empresa (apenas administradores)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID da empresa
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: Empresa XYZ Ltda
 *               email:
 *                 type: string
 *                 format: email
 *                 example: contato@empresa.com
 *               phone:
 *                 type: string
 *                 example: (11) 99999-9999
 *               address:
 *                 type: string
 *                 example: Rua das Flores, 123
 *               cnpj:
 *                 type: string
 *                 example: 12.345.678/0001-90
 *               isActive:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       200:
 *         description: Empresa atualizada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Company'
 *       404:
 *         description: Empresa não encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put(
  "/:id",
  authMiddleware,
  adminMiddleware,
  validateBody(updateCompanySchema),
  CompanyController.update
);

/**
 * @swagger
 * /companies/{id}:
 *   delete:
 *     tags: [Empresas]
 *     summary: Excluir empresa
 *     description: Remove uma empresa do sistema (apenas administradores)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID da empresa
 *     responses:
 *       200:
 *         description: Empresa excluída com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Empresa excluída com sucesso
 *       404:
 *         description: Empresa não encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete(
  "/:id",
  authMiddleware,
  adminMiddleware,
  CompanyController.delete
);

export default router;
