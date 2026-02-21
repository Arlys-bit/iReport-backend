import { SubjectSpecialization, StaffPosition, TeacherRank, ClusterRole, StaffPermission } from '@/types';

export const SUBJECT_SPECIALIZATIONS: { key: SubjectSpecialization; name: string }[] = [
  { key: 'english', name: 'English' },
  { key: 'math', name: 'Math' },
  { key: 'science', name: 'Science' },
  { key: 'ict', name: 'ICT' },
  { key: 'filipino', name: 'Filipino' },
  { key: 'arts', name: 'Arts' },
  { key: 'pe', name: 'PE' },
  { key: 'social_studies', name: 'Social Studies' },
  { key: 'tle', name: 'TLE' },
  { key: 'values', name: 'Values Education' },
  { key: 'other', name: 'Other' },
];

export const STAFF_POSITIONS: { key: StaffPosition; name: string }[] = [
  { key: 'principal', name: 'Principal' },
  { key: 'vice_principal', name: 'Vice Principal' },
  { key: 'guidance_counselor', name: 'Guidance Counselor' },
  { key: 'teacher', name: 'Teacher' },
];

export const TEACHER_RANKS: { key: TeacherRank; name: string }[] = [
  { key: 'master_teacher_ii', name: 'Master Teacher II' },
  { key: 'master_teacher_i', name: 'Master Teacher I' },
  { key: 'senior_teacher', name: 'Senior Teacher' },
  { key: 'regular_teacher', name: 'Regular Teacher' },
];

export const CLUSTER_ROLES: { key: ClusterRole; name: string }[] = [
  { key: 'head_of_faculty', name: 'Head of Faculty' },
  { key: 'assistant_head', name: 'Assistant Head of Faculty' },
];

export const STAFF_PERMISSIONS: { key: StaffPermission; name: string; description: string }[] = [
  { key: 'edit_students', name: 'Edit Students', description: 'Can edit student information' },
  { key: 'assign_grades_sections', name: 'Assign Grades & Sections', description: 'Can assign grade levels and sections' },
  { key: 'create_grades_sections', name: 'Create Grades & Sections', description: 'Can create new grade levels and sections' },
  { key: 'promote_transfer_students', name: 'Promote/Transfer Students', description: 'Can promote or transfer students' },
  { key: 'edit_staff_profiles', name: 'Edit Staff Profiles', description: 'Can edit other staff profiles' },
  { key: 'manage_reports', name: 'Manage Reports', description: 'Can manage incident reports' },
  { key: 'access_sensitive_data', name: 'Access Sensitive Data', description: 'Can access sensitive information' },
  { key: 'manage_permissions', name: 'Manage Permissions', description: 'Can manage staff permissions' },
  { key: 'view_all_reports', name: 'View All Reports', description: 'Can view all incident reports' },
  { key: 'remove_students', name: 'Remove Students', description: 'Can permanently remove students' },
];
