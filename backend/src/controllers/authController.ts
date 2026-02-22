import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import authService from '../services/authService.js';
import { query } from '../database/connection.js';

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

      if (!fullName || !email || !password) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: fullName, email, password',
        });
      }

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
      console.error('❌ Registration error:', error.message);
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

  async changePassword(req: AuthRequest, res: Response) {
    try {
      // Support both staffId and studentId parameters
      const staffId = req.params.staffId;
      const studentId = req.params.studentId;
      const { newPassword } = req.body;

      if (!newPassword) {
        return res.status(400).json({
          success: false,
          error: 'New password is required',
        });
      }

      let userId: string | undefined;

      // If staffId is provided, look it up in staff_members table
      if (staffId) {
        // First, check if staffId is a UUID (user_id)
        if (staffId.match(/^[0-9a-f-]{36}$/i)) {
          userId = staffId;
          console.log('✓ Using staffId directly as user_id:', staffId);
        } else {
          // Try multiple lookups: by staff_members.id, by staff_id, or by school_email
          let staffResult = await query(
            'SELECT user_id FROM staff_members WHERE id = $1 OR staff_id = $2 OR school_email = $3',
            [staffId, staffId, staffId]
          );
          
          if (staffResult.rows.length > 0) {
            userId = staffResult.rows[0].user_id;
            console.log('✓ Found staff member via table lookup:', staffId);
          } else {
            console.log('✗ Staff member not found:', staffId);
          }
        }
      }
      // If studentId is provided, look it up in students table
      else if (studentId) {
        // Try multiple lookups: by id (UUID), by user_id, by school_email, or by lrn
        let studentResult = await query(
          'SELECT user_id FROM students WHERE id = $1 OR user_id = $2 OR school_email = $3 OR lrn = $4',
          [studentId, studentId, studentId, studentId]
        );
        
        if (studentResult.rows.length > 0) {
          userId = studentResult.rows[0].user_id;
          console.log('✓ Found student via lookup:', studentId);
        } else if (studentId.match(/^[0-9a-f-]{36}$/i)) {
          // If it looks like a UUID, try using it directly as user_id
          userId = studentId;
          console.log('✓ Using studentId as user_id:', studentId);
        } else {
          console.log('✗ Student not found:', studentId);
          return res.status(404).json({
            success: false,
            error: 'Student not found to be able to change password',
          });
        }
      }

      if (!userId) {
        return res.status(400).json({
          success: false,
          error: 'User not found',
        });
      }

      await authService.changePassword(userId, newPassword);

      res.json({
        success: true,
        message: 'Password changed successfully',
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to change password',
      });
    }
  },

  async changeEmail(req: AuthRequest, res: Response) {
    try {
      // Support both staffId and studentId parameters
      const staffId = req.params.staffId;
      const studentId = req.params.studentId;
      const { newEmail } = req.body;

      if (!newEmail) {
        return res.status(400).json({
          success: false,
          error: 'New email is required',
        });
      }

      let userId: string | undefined;

      // If staffId is provided, look it up in staff_members table
      if (staffId) {
        // First, check if staffId is a UUID (user_id)
        if (staffId.match(/^[0-9a-f-]{36}$/i)) {
          userId = staffId;
          console.log('✓ Using staffId directly as user_id:', staffId);
        } else {
          // Try multiple lookups: by staff_members.id, by staff_id, or by school_email
          let staffResult = await query(
            'SELECT user_id FROM staff_members WHERE id = $1 OR staff_id = $2 OR school_email = $3',
            [staffId, staffId, staffId]
          );
          
          if (staffResult.rows.length > 0) {
            userId = staffResult.rows[0].user_id;
            console.log('✓ Found staff member via table lookup:', staffId);
          } else {
            console.log('✗ Staff member not found:', staffId);
          }
        }
      }
      // If studentId is provided, look it up in students table
      else if (studentId) {
        // Try multiple lookups: by id (UUID), by user_id, by school_email, or by lrn
        let studentResult = await query(
          'SELECT user_id FROM students WHERE id = $1 OR user_id = $2 OR school_email = $3 OR lrn = $4',
          [studentId, studentId, studentId, studentId]
        );
        
        if (studentResult.rows.length > 0) {
          userId = studentResult.rows[0].user_id;
          console.log('✓ Found student via lookup:', studentId);
        } else if (studentId.match(/^[0-9a-f-]{36}$/i)) {
          // If it looks like a UUID, try using it directly as user_id
          userId = studentId;
          console.log('✓ Using studentId as user_id:', studentId);
        } else {
          console.log('✗ Student not found:', studentId);
          console.log('Searched by: id, user_id, school_email, lrn');
          return res.status(404).json({
            success: false,
            error: 'Student not found with identifier: ' + studentId,
          });
        }
      }

      if (!userId) {
        return res.status(400).json({
          success: false,
          error: 'User not found',
        });
      }

      const result = await authService.changeEmail(userId, newEmail);

      res.json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to change email',
      });
    }
  },

  async deleteUser(req: AuthRequest, res: Response) {
    try {
      const { userId } = req.params;

      if (!userId) {
        return res.status(400).json({
          success: false,
          error: 'User ID is required',
        });
      }

      await authService.deleteUser(userId);

      res.json({
        success: true,
        message: 'User deleted successfully',
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to delete user',
      });
    }
  },
};

export default authController;
