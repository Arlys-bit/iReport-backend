import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import authService from '../services/authService.js';

export const authController = {
  async login(req: AuthRequest, res: Response) {
    try {
      const { email, password } = req.body;

      const authResponse = await authService.login(email, password);

      res.json({
        success: true,
        data: authResponse,
      });
    } catch (error: any) {
      res.status(401).json({
        success: false,
        error: error.message || 'Login failed',
      });
    }
  },

  async register(req: AuthRequest, res: Response) {
    try {
      const { fullName, email, password, role } = req.body;

      const authResponse = await authService.register({
        fullName,
        email,
        password,
        role: role || 'student',
      });

      res.status(201).json({
        success: true,
        data: authResponse,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message || 'Registration failed',
      });
    }
  },

  async getCurrentUser(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Not authenticated',
        });
      }

      res.json({
        success: true,
        data: req.user,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  },
};

export default authController;
