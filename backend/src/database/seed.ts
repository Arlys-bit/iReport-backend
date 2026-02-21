import { query } from './connection.js';
import bcrypt from 'bcryptjs';

export const seedDatabase = async () => {
  console.log('Seeding database with sample data...');

  try {
    // Create default admin user
    const adminPassword = await bcrypt.hash('admin123', 10);
    const adminResult = await query(
      `INSERT INTO users (role, full_name, email, password, is_active)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (email) DO NOTHING
       RETURNING id`,
      ['admin', 'System Administrator', 'admin@school.edu', adminPassword, true]
    );

    if (adminResult.rows.length > 0) {
      const adminUserId = adminResult.rows[0].id;
      const permissions = [
        'edit_students',
        'assign_grades_sections',
        'promote_transfer_students',
        'edit_staff_profiles',
        'manage_reports',
        'access_sensitive_data',
        'manage_permissions',
        'view_all_reports',
        'create_grades_sections',
        'remove_students',
        'manage_buildings'
      ];
      await query(
        `INSERT INTO staff_members (user_id, staff_id, position, school_email, permissions)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (staff_id) DO NOTHING`,
        [
          adminUserId,
          'ADMIN001',
          'principal',
          'admin@school.edu',
          permissions
        ]
      );
      console.log('✓ Created admin user');
    }

    // Create grade levels
    const grades = [
      { name: 'Grade 1', order: 1 },
      { name: 'Grade 2', order: 2 },
      { name: 'Grade 3', order: 3 },
      { name: 'Grade 4', order: 4 },
      { name: 'Grade 5', order: 5 },
      { name: 'Grade 6', order: 6 },
    ];

    for (const grade of grades) {
      await query(
        `INSERT INTO grade_levels (name, "order", is_active)
         VALUES ($1, $2, $3)
         ON CONFLICT DO NOTHING`,
        [grade.name, grade.order, true]
      );
    }
    console.log('✓ Created grade levels');

    console.log('✅ Database seeding completed successfully');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    throw error;
  }
};

export default { seedDatabase };
