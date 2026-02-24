import { query } from './connection.js';

export const runMigrations = async () => {
  console.log('Running database migrations...');

  try {
    // Create tables
    await query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        role VARCHAR(50) NOT NULL,
        full_name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        profile_photo TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        is_active BOOLEAN DEFAULT true
      )
    `);
    console.log('✓ Created users table');

    await query(`
      CREATE TABLE IF NOT EXISTS staff_members (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        staff_id VARCHAR(50) UNIQUE NOT NULL,
        position VARCHAR(100) NOT NULL,
        school_email VARCHAR(255),
        specialization VARCHAR(100),
        rank VARCHAR(100),
        cluster_role VARCHAR(100),
        permissions TEXT[] DEFAULT '{}',
        last_login TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ Created staff_members table');

    await query(`
      CREATE TABLE IF NOT EXISTS students (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        lrn VARCHAR(50) UNIQUE NOT NULL,
        grade_level_id UUID,
        section_id UUID,
        school_email VARCHAR(255),
        assigned_teacher_id UUID REFERENCES staff_members(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ Created students table');

    await query(`
      CREATE TABLE IF NOT EXISTS grade_levels (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(100) NOT NULL,
        "order" INTEGER,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ Created grade_levels table');

    await query(`
      CREATE TABLE IF NOT EXISTS sections (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(100) NOT NULL,
        grade_level_id UUID NOT NULL REFERENCES grade_levels(id),
        advisor_id UUID REFERENCES staff_members(id),
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ Created sections table');

    await query(`
      CREATE TABLE IF NOT EXISTS incident_reports (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        reporter_id UUID NOT NULL REFERENCES users(id),
        reporter_name VARCHAR(255),
        reporter_lrn VARCHAR(50),
        incident_date TIMESTAMP NOT NULL,
        incident_type VARCHAR(100) NOT NULL,
        description TEXT,
        building VARCHAR(10),
        floor VARCHAR(10),
        room VARCHAR(50),
        involved_student_ids UUID[] DEFAULT '{}',
        report_type VARCHAR(50) DEFAULT 'regular',
        status VARCHAR(50) DEFAULT 'under_review',
        submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ Created incident_reports table');

    await query(`
      CREATE TABLE IF NOT EXISTS report_review_history (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        report_id UUID NOT NULL REFERENCES incident_reports(id) ON DELETE CASCADE,
        reviewer_id UUID NOT NULL REFERENCES users(id),
        reviewer_name VARCHAR(255),
        action VARCHAR(50),
        notes TEXT,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ Created report_review_history table');

    await query(`
      CREATE TABLE IF NOT EXISTS violation_records (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
        report_id UUID NOT NULL REFERENCES incident_reports(id),
        violation_type VARCHAR(100),
        description TEXT,
        incident_date TIMESTAMP,
        status VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ Created violation_records table');

    await query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        recipient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        sender_id UUID REFERENCES users(id),
        title VARCHAR(255),
        message TEXT,
        notification_type VARCHAR(50),
        related_id UUID,
        is_read BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        read_at TIMESTAMP
      )
    `);
    console.log('✓ Created notifications table');

    await query(`
      CREATE TABLE IF NOT EXISTS activity_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        staff_id UUID NOT NULL REFERENCES staff_members(id),
        staff_name VARCHAR(255),
        action VARCHAR(255),
        target_type VARCHAR(50),
        target_id UUID,
        target_name VARCHAR(255),
        details TEXT,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ Created activity_logs table');

    // Create indexes
    await query(`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_students_lrn ON students(lrn)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_reports_status ON incident_reports(status)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_reports_reporter ON incident_reports(reporter_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON notifications(recipient_id)`);
    console.log('✓ Created indexes');

    console.log('✅ Database migrations completed successfully');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
};

export default { runMigrations };
