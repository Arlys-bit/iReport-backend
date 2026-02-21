import { query } from '../database/connection.js';
import { generateId } from '../utils/helpers.js';

export const studentService = {
  async createStudent(data: {
    userId: string;
    lrn: string;
    gradeLevelId?: string;
    sectionId?: string;
    schoolEmail?: string;
    assignedTeacherId?: string;
  }) {
    const studentId = generateId();

    const result = await query(
      `INSERT INTO students (id, user_id, lrn, grade_level_id, section_id, school_email, assigned_teacher_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        studentId,
        data.userId,
        data.lrn,
        data.gradeLevelId || null,
        data.sectionId || null,
        data.schoolEmail || null,
        data.assignedTeacherId || null,
      ]
    );

    return result.rows[0];
  },

  async getStudents(filters?: { gradeLevelId?: string; sectionId?: string }) {
    let queryStr = `
      SELECT s.*, u.full_name, u.email
      FROM students s
      JOIN users u ON s.user_id = u.id
      WHERE 1=1
    `;
    const params: any[] = [];
    let paramCount = 1;

    if (filters?.gradeLevelId) {
      queryStr += ` AND s.grade_level_id = $${paramCount}`;
      params.push(filters.gradeLevelId);
      paramCount++;
    }

    if (filters?.sectionId) {
      queryStr += ` AND s.section_id = $${paramCount}`;
      params.push(filters.sectionId);
      paramCount++;
    }

    queryStr += ' ORDER BY u.full_name';

    const result = await query(queryStr, params);
    return result.rows;
  },

  async getStudentById(studentId: string) {
    const result = await query(
      `SELECT s.*, u.full_name, u.email, 
              json_agg(DISTINCT vr.*) as violation_history
       FROM students s
       JOIN users u ON s.user_id = u.id
       LEFT JOIN violation_records vr ON s.id = vr.student_id
       WHERE s.id = $1
       GROUP BY s.id, u.id`,
      [studentId]
    );

    if (result.rows.length === 0) {
      throw new Error('Student not found');
    }

    return result.rows[0];
  },

  async getStudentByLRN(lrn: string) {
    const result = await query(
      `SELECT s.*, u.full_name, u.email
       FROM students s
       JOIN users u ON s.user_id = u.id
       WHERE s.lrn = $1`,
      [lrn]
    );

    if (result.rows.length === 0) {
      throw new Error('Student not found');
    }

    return result.rows[0];
  },

  async updateStudent(studentId: string, data: any) {
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    Object.entries(data).forEach(([key, value]) => {
      updates.push(`${key} = $${paramCount}`);
      values.push(value);
      paramCount++;
    });

    values.push(studentId);

    const result = await query(
      `UPDATE students SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );

    return result.rows[0];
  },
};

export default studentService;
