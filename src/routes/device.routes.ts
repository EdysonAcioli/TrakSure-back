import { Router } from "express";
import { DeviceController } from "../controllers/device.controller.js";
import { validateBody, validateQuery } from "../middleware/validation.js";
import { authMiddleware, companyMiddleware } from "../middleware/auth.js";
import {
  createDeviceSchema,
  updateDeviceSchema,
  deviceQuerySchema,
  locationQuerySchema,
} from "../schemas/validation.js";
import { z } from "zod";

const router = Router();

const uuidSchema = z.object({
  id: z.string().uuid("ID deve ser um UUID válido"),
});

/**
 * @swagger
 * /devices:
 *   get:
 *     tags: [Dispositivos]
 *     summary: Listar dispositivos
 *     description: Retorna lista paginada de dispositivos da empresa
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
 *         description: Buscar por nome ou IMEI
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [ACTIVE, INACTIVE, MAINTENANCE]
 *         description: Filtrar por status
 *     responses:
 *       200:
 *         description: Lista de dispositivos
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
 *                         $ref: '#/components/schemas/Device'
 */
router.get(
  "/",
  authMiddleware,
  companyMiddleware,
  validateQuery(deviceQuerySchema),
  DeviceController.findAll
);

/**
 * @swagger
 * /devices/{id}:
 *   get:
 *     tags: [Dispositivos]
 *     summary: Obter dispositivo por ID
 *     description: Retorna dados de um dispositivo específico
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID do dispositivo
 *     responses:
 *       200:
 *         description: Dados do dispositivo
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Device'
 *       404:
 *         description: Dispositivo não encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get(
  "/:id",
  authMiddleware,
  companyMiddleware,
  DeviceController.findById
);

/**
 * @swagger
 * /devices:
 *   post:
 *     tags: [Dispositivos]
 *     summary: Criar novo dispositivo
 *     description: Cria um novo dispositivo GPS
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - imei
 *               - name
 *             properties:
 *               imei:
 *                 type: string
 *                 example: 123456789012345
 *                 description: IMEI único do dispositivo
 *               name:
 *                 type: string
 *                 example: Veículo 001
 *                 description: Nome identificador do dispositivo
 *               model:
 *                 type: string
 *                 example: GT06N
 *                 description: Modelo do dispositivo
 *               status:
 *                 type: string
 *                 enum: [ACTIVE, INACTIVE, MAINTENANCE]
 *                 default: ACTIVE
 *                 example: ACTIVE
 *     responses:
 *       201:
 *         description: Dispositivo criado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Device'
 *       409:
 *         description: IMEI já cadastrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post(
  "/",
  authMiddleware,
  companyMiddleware,
  validateBody(createDeviceSchema),
  DeviceController.create
);

/**
 * @swagger
 * /devices/{id}:
 *   put:
 *     tags: [Dispositivos]
 *     summary: Atualizar dispositivo
 *     description: Atualiza dados de um dispositivo
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID do dispositivo
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: Veículo 001
 *               model:
 *                 type: string
 *                 example: GT06N
 *               status:
 *                 type: string
 *                 enum: [ACTIVE, INACTIVE, MAINTENANCE]
 *                 example: ACTIVE
 *     responses:
 *       200:
 *         description: Dispositivo atualizado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Device'
 *       404:
 *         description: Dispositivo não encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put(
  "/:id",
  authMiddleware,
  companyMiddleware,
  validateBody(updateDeviceSchema),
  DeviceController.update
);

/**
 * @swagger
 * /devices/{id}:
 *   delete:
 *     tags: [Dispositivos]
 *     summary: Excluir dispositivo
 *     description: Remove um dispositivo do sistema
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID do dispositivo
 *     responses:
 *       200:
 *         description: Dispositivo excluído com sucesso
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
 *                   example: Dispositivo excluído com sucesso
 *       404:
 *         description: Dispositivo não encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete(
  "/:id",
  authMiddleware,
  companyMiddleware,
  DeviceController.delete
);

/**
 * @swagger
 * /devices/{id}/locations:
 *   get:
 *     tags: [Dispositivos]
 *     summary: Obter histórico de localizações
 *     description: Retorna histórico de localizações de um dispositivo
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID do dispositivo
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Data/hora inicial (ISO 8601)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Data/hora final (ISO 8601)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 1000
 *           default: 100
 *         description: Máximo de registros
 *     responses:
 *       200:
 *         description: Histórico de localizações
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Location'
 */
router.get(
  "/:id/locations",
  authMiddleware,
  companyMiddleware,
  validateQuery(locationQuerySchema),
  DeviceController.getLocations
);

/**
 * @swagger
 * /devices/{id}/latest-location:
 *   get:
 *     tags: [Dispositivos]
 *     summary: Obter última localização
 *     description: Retorna a última localização conhecida do dispositivo
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID do dispositivo
 *     responses:
 *       200:
 *         description: Última localização
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Location'
 *       404:
 *         description: Nenhuma localização encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get(
  "/:id/latest-location",
  authMiddleware,
  companyMiddleware,
  DeviceController.getLatestLocation
);

export default router;
