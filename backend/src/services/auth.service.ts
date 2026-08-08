import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { env } from "../config/environment.js";
import { AppError } from "../utils/AppError.js";

export class AuthService {
  static async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
  }

  static async comparePasswords(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  static generateToken(payload: { userId: string; role: string; email?: string; phone?: string }): string {
    return jwt.sign(payload, env.JWT_SECRET, {
      expiresIn: env.JWT_EXPIRATION as any,
    });
  }

  static verifyToken(token: string): any {
    try {
      return jwt.verify(token, env.JWT_SECRET);
    } catch (err) {
      throw AppError.unauthorized("Invalid or expired authorization token");
    }
  }
}
