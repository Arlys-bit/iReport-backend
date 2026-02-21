import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import studentService from '../services/studentService.js';

export const studentController = {
  async createStudent(req: AuthRequest, res: Response) {
    try {
      const student = await studentService.createStudent(req.body);

      res.status(201).json({
        success: true,
        data: student,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to create student',
      });
    }
  },

  async getStudents(req: AuthRequest, res: Response) {
    try {
      const { gradeLevelId, sectionId } = req.query;

      const students = await studentService.getStudents({
        gradeLevelId: gradeLevelId as string,
        sectionId: sectionId as string,
      });

      res.json({
        success: true,
        data: students,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  },

  async getStudent(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      const student = await studentService.getStudentById(id);

      res.json({
        success: true,
        data: student,
      });
    } catch (error: any) {
      res.status(404).json({
        success: false,
        error: error.message || 'Student not found',
      });
    }
  },

  async updateStudent(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      const student = await studentService.updateStudent(id, req.body);

      res.json({
        success: true,
        data: student,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to update student',
      });
    }
  },
};

export default studentController;
