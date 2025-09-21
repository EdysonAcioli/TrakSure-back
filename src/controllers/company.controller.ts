import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface AuthRequest extends Request {
  user?: any;
  query: any;
}

export class CompanyController {
  static async create(req: AuthRequest, res: Response) {
    try {
      const { name } = req.body;

      const company = await prisma.companies.create({
        data: { name },
      });

      res.status(201).json({
        success: true,
        message: "Empresa criada com sucesso",
        data: company,
      });
    } catch (error: any) {
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
      } = req.query;
      const offset = (page - 1) * limit;

      const [companies, total] = await Promise.all([
        prisma.companies.findMany({
          skip: offset,
          take: limit,
          orderBy: { [sort]: order },
          include: {
            _count: {
              select: {
                devices: true,
                users: true,
              },
            },
          },
        }),
        prisma.companies.count(),
      ]);

      res.json({
        success: true,
        data: {
          companies,
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

  static async findById(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const company = await prisma.companies.findUnique({
        where: { id },
        include: {
          devices: {
            take: 5,
            orderBy: { created_at: "desc" },
          },
          users: {
            take: 5,
            select: {
              id: true,
              email: true,
              role: true,
              created_at: true,
            },
          },
          _count: {
            select: {
              devices: true,
              users: true,
              vehicles: true,
              alerts: true,
            },
          },
        },
      });

      if (!company) {
        return res.status(404).json({
          success: false,
          error: "Empresa não encontrada",
        });
      }

      res.json({
        success: true,
        data: company,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  static async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { name } = req.body;

      const company = await prisma.companies.update({
        where: { id },
        data: { name },
      });

      res.json({
        success: true,
        message: "Empresa atualizada com sucesso",
        data: company,
      });
    } catch (error: any) {
      if (error.code === "P2025") {
        return res.status(404).json({
          success: false,
          error: "Empresa não encontrada",
        });
      }

      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  static async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;

      await prisma.companies.delete({
        where: { id },
      });

      res.json({
        success: true,
        message: "Empresa excluída com sucesso",
      });
    } catch (error: any) {
      if (error.code === "P2025") {
        return res.status(404).json({
          success: false,
          error: "Empresa não encontrada",
        });
      }

      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
}
