export type UserRole = 'admin' | 'principal' | 'guidance' | 'teacher' | 'student';

export type StaffPosition = 
  | 'principal'
  | 'vice_principal'
  | 'guidance_counselor'
  | 'teacher';

export type TeacherRank = 
  | 'master_teacher_ii'
  | 'master_teacher_i'
  | 'senior_teacher'
  | 'regular_teacher';

export type SubjectSpecialization = 
  | 'english'
  | 'math'
  | 'science'
  | 'ict'
  | 'filipino'
  | 'arts'
  | 'pe'
  | 'social_studies'
  | 'tle'
  | 'values'
  | 'other';

export type StaffPermission = 
  | 'edit_students'
  | 'assign_grades_sections'
  | 'promote_transfer_students'
  | 'edit_staff_profiles'
  | 'manage_reports'
  | 'access_sensitive_data'
  | 'manage_permissions'
  | 'view_all_reports'
  | 'create_grades_sections'
  | 'remove_students'
  | 'manage_buildings';

export type ReportStatus = 'under_review' | 'accepted' | 'declined';

export type IncidentType = 
  | 'Physical Bullying'
  | 'Verbal Threats'
  | 'Group Bullying'
  | 'fighting'
  | 'Trapping'
  | 'Sexual Harassment'
  | 'other';

export type Building = 'A' | 'B' | 'C' | 'D';
export type Floor = '1st' | '2nd' | '3rd' | '4th';

export interface JWTPayload {
  id: string;
  email: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

export interface AuthResponse {
  token: string;
  refreshToken: string;
  user: any;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
