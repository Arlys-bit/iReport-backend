import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import reportService from '../services/reportService.js';

export const reportController = {
  async createReport(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, error: 'Not authenticated' });
      }

      const report = await reportService.createReport({
        ...req.body,
        reporterId: req.user.id,
      });

      res.status(201).json({
        success: true,
        data: report,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to create report',
      });
    }
  },

  async getReports(req: AuthRequest, res: Response) {
    try {
      const { status, reporterId, limit } = req.query;

      const reports = await reportService.getReports({
        status: status as string,
        reporterId: reporterId as string,
        limit: limit ? parseInt(limit as string) : undefined,
      });

      res.json({
        success: true,
        data: reports,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  },

  async getReport(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      const report = await reportService.getReportById(id);

      res.json({
        success: true,
        data: report,
      });
    } catch (error: any) {
      res.status(404).json({
        success: false,
        error: error.message || 'Report not found',
      });
    }
  },

  async updateReportStatus(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, error: 'Not authenticated' });
      }

      const { id } = req.params;
      const { status, notes } = req.body;

      const report = await reportService.updateReportStatus(id, status, req.user.id, notes);

      res.json({
        success: true,
        data: report,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to update report',
      });
    }
  },

  async deleteReport(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      await reportService.deleteReport(id);

      res.json({
        success: true,
        message: 'Report deleted successfully',
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  },
};

export default reportController;
