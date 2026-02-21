import { query } from '../database/connection.js';
import { generateId } from '../utils/helpers.js';

export const reportService = {
  async createReport(data: {
    reporterId: string;
    reporterName: string;
    reporterLrn?: string;
    incidentDate: string;
    incidentType: string;
    description: string;
    building?: string;
    floor?: string;
    room?: string;
    involvedStudentIds?: string[];
  }) {
    const reportId = generateId();

    const result = await query(
      `INSERT INTO incident_reports (
        id, reporter_id, reporter_name, reporter_lrn, incident_date, 
        incident_type, description, building, floor, room, involved_student_ids, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING *`,
      [
        reportId,
        data.reporterId,
        data.reporterName,
        data.reporterLrn || null,
        data.incidentDate,
        data.incidentType,
        data.description,
        data.building || null,
        data.floor || null,
        data.room || null,
        data.involvedStudentIds || [],
        'under_review',
      ]
    );

    return result.rows[0];
  },

  async getReports(filters?: { status?: string; reporterId?: string; limit?: number }) {
    let queryStr = 'SELECT * FROM incident_reports WHERE 1=1';
    const params: any[] = [];
    let paramCount = 1;

    if (filters?.status) {
      queryStr += ` AND status = $${paramCount}`;
      params.push(filters.status);
      paramCount++;
    }

    if (filters?.reporterId) {
      queryStr += ` AND reporter_id = $${paramCount}`;
      params.push(filters.reporterId);
      paramCount++;
    }

    queryStr += ' ORDER BY created_at DESC';

    if (filters?.limit) {
      queryStr += ` LIMIT $${paramCount}`;
      params.push(filters.limit);
    }

    const result = await query(queryStr, params);
    return result.rows;
  },

  async getReportById(reportId: string) {
    const result = await query(
      `SELECT ir.*, 
              json_agg(DISTINCT frh.*) as review_history
       FROM incident_reports ir
       LEFT JOIN report_review_history frh ON ir.id = frh.report_id
       WHERE ir.id = $1
       GROUP BY ir.id`,
      [reportId]
    );

    if (result.rows.length === 0) {
      throw new Error('Report not found');
    }

    return result.rows[0];
  },

  async updateReportStatus(reportId: string, status: string, reviewerId: string, notes?: string) {
    // Update report status
    await query(
      'UPDATE incident_reports SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [status, reportId]
    );

    // Add review history
    const historyId = generateId();
    await query(
      `INSERT INTO report_review_history (id, report_id, reviewer_id, action, notes)
       VALUES ($1, $2, $3, $4, $5)`,
      [historyId, reportId, reviewerId, status === 'accepted' ? 'accepted' : 'declined', notes]
    );

    return this.getReportById(reportId);
  },

  async deleteReport(reportId: string) {
    await query('DELETE FROM incident_reports WHERE id = $1', [reportId]);
  },
};

export default reportService;
