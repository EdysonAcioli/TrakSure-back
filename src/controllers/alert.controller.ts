import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface AuthRequest extends Request {
  user?: any;
  query: any;
}

export class AlertController {
  static async create(req: AuthRequest, res: Response) {
    try {
      const { device_id, alert_type, message, company_id } = req.body;
      const finalCompanyId = company_id || req.user.company_id;

      const alert = await prisma.alerts.create({
        data: {
          device_id,
          alert_type,
          message,
          company_id: finalCompanyId
        },
        include: {
          devices: { select: { imei: true, name: true } },
          companies: { select: { name: true } }
        }
      });

      res.status(201).json({
        success: true,
        message: 'Alerta criado com sucesso',
        data: alert
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  static async findAll(req: AuthRequest, res: Response) {
    try {
      const { page = 1, limit = 10, sort = 'created_at', order = 'desc', resolved } = req.query;
      const offset = (page - 1) * limit;

      const where: any = {};
      if (req.user.role !== 'admin') {
        where.company_id = req.user.company_id;
      }

      if (resolved !== undefined) {
        where.resolved_at = resolved === 'true' ? { not: null } : null;
      }

      const [alerts, total] = await Promise.all([
        prisma.alerts.findMany({
          where,
          skip: offset,
          take: limit,
          orderBy: { [sort]: order },
          include: {
            devices: { select: { imei: true, name: true } },
            companies: { select: { name: true } }
          }
        }),
        prisma.alerts.count({ where })
      ]);

      res.json({
        success: true,
        data: {
          alerts,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
          }
        }
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  static async resolve(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      const where: any = { id };
      if (req.user.role !== 'admin') {
        where.company_id = req.user.company_id;
      }

      const alert = await prisma.alerts.update({
        where,
        data: { resolved_at: new Date() }
      });

      res.json({
        success: true,
        message: 'Alerta resolvido com sucesso',
        data: alert
      });
    } catch (error: any) {
      if (error.code === 'P2025') {
        return res.status(404).json({
          success: false,
          error: 'Alerta não encontrado'
        });
      }

      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
}