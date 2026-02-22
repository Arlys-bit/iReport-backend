import { query } from '../database/connection.js';
import { hashPassword, comparePasswords, generateToken } from '../utils/auth.js';
import { isValidEmail, generateId } from '../utils/helpers.js';
import { JWTPayload, AuthResponse } from '../types/index.js';

export const authService = {
  async login(email: string, password: string): Promise<AuthResponse> {
    if (!email || !password) {
      throw new Error('Email and password are required');
    }

    const result = await query(
      'SELECT id, email, password, role, full_name FROM users WHERE email = $1 AND is_active = true',
      [email]
    );

    if (result.rows.length === 0) {
      throw new Error('Invalid credentials');
    }

    const user = result.rows[0];
    const passwordMatch = await comparePasswords(password, user.password);

    if (!passwordMatch) {
      throw new Error('Invalid credentials');
    }

    const payload: JWTPayload = {
      id: user.id,
      email: user.email,
      role: user.role,
    };

    const token = generateToken(payload);

    // For staff/admin users, fetch additional staff data
    let staffData = {};
    if (user.role === 'admin' || user.role === 'teacher' || user.role === 'staff') {
      try {
        const staffResult = await query(
          'SELECT id, staff_id, position, school_email, specialization, rank FROM staff_members WHERE user_id = $1',
          [user.id]
        );
        if (staffResult.rows.length > 0) {
          const staff = staffResult.rows[0];
          staffData = {
            staffId: staff.staff_id,
            position: staff.position,
            schoolEmail: staff.school_email,
            specialization: staff.specialization,
            rank: staff.rank,
          };
        } else {
          // If no staff record found, add default values for testing
          staffData = {
            staffId: 'ADMIN001',
            position: 'principal',
            schoolEmail: user.email,
            specialization: 'administration',
            rank: 'senior_admin',
          };
        }
      } catch (err) {
        console.error('Error fetching staff data:', err);
        // Still provide default staff data on error
        staffData = {
          staffId: 'ADMIN001',
          position: 'principal',
          schoolEmail: user.email,
          specialization: 'administration',
          rank: 'senior_admin',
        };
      }
    }

    return {
      token,
      refreshToken: token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        role: user.role,
        ...staffData,
      },
    };
  },

  async register(data: {
    fullName: string;
    email: string;
    password: string;
    role: string;
  }): Promise<AuthResponse> {
    if (!data.fullName || !data.email || !data.password) {
      throw new Error('Full name, email, and password are required');
    }

    if (!isValidEmail(data.email)) {
      throw new Error('Invalid email address');
    }

    // Check if user exists
    const existingUser = await query(
      'SELECT id FROM users WHERE email = $1',
      [data.email]
    );

    if (existingUser.rows.length > 0) {
      throw new Error('User already exists');
    }

    const hashedPassword = await hashPassword(data.password);
    const userId = generateId();

    const result = await query(
      `INSERT INTO users (id, role, full_name, email, password, is_active)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, email, full_name, role`,
      [userId, data.role || 'student', data.fullName, data.email, hashedPassword, true]
    );

    const user = result.rows[0];
    const payload: JWTPayload = {
      id: user.id,
      email: user.email,
      role: user.role,
    };

    const token = generateToken(payload);

    return {
      token,
      refreshToken: token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        role: user.role,
      },
    };
  },

  async changePassword(userId: string, newPassword: string): Promise<{ success: boolean }> {
    if (!userId || !newPassword) {
      throw new Error('User ID and new password are required');
    }

    if (newPassword.length < 6) {
      throw new Error('Password must be at least 6 characters');
    }

    // Check if user exists
    const userResult = await query(
      'SELECT id FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      throw new Error('User not found');
    }

    const hashedPassword = await hashPassword(newPassword);

    await query(
      'UPDATE users SET password = $1 WHERE id = $2',
      [hashedPassword, userId]
    );

    return { success: true };
  },

  async changeEmail(userId: string, newEmail: string): Promise<{ success: boolean; email: string }> {
    if (!userId || !newEmail) {
      throw new Error('User ID and new email are required');
    }

    if (!isValidEmail(newEmail)) {
      throw new Error('Invalid email address');
    }

    // Check if user exists
    const userResult = await query(
      'SELECT id, email FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      throw new Error('User not found');
    }

    // Check if new email is already in use (but not by this user)
    const emailExists = await query(
      'SELECT id FROM users WHERE email = $1 AND id != $2',
      [newEmail, userId]
    );

    if (emailExists.rows.length > 0) {
      throw new Error('Email already in use');
    }

    // Update email in users table
    await query(
      'UPDATE users SET email = $1 WHERE id = $2',
      [newEmail, userId]
    );

    return { success: true, email: newEmail };
  },

  async deleteUser(userId: string): Promise<{ success: boolean }> {
    if (!userId) {
      throw new Error('User ID is required');
    }

    // Check if user exists
    const userResult = await query(
      'SELECT id, role FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      throw new Error('User not found');
    }

    const user = userResult.rows[0];

    // Delete from staff_members if it's a staff/admin user
    if (user.role === 'admin' || user.role === 'teacher' || user.role === 'staff') {
      await query(
        'DELETE FROM staff_members WHERE user_id = $1',
        [userId]
      );
    }

    // Delete from students if it's a student
    if (user.role === 'student') {
      await query(
        'DELETE FROM students WHERE user_id = $1',
        [userId]
      );
    }

    // Delete the user account
    await query(
      'DELETE FROM users WHERE id = $1',
      [userId]
    );

    return { success: true };
  },
};

export default authService;
