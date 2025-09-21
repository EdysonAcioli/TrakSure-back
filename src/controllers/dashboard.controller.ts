import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface AuthRequest extends Request {
  user?: any;
  query: any;
}

export class DashboardController {
  static async getStats(req: AuthRequest, res: Response) {
    try {
      const isAdmin = req.user.role === "admin";
      const companyFilter = isAdmin ? {} : { company_id: req.user.company_id };

      const [
        totalDevices,
        onlineDevices,
        totalLocations,
        activeAlerts,
        totalCompanies,
      ] = await Promise.all([
        prisma.devices.count({ where: companyFilter }),
        prisma.devices.count({
          where: {
            ...companyFilter,
            last_seen: {
              gte: new Date(Date.now() - 5 * 60 * 1000), // últimos 5 minutos
            },
          },
        }),
        prisma.locations.count({
          where: isAdmin
            ? {}
            : {
                devices: { company_id: req.user.company_id },
              },
        }),
        prisma.alerts.count({
          where: {
            ...companyFilter,
            resolved_at: null,
          },
        }),
        isAdmin ? prisma.companies.count() : 1,
      ]);

      res.json({
        success: true,
        data: {
          overview: {
            totalDevices,
            onlineDevices,
            offlineDevices: totalDevices - onlineDevices,
            totalLocations,
            activeAlerts,
            totalCompanies,
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

  static async getDeviceActivity(req: AuthRequest, res: Response) {
    try {
      const { days = 7 } = req.query;
      const startDate = new Date(
        Date.now() - (days as number) * 24 * 60 * 60 * 1000
      );

      const isAdmin = req.user.role === "admin";
      const companyCondition = isAdmin
        ? ""
        : `AND d.company_id = '${req.user.company_id}'`;

      const activity = await prisma.$queryRawUnsafe(
        `
        SELECT 
          DATE(l.recorded_at) as date,
          COUNT(DISTINCT l.device_id) as active_devices,
          COUNT(l.id) as total_locations
        FROM locations l
        JOIN devices d ON l.device_id = d.id
        WHERE l.recorded_at >= $1 ${companyCondition}
        GROUP BY DATE(l.recorded_at)
        ORDER BY date
      `,
        startDate
      );

      res.json({
        success: true,
        data: { activity },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  static async getAlertsSummary(req: AuthRequest, res: Response) {
    try {
      const { days = 30 } = req.query;
      const startDate = new Date(
        Date.now() - (days as number) * 24 * 60 * 60 * 1000
      );

      const isAdmin = req.user.role === "admin";
      const companyFilter = isAdmin ? {} : { company_id: req.user.company_id };

      const [alertsByType, alertsTrend] = await Promise.all([
        prisma.alerts.groupBy({
          by: ["alert_type"],
          where: {
            ...companyFilter,
            created_at: { gte: startDate },
          },
          _count: true,
        }),
        prisma.$queryRawUnsafe(
          `
          SELECT 
            DATE(created_at) as date,
            COUNT(*) as count,
            COUNT(CASE WHEN resolved_at IS NULL THEN 1 END) as unresolved
          FROM alerts
          WHERE created_at >= $1 ${
            isAdmin ? "" : `AND company_id = '${req.user.company_id}'`
          }
          GROUP BY DATE(created_at)
          ORDER BY date
        `,
          startDate
        ),
      ]);

      res.json({
        success: true,
        data: {
          alertsByType,
          alertsTrend,
        },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  static async getTopDevices(req: AuthRequest, res: Response) {
    try {
      const { days = 7, limit = 10 } = req.query;
      const startDate = new Date(
        Date.now() - (days as number) * 24 * 60 * 60 * 1000
      );

      const isAdmin = req.user.role === "admin";
      const companyCondition = isAdmin
        ? ""
        : `AND d.company_id = '${req.user.company_id}'`;

      const topDevices = await prisma.$queryRawUnsafe(
        `
        SELECT 
          d.id,
          d.imei,
          d.name,
          c.name as company_name,
          COUNT(l.id) as location_count,
          MAX(l.recorded_at) as last_location,
          AVG(l.speed) as avg_speed,
          MAX(l.speed) as max_speed
        FROM devices d
        LEFT JOIN locations l ON d.id = l.device_id AND l.recorded_at >= $1
        LEFT JOIN companies c ON d.company_id = c.id
        WHERE 1=1 ${companyCondition}
        GROUP BY d.id, d.imei, d.name, c.name
        ORDER BY location_count DESC
        LIMIT $2
      `,
        startDate,
        limit
      );

      res.json({
        success: true,
        data: { topDevices },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
}
