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

export type ClusterRole = 
  | 'head_of_faculty'
  | 'assistant_head';

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

export interface GradeLevel {
  id: string;
  name: string;
  order: number;
  isActive: boolean;
}

export interface Section {
  id: string;
  name: string;
  gradeLevelId: string;
  advisorId?: string;
  isActive: boolean;
}

export interface User {
  id: string;
  role: UserRole;
  fullName: string;
  email: string;
  password: string;
  profilePhoto?: string;
  createdAt: string;
  isActive: boolean;
}

export interface Student extends User {
  role: 'student';
  lrn: string;
  gradeLevelId: string;
  sectionId: string;
  schoolEmail: string;
  violationHistory: ViolationRecord[];
  assignedTeacherId?: string;
}

export interface ViolationRecord {
  id: string;
  reportId: string;
  type: IncidentType;
  description: string;
  date: string;
  status: ReportStatus;
}

export interface StaffMember extends User {
  role: 'admin' | 'principal' | 'guidance' | 'teacher';
  staffId: string;
  position: StaffPosition;
  schoolEmail: string;
  specialization?: SubjectSpecialization;
  rank?: TeacherRank;
  clusterRole?: ClusterRole;
  assignedGradeLevelIds?: string[];
  assignedSectionIds?: string[];
  subjectsTaught?: string[];
  permissions: StaffPermission[];
  lastLogin?: string;
}

export interface ActivityLog {
  id: string;
  staffId: string;
  staffName: string;
  action: string;
  targetType: 'student' | 'staff' | 'report' | 'permission' | 'account' | 'grade' | 'section';
  targetId: string;
  targetName: string;
  details: string;
  timestamp: string;
}

export interface LocationDetails {
  building: Building;
  floor: Floor;
  room: string;
}

export interface ReportReviewHistory {
  id: string;
  reviewerId: string;
  reviewerName: string;
  action: 'submitted' | 'reviewed' | 'accepted' | 'declined' | 'note_added';
  notes?: string;
  timestamp: string;
}

export interface IncidentReport {
  id: string;
  reporterId: string;
  reporterName: string;
  reporterLRN: string;
  reporterGradeLevelId: string;
  reporterSectionId: string;
  reporterPhoto?: string;
  isAnonymous: boolean;
  acknowledgedAnonymous?: boolean;
  
  victimName: string;
  location: LocationDetails;
  incidentType: IncidentType;
  description?: string;
  
  dateTime?: string;
  cantRememberDateTime: boolean;
  
  photoEvidence?: string;
  
  reportingForSelf: boolean;
  
  status: ReportStatus;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  
  assignedTeacherId?: string;
  reviewHistory: ReportReviewHistory[];
  adminNotes?: string;
  declineReason?: string;
  
  createdAt: string;
  updatedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'report' | 'reminder' | 'system';
  relatedId?: string;
  isRead: boolean;
  createdAt: string;
}

export function hasPermission(user: StaffMember | null, permission: StaffPermission): boolean {
  if (!user) return false;
  if (user.role === 'admin' || user.role === 'principal') return true;
  if (user.role === 'guidance' && permission !== 'manage_permissions') return true;
  return user.permissions.includes(permission);
}

export function canAccessAllData(user: StaffMember | null): boolean {
  if (!user) return false;
  return user.role === 'admin' || user.role === 'principal' || user.role === 'guidance';
}

export function canRemoveStudents(user: StaffMember | null): boolean {
  if (!user) return false;
  return user.role === 'admin' || user.role === 'principal';
}

export function canManageGradesSections(user: StaffMember | null): boolean {
  if (!user) return false;
  return user.role === 'admin' || user.role === 'principal' || user.role === 'guidance';
}

export function canManageReports(user: StaffMember | null): boolean {
  if (!user) return false;
  return user.role === 'admin' || user.role === 'principal' || user.role === 'guidance';
}

export function canManageBuildings(user: StaffMember | null): boolean {
  if (!user) return false;
  return user.role === 'admin' || user.role === 'principal' || user.role === 'guidance';
}

export type LiveIncidentStatus = 'active' | 'responding' | 'resolved';

export interface LiveIncidentResponder {
  id: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  respondedAt: string;
}

export interface LiveIncident {
  id: string;
  reporterId: string;
  reporterName: string;
  reporterGradeLevelId: string;
  reporterSectionId: string;
  buildingId: string;
  buildingName: string;
  floor: string;
  room: string;
  incidentType: string;
  description: string;
  status: LiveIncidentStatus;
  responders: LiveIncidentResponder[];
  createdAt: string;
  resolvedAt?: string;
  resolvedBy?: string;
  resolvedByName?: string;
}

export function canRespondToLiveIncidents(user: StaffMember | null): boolean {
  if (!user) return false;
  return user.role === 'admin' || user.role === 'principal' || user.role === 'guidance' || user.role === 'teacher';
}
