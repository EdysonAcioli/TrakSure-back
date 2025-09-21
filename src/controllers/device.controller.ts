import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface AuthRequest extends Request {
  user?: any;
  query: any;
}

export class DeviceController {
  static async create(req: AuthRequest, res: Response) {
    try {
      const { imei, name, sim_number, company_id, model_id } = req.body;

      // Se não especificar company_id, usar a empresa do usuário logado
      const finalCompanyId = company_id || req.user.company_id;

      const device = await prisma.devices.create({
        data: {
          imei,
          name,
          sim_number,
          company_id: finalCompanyId,
          model_id,
        },
        include: {
          companies: true,
          device_models: true,
        },
      });

      res.status(201).json({
        success: true,
        message: "Dispositivo criado com sucesso",
        data: device,
      });
    } catch (error: any) {
      if (error.code === "P2002") {
        return res.status(400).json({
          success: false,
          error: "IMEI já cadastrado no sistema",
        });
      }

      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  static async findAll(req: AuthRequest, res: Response) {
    try {
      const {
        page = 1,
        limit = 10,
        sort = "created_at",
        order = "desc",
        company_id,
        online,
      } = req.query;
      const offset = (page - 1) * limit;

      // Filtros
      const where: any = {};

      // Se não for admin, filtrar pela empresa do usuário
      if (req.user.role !== "admin") {
        where.company_id = req.user.company_id;
      } else if (company_id) {
        where.company_id = company_id;
      }

      if (online !== undefined) {
        // Considerar dispositivo online se teve atividade nos últimos 5 minutos
        if (online) {
          where.last_seen = {
            gte: new Date(Date.now() - 5 * 60 * 1000),
          };
        } else {
          where.OR = [
            { last_seen: null },
            { last_seen: { lt: new Date(Date.now() - 5 * 60 * 1000) } },
          ];
        }
      }

      const [devices, total] = await Promise.all([
        prisma.devices.findMany({
          where,
          skip: offset,
          take: limit,
          orderBy: { [sort]: order },
          include: {
            companies: true,
            device_models: true,
            _count: {
              select: {
                locations: true,
                alerts: true,
              },
            },
          },
        }),
        prisma.devices.count({ where }),
      ]);

      // Adicionar status online
      const devicesWithStatus = devices.map((device: any) => ({
        ...device,
        online:
          device.last_seen &&
          device.last_seen > new Date(Date.now() - 5 * 60 * 1000),
      }));

      res.json({
        success: true,
        data: {
          devices: devicesWithStatus,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
          },
        },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  static async findById(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      const where: any = { id };

      // Se não for admin, filtrar pela empresa do usuário
      if (req.user.role !== "admin") {
        where.company_id = req.user.company_id;
      }

      const device = await prisma.devices.findFirst({
        where,
        include: {
          companies: true,
          device_models: true,
          locations: {
            take: 10,
            orderBy: { recorded_at: "desc" },
            select: {
              id: true,
              latitude: true,
              longitude: true,
              speed: true,
              heading: true,
              recorded_at: true,
            },
          },
          alerts: {
            take: 5,
            orderBy: { created_at: "desc" },
            where: { resolved_at: null },
          },
          _count: {
            select: {
              locations: true,
              alerts: true,
              commands: true,
            },
          },
        },
      });

      if (!device) {
        return res.status(404).json({
          success: false,
          error: "Dispositivo não encontrado",
        });
      }

      // Adicionar status online e última localização
      const deviceWithStatus = {
        ...device,
        online:
          device.last_seen &&
          device.last_seen > new Date(Date.now() - 5 * 60 * 1000),
        latest_location: device.locations[0] || null,
      };

      res.json({
        success: true,
        data: deviceWithStatus,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  static async update(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const { name, sim_number, company_id, model_id } = req.body;

      const where: any = { id };

      // Se não for admin, filtrar pela empresa do usuário
      if (req.user.role !== "admin") {
        where.company_id = req.user.company_id;
      }

      const device = await prisma.devices.update({
        where,
        data: {
          name,
          sim_number,
          company_id,
          model_id,
        },
        include: {
          companies: true,
          device_models: true,
        },
      });

      res.json({
        success: true,
        message: "Dispositivo atualizado com sucesso",
        data: device,
      });
    } catch (error: any) {
      if (error.code === "P2025") {
        return res.status(404).json({
          success: false,
          error: "Dispositivo não encontrado",
        });
      }

      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  static async delete(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      const where: any = { id };

      // Se não for admin, filtrar pela empresa do usuário
      if (req.user.role !== "admin") {
        where.company_id = req.user.company_id;
      }

      await prisma.devices.delete({ where });

      res.json({
        success: true,
        message: "Dispositivo excluído com sucesso",
      });
    } catch (error: any) {
      if (error.code === "P2025") {
        return res.status(404).json({
          success: false,
          error: "Dispositivo não encontrado",
        });
      }

      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  static async getLocations(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const { page = 1, limit = 50, start_date, end_date } = req.query;
      const offset = (page - 1) * limit;

      // Verificar se dispositivo existe e usuário tem acesso
      const where: any = { id };
      if (req.user.role !== "admin") {
        where.company_id = req.user.company_id;
      }

      const device = await prisma.devices.findFirst({ where });
      if (!device) {
        return res.status(404).json({
          success: false,
          error: "Dispositivo não encontrado",
        });
      }

      // Filtros de data
      const locationWhere: any = { device_id: id };
      if (start_date || end_date) {
        locationWhere.recorded_at = {};
        if (start_date) locationWhere.recorded_at.gte = new Date(start_date);
        if (end_date) locationWhere.recorded_at.lte = new Date(end_date);
      }

      const [locations, total] = await Promise.all([
        prisma.locations.findMany({
          where: locationWhere,
          skip: offset,
          take: limit,
          orderBy: { recorded_at: "desc" },
        }),
        prisma.locations.count({ where: locationWhere }),
      ]);

      res.json({
        success: true,
        data: {
          locations,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
          },
        },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  static async getLatestLocation(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      // Verificar se dispositivo existe e usuário tem acesso
      const where: any = { id };
      if (req.user.role !== "admin") {
        where.company_id = req.user.company_id;
      }

      const device = await prisma.devices.findFirst({ where });
      if (!device) {
        return res.status(404).json({
          success: false,
          error: "Dispositivo não encontrado",
        });
      }

      const location = await prisma.locations.findFirst({
        where: { device_id: id },
        orderBy: { recorded_at: "desc" },
      });

      res.json({
        success: true,
        data: { location },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
}
