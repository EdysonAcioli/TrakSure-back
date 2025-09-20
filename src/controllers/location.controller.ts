import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface AuthRequest extends Request {
  user?: any;
  query: any;
}

export class LocationController {
  static async findAll(req: AuthRequest, res: Response) {
    try {
      const { page = 1, limit = 50, sort = 'recorded_at', order = 'desc', device_id, start_date, end_date } = req.query;
      const offset = (page - 1) * limit;

      // Construir filtros
      const where: any = {};

      if (device_id) {
        // Verificar se usuário tem acesso ao dispositivo
        const deviceWhere: any = { id: device_id };
        if (req.user.role !== 'admin') {
          deviceWhere.company_id = req.user.company_id;
        }

        const device = await prisma.devices.findFirst({ where: deviceWhere });
        if (!device) {
          return res.status(404).json({
            success: false,
            error: 'Dispositivo não encontrado'
          });
        }

        where.device_id = device_id;
      } else {
        // Se não especificar dispositivo, filtrar por empresa
        if (req.user.role !== 'admin') {
          where.devices = {
            company_id: req.user.company_id
          };
        }
      }

      // Filtros de data
      if (start_date || end_date) {
        where.recorded_at = {};
        if (start_date) where.recorded_at.gte = new Date(start_date);
        if (end_date) where.recorded_at.lte = new Date(end_date);
      }

      const [locations, total] = await Promise.all([
        prisma.locations.findMany({
          where,
          skip: offset,
          take: limit,
          orderBy: { [sort]: order },
          include: {
            devices: {
              select: {
                id: true,
                imei: true,
                name: true,
                companies: {
                  select: {
                    id: true,
                    name: true
                  }
                }
              }
            }
          }
        }),
        prisma.locations.count({ where })
      ]);

      res.json({
        success: true,
        data: {
          locations,
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

  static async create(req: Request, res: Response) {
    try {
      const { device_id, latitude, longitude, speed, heading, raw_payload } = req.body;

      // Criar localização usando SQL raw para garantir que a geometria seja calculada
      const result = await prisma.$executeRaw`
        INSERT INTO locations (device_id, latitude, longitude, recorded_at, geom, speed, heading, raw_payload)
        VALUES (${device_id}::uuid, ${latitude}::double precision, ${longitude}::double precision, now(),
                ST_SetSRID(ST_MakePoint(${longitude}::double precision, ${latitude}::double precision), 4326),
                ${speed}::double precision, ${heading}::double precision, ${raw_payload}::jsonb)
      `;

      // Atualizar last_seen do dispositivo
      await prisma.devices.update({
        where: { id: device_id },
        data: { last_seen: new Date() }
      });

      res.status(201).json({
        success: true,
        message: 'Localização salva com sucesso'
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  static async getRoute(req: AuthRequest, res: Response) {
    try {
      const { device_id, start_date, end_date } = req.query;

      if (!device_id) {
        return res.status(400).json({
          success: false,
          error: 'device_id é obrigatório'
        });
      }

      // Verificar acesso ao dispositivo
      const deviceWhere: any = { id: device_id };
      if (req.user.role !== 'admin') {
        deviceWhere.company_id = req.user.company_id;
      }

      const device = await prisma.devices.findFirst({ where: deviceWhere });
      if (!device) {
        return res.status(404).json({
          success: false,
          error: 'Dispositivo não encontrado'
        });
      }

      // Filtros de data
      const where: any = { device_id };
      if (start_date || end_date) {
        where.recorded_at = {};
        if (start_date) where.recorded_at.gte = new Date(start_date);
        if (end_date) where.recorded_at.lte = new Date(end_date);
      }

      const locations = await prisma.locations.findMany({
        where,
        orderBy: { recorded_at: 'asc' },
        select: {
          latitude: true,
          longitude: true,
          speed: true,
          heading: true,
          recorded_at: true
        }
      });

      // Calcular estatísticas da rota
      let totalDistance = 0;
      let maxSpeed = 0;
      let avgSpeed = 0;

      if (locations.length > 1) {
        for (let i = 1; i < locations.length; i++) {
          const prev = locations[i - 1];
          const curr = locations[i];
          
          // Calcular distância usando fórmula haversine (aproximada)
          const distance = calculateDistance(
            prev.latitude!, prev.longitude!,
            curr.latitude!, curr.longitude!
          );
          totalDistance += distance;
          
          if (curr.speed && curr.speed > maxSpeed) {
            maxSpeed = curr.speed;
          }
        }

        const speedSum = locations.reduce((sum: number, loc: any) => sum + (loc.speed || 0), 0);
        avgSpeed = speedSum / locations.length;
      }

      const duration = locations.length > 0 
        ? new Date(locations[locations.length - 1].recorded_at!).getTime() - new Date(locations[0].recorded_at!).getTime()
        : 0;

      res.json({
        success: true,
        data: {
          route: locations,
          statistics: {
            totalDistance: Math.round(totalDistance * 100) / 100, // km
            maxSpeed: Math.round(maxSpeed * 100) / 100, // km/h
            avgSpeed: Math.round(avgSpeed * 100) / 100, // km/h
            duration: duration, // ms
            points: locations.length
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

  static async getHeatmap(req: AuthRequest, res: Response) {
    try {
      const { start_date, end_date, device_id } = req.query;

      // Construir filtros
      const where: any = {};

      if (device_id) {
        // Verificar acesso ao dispositivo
        const deviceWhere: any = { id: device_id };
        if (req.user.role !== 'admin') {
          deviceWhere.company_id = req.user.company_id;
        }

        const device = await prisma.devices.findFirst({ where: deviceWhere });
        if (!device) {
          return res.status(404).json({
            success: false,
            error: 'Dispositivo não encontrado'
          });
        }

        where.device_id = device_id;
      } else {
        // Filtrar por empresa
        if (req.user.role !== 'admin') {
          where.devices = {
            company_id: req.user.company_id
          };
        }
      }

      // Filtros de data
      if (start_date || end_date) {
        where.recorded_at = {};
        if (start_date) where.recorded_at.gte = new Date(start_date);
        if (end_date) where.recorded_at.lte = new Date(end_date);
      }

      // Buscar localizações agrupadas por coordenadas (com precisão reduzida)
      const heatmapData = await prisma.$queryRaw`
        SELECT 
          ROUND(latitude::numeric, 4) as lat,
          ROUND(longitude::numeric, 4) as lng,
          COUNT(*) as intensity
        FROM locations l
        ${device_id ? prisma.$queryRaw`WHERE device_id = ${device_id}::uuid` : prisma.$queryRaw``}
        ${start_date ? prisma.$queryRaw`AND recorded_at >= ${new Date(start_date)}` : prisma.$queryRaw``}
        ${end_date ? prisma.$queryRaw`AND recorded_at <= ${new Date(end_date)}` : prisma.$queryRaw``}
        GROUP BY ROUND(latitude::numeric, 4), ROUND(longitude::numeric, 4)
        ORDER BY intensity DESC
        LIMIT 1000
      `;

      res.json({
        success: true,
        data: { heatmap: heatmapData }
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
}

// Função auxiliar para calcular distância entre dois pontos
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Raio da Terra em km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}