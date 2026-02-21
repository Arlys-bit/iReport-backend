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
        }
      } catch (err) {
        console.error('Error fetching staff data:', err);
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
};

export default authService;
