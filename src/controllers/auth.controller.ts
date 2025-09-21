import { Request, Response } from "express";
import { AuthService } from "../services/auth.service.js";

interface AuthRequest extends Request {
  user?: any;
}

export class AuthController {
  static async register(req: Request, res: Response) {
    try {
      const { email, password, role, company_id } = req.body;

      const result = await AuthService.register(
        email,
        password,
        role,
        company_id
      );

      res.status(201).json({
        success: true,
        message: "Usuário criado com sucesso",
        data: result,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }

  static async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;

      const result = await AuthService.login(email, password);

      res.json({
        success: true,
        message: "Login realizado com sucesso",
        data: result,
      });
    } catch (error: any) {
      res.status(401).json({
        success: false,
        error: error.message,
      });
    }
  }

  static async me(req: AuthRequest, res: Response) {
    try {
      const user = await AuthService.getUserById(req.user.id);

      if (!user) {
        return res.status(404).json({
          success: false,
          error: "Usuário não encontrado",
        });
      }

      res.json({
        success: true,
        data: { user },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
}
