import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class AuthService {
  private static JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
  private static JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

  static async register(email: string, password: string, role: string = 'user', company_id?: string) {
    // Verificar se usuário já existe
    const existingUser = await prisma.users.findUnique({
      where: { email }
    });

    if (existingUser) {
      throw new Error('Usuário já existe com este email');
    }

    // Hash da senha
    const saltRounds = 12;
    const password_hash = await bcrypt.hash(password, saltRounds);

    // Criar usuário
    const user = await prisma.users.create({
      data: {
        email,
        password_hash,
        role,
        company_id
      },
      select: {
        id: true,
        email: true,
        role: true,
        company_id: true,
        created_at: true
      }
    });

    // Gerar token
    const token = this.generateToken(user.id);

    return { user, token };
  }

  static async login(email: string, password: string) {
    // Buscar usuário
    const user = await prisma.users.findUnique({
      where: { email },
      include: {
        companies: true
      }
    });

    if (!user) {
      throw new Error('Email ou senha inválidos');
    }

    // Verificar senha
    const isValidPassword = await bcrypt.compare(password, user.password_hash);

    if (!isValidPassword) {
      throw new Error('Email ou senha inválidos');
    }

    // Gerar token
    const token = this.generateToken(user.id);

    // Remover hash da senha da resposta
    const { password_hash, ...userWithoutPassword } = user;

    return { user: userWithoutPassword, token };
  }

  static generateToken(userId: string): string {
    return jwt.sign(
      { userId },
      this.JWT_SECRET,
      { expiresIn: this.JWT_EXPIRES_IN } as any
    );
  }

  static async verifyToken(token: string) {
    try {
      const decoded = jwt.verify(token, this.JWT_SECRET) as any;
      return decoded;
    } catch (error) {
      throw new Error('Token inválido');
    }
  }

  static async getUserById(id: string) {
    const user = await prisma.users.findUnique({
      where: { id },
      include: {
        companies: true
      },
      select: {
        id: true,
        email: true,
        role: true,
        company_id: true,
        created_at: true,
        companies: true
      }
    });

    return user;
  }
}