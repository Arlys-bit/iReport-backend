# Database Schema Documentation

## Tables Overview

### users
Base user table for all system users

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  role VARCHAR(50),           -- admin, principal, guidance, teacher, student
  full_name VARCHAR(255),
  email VARCHAR(255) UNIQUE,
  password VARCHAR(255),      -- bcrypt hashed
  profile_photo TEXT,
  created_at TIMESTAMP,
  is_active BOOLEAN
);
```

---

### staff_members
Staff-specific information (extends users table)

```sql
CREATE TABLE staff_members (
  id UUID PRIMARY KEY,
  user_id UUID UNIQUE,        -- Links to users.id
  staff_id VARCHAR(50) UNIQUE,
  position VARCHAR(100),      -- principal, vice_principal, guidance_counselor, teacher
  school_email VARCHAR(255),
  specialization VARCHAR(100),
  rank VARCHAR(100),          -- For teachers
  cluster_role VARCHAR(100),
  permissions TEXT[],         -- Array of permission strings
  last_login TIMESTAMP,
  created_at TIMESTAMP
);
```

**Permissions Array Examples:**
- `edit_students`
- `assign_grades_sections`
- `promote_transfer_students`
- `edit_staff_profiles`
- `manage_reports`
- `access_sensitive_data`
- `manage_permissions`
- `view_all_reports`
- `create_grades_sections`
- `remove_students`
- `manage_buildings`

---

### students
Student-specific information (extends users table)

```sql
CREATE TABLE students (
  id UUID PRIMARY KEY,
  user_id UUID UNIQUE,        -- Links to users.id
  lrn VARCHAR(50) UNIQUE,     -- Learner Reference Number
  grade_level_id UUID,        -- Links to grade_levels.id
  section_id UUID,            -- Links to sections.id
  school_email VARCHAR(255),
  assigned_teacher_id UUID,   -- Links to staff_members.id
  created_at TIMESTAMP
);
```

---

### grade_levels
Academic grade levels

```sql
CREATE TABLE grade_levels (
  id UUID PRIMARY KEY,
  name VARCHAR(100),          -- Grade 1, Grade 2, etc.
  order INTEGER,              -- 1, 2, 3, etc.
  is_active BOOLEAN,
  created_at TIMESTAMP
);
```

---

### sections
Class sections/sections within grade levels

```sql
CREATE TABLE sections (
  id UUID PRIMARY KEY,
  name VARCHAR(100),          -- Section A, Section B, etc.
  grade_level_id UUID,        -- Links to grade_levels.id
  advisor_id UUID,            -- Links to staff_members.id
  is_active BOOLEAN,
  created_at TIMESTAMP
);
```

---

### incident_reports
Main incident/violation reports

```sql
CREATE TABLE incident_reports (
  id UUID PRIMARY KEY,
  reporter_id UUID,           -- Links to users.id
  reporter_name VARCHAR(255),
  reporter_lrn VARCHAR(50),
  incident_date TIMESTAMP,
  incident_type VARCHAR(100), -- Physical Bullying, Verbal Threats, etc.
  description TEXT,
  building VARCHAR(10),       -- A, B, C, D
  floor VARCHAR(10),          -- 1st, 2nd, 3rd, 4th
  room VARCHAR(50),
  involved_student_ids UUID[],-- Array of student UUIDs
  status VARCHAR(50),         -- under_review, accepted, declined
  submitted_at TIMESTAMP,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

---

### report_review_history
Audit trail of report reviews

```sql
CREATE TABLE report_review_history (
  id UUID PRIMARY KEY,
  report_id UUID,             -- Links to incident_reports.id
  reviewer_id UUID,           -- Links to users.id
  reviewer_name VARCHAR(255),
  action VARCHAR(50),         -- submitted, reviewed, accepted, declined, note_added
  notes TEXT,
  timestamp TIMESTAMP
);
```

---

### violation_records
Records of violations for students (linked to reports)

```sql
CREATE TABLE violation_records (
  id UUID PRIMARY KEY,
  student_id UUID,            -- Links to students.id
  report_id UUID,             -- Links to incident_reports.id
  violation_type VARCHAR(100),
  description TEXT,
  incident_date TIMESTAMP,
  status VARCHAR(50),
  created_at TIMESTAMP
);
```

---

### notifications
Real-time notifications for users

```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY,
  recipient_id UUID,          -- Links to users.id
  sender_id UUID,             -- Links to users.id (optional)
  title VARCHAR(255),
  message TEXT,
  notification_type VARCHAR(50), -- report_created, status_updated, etc.
  related_id UUID,            -- ID of related entity (report, student, etc.)
  is_read BOOLEAN,
  created_at TIMESTAMP,
  read_at TIMESTAMP
);
```

---

### activity_logs
Audit trail for staff actions

```sql
CREATE TABLE activity_logs (
  id UUID PRIMARY KEY,
  staff_id UUID,              -- Links to staff_members.id
  staff_name VARCHAR(255),
  action VARCHAR(255),        -- Action description
  target_type VARCHAR(50),    -- student, staff, report, permission, account, grade, section
  target_id UUID,
  target_name VARCHAR(255),
  details TEXT,
  timestamp TIMESTAMP
);
```

---

## Indexes

For performance optimization:

```sql
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_students_lrn ON students(lrn);
CREATE INDEX idx_reports_status ON incident_reports(status);
CREATE INDEX idx_reports_reporter ON incident_reports(reporter_id);
CREATE INDEX idx_notifications_recipient ON notifications(recipient_id);
```

---

## Data Type Conversion

When converting between frontend and database:

| Database | Frontend | Notes |
|----------|----------|-------|
| UUID | string | UUID as string |
| VARCHAR | string | - |
| TEXT | string | - |
| TIMESTAMP | ISO 8601 string | Convert with `.toISOString()` |
| BOOLEAN | boolean | true/false |
| TEXT[] (Array) | string[] | Stored as arrays |
| INTEGER | number | - |

---

## Relationships Diagram

```
users (base)
├── staff_members (via user_id)
├── students (via user_id)
└── incident_reports (reporter_id)

incident_reports
├── report_review_history (report_id)
├── violation_records (report_id)
└── involved_student_ids[] (array of student UUIDs)

students
├── violation_records (student_id)
└── sections (section_id) → grade_levels (grade_level_id)

sections
└── grade_levels (grade_level_id)
```

---

## Migration Notes

- All IDs are UUIDs for better scalability
- Timestamps are in ISO 8601 format
- Booleans default to false/true as per PostgreSQL
- Arrays are used for many-to-many relationships (simpler for this schema)
- Soft deletes not implemented (use is_active flags instead)

---

## Backup Recommendations

Regular backups:
```bash
# Full backup
pg_dump ireport_db > backup_$(date +%Y%m%d).sql

# Restore
psql ireport_db < backup_2024-02-20.sql

# Scheduled backups (cron job)
0 2 * * * pg_dump ireport_db | gzip > /backups/ireport_$(date +\%Y\%m\%d).sql.gz
```
