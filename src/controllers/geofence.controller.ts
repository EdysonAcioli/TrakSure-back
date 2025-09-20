import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface AuthRequest extends Request {
  user?: any;
  query: any;
}

export class GeofenceController {
  static async create(req: AuthRequest, res: Response) {
    try {
      const { name, coordinates, company_id } = req.body;

      // Se não especificar company_id, usar a empresa do usuário logado
      const finalCompanyId = company_id || req.user.company_id;

      // Converter coordenadas para formato WKT
      const wktCoords = coordinates.map((coord: number[]) => `${coord[0]} ${coord[1]}`).join(', ');
      const wkt = `POLYGON((${wktCoords}))`;

      // Criar geofence usando SQL raw para garantir que a geometria seja criada corretamente
      const result = await prisma.$queryRaw`
        INSERT INTO geofences (company_id, name, geom, created_at)
        VALUES (${finalCompanyId}::uuid, ${name}, ST_GeomFromText(${wkt}, 4326), now())
        RETURNING id, name, created_at
      `;

      res.status(201).json({
        success: true,
        message: 'Geofence criada com sucesso',
        data: result[0] || result
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
      const { page = 1, limit = 10, sort = 'created_at', order = 'desc' } = req.query;
      const offset = (page - 1) * limit;

      // Filtrar por empresa se não for admin
      const where: any = {};
      if (req.user.role !== 'admin') {
        where.company_id = req.user.company_id;
      }

      const [geofences, total] = await Promise.all([
        prisma.$queryRaw`
          SELECT 
            g.id,
            g.name,
            g.company_id,
            g.created_at,
            c.name as company_name,
            ST_AsGeoJSON(g.geom) as geometry
          FROM geofences g
          LEFT JOIN companies c ON g.company_id = c.id
          ${req.user.role !== 'admin' ? prisma.$queryRaw`WHERE g.company_id = ${req.user.company_id}::uuid` : prisma.$queryRaw``}
          ORDER BY g.${prisma.$queryRawUnsafe(sort)} ${prisma.$queryRawUnsafe(order)}
          LIMIT ${limit} OFFSET ${offset}
        `,
        prisma.geofences.count({ where })
      ]);

      res.json({
        success: true,
        data: {
          geofences,
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

  static async findById(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      const whereClause = req.user.role !== 'admin' 
        ? `WHERE g.id = $1::uuid AND g.company_id = $2::uuid`
        : `WHERE g.id = $1::uuid`;

      const params = req.user.role !== 'admin' 
        ? [id, req.user.company_id]
        : [id];

      const result = await prisma.$queryRawUnsafe(`
        SELECT 
          g.id,
          g.name,
          g.company_id,
          g.created_at,
          c.name as company_name,
          ST_AsGeoJSON(g.geom) as geometry
        FROM geofences g
        LEFT JOIN companies c ON g.company_id = c.id
        ${whereClause}
      `, ...params);

      const geofence = Array.isArray(result) ? result[0] : result;

      if (!geofence) {
        return res.status(404).json({
          success: false,
          error: 'Geofence não encontrada'
        });
      }

      res.json({
        success: true,
        data: geofence
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  static async update(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const { name, coordinates } = req.body;

      // Verificar se a geofence existe e o usuário tem acesso
      const where: any = { id };
      if (req.user.role !== 'admin') {
        where.company_id = req.user.company_id;
      }

      const existingGeofence = await prisma.geofences.findFirst({ where });
      if (!existingGeofence) {
        return res.status(404).json({
          success: false,
          error: 'Geofence não encontrada'
        });
      }

      let updateData: any = {};
      if (name) updateData.name = name;

      if (coordinates) {
        // Converter coordenadas para formato WKT
        const wktCoords = coordinates.map((coord: number[]) => `${coord[0]} ${coord[1]}`).join(', ');
        const wkt = `POLYGON((${wktCoords}))`;

        await prisma.$queryRaw`
          UPDATE geofences 
          SET name = ${name}, geom = ST_GeomFromText(${wkt}, 4326)
          WHERE id = ${id}::uuid
        `;
      } else if (name) {
        await prisma.geofences.update({
          where: { id },
          data: { name }
        });
      }

      res.json({
        success: true,
        message: 'Geofence atualizada com sucesso'
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  static async delete(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      const where: any = { id };
      if (req.user.role !== 'admin') {
        where.company_id = req.user.company_id;
      }

      await prisma.geofences.delete({ where });

      res.json({
        success: true,
        message: 'Geofence excluída com sucesso'
      });
    } catch (error: any) {
      if (error.code === 'P2025') {
        return res.status(404).json({
          success: false,
          error: 'Geofence não encontrada'
        });
      }

      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  static async checkDeviceLocation(req: AuthRequest, res: Response) {
    try {
      const { device_id, geofence_id } = req.query;

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

      // Buscar última localização do dispositivo
      const location = await prisma.locations.findFirst({
        where: { device_id: device_id as string },
        orderBy: { recorded_at: 'desc' }
      });

      if (!location) {
        return res.status(404).json({
          success: false,
          error: 'Nenhuma localização encontrada para este dispositivo'
        });
      }

      let result;

      if (geofence_id) {
        // Verificar se está dentro de uma geofence específica
        result = await prisma.$queryRaw`
          SELECT 
            g.id,
            g.name,
            ST_Contains(g.geom, ST_SetSRID(ST_MakePoint(${location.longitude}, ${location.latitude}), 4326)) as inside
          FROM geofences g
          WHERE g.id = ${geofence_id}::uuid
          ${req.user.role !== 'admin' ? prisma.$queryRaw`AND g.company_id = ${req.user.company_id}::uuid` : prisma.$queryRaw``}
        `;
      } else {
        // Verificar todas as geofences da empresa
        result = await prisma.$queryRaw`
          SELECT 
            g.id,
            g.name,
            ST_Contains(g.geom, ST_SetSRID(ST_MakePoint(${location.longitude}, ${location.latitude}), 4326)) as inside
          FROM geofences g
          WHERE ST_Contains(g.geom, ST_SetSRID(ST_MakePoint(${location.longitude}, ${location.latitude}), 4326)) = true
          ${req.user.role !== 'admin' ? prisma.$queryRaw`AND g.company_id = ${req.user.company_id}::uuid` : prisma.$queryRaw``}
        `;
      }

      res.json({
        success: true,
        data: {
          device_id,
          location: {
            latitude: location.latitude,
            longitude: location.longitude,
            recorded_at: location.recorded_at
          },
          geofences: result
        }
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
}