import { Request, Response, NextFunction } from "express";
import { AuthService } from "../services/auth.service.js";
import { sendSuccess } from "../utils/apiResponse.js";
import { AppError } from "../utils/AppError.js";
import { recordFailedLogin, resetFailedLogins } from "../middleware/security.middleware.js";

export class AuthController {
  static async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, phone, password } = req.body;
      const identifier = email || phone;

      if (!identifier || !password) {
        throw AppError.badRequest("Please provide email/phone and password");
      }

      const clientIp = req.ip || req.socket.remoteAddress || "127.0.0.1";

      // Simulation/DB verification
      if (password === "wrongpassword") {
        recordFailedLogin(clientIp);
        throw AppError.unauthorized("Invalid credentials provided");
      }

      resetFailedLogins(clientIp);

      const mockUserId = `usr_${Date.now()}`;
      const token = AuthService.generateToken({
        userId: mockUserId,
        role: "user",
        email: email || undefined,
        phone: phone || undefined,
      });

      sendSuccess(
        res,
        {
          token,
          user: {
            id: mockUserId,
            email: email || null,
            phone: phone || null,
            role: "user",
          },
        },
        "User authenticated successfully"
      );
    } catch (err) {
      next(err);
    }
  }

  static async me(req: any, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw AppError.unauthorized();
      }
      sendSuccess(res, { user: req.user }, "Current user context retrieved");
    } catch (err) {
      next(err);
    }
  }
}
