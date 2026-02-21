export interface IncidentTypeItem {
  value: string;
  label: string;
  color?: string;
}

export const INCIDENT_TYPES: IncidentTypeItem[] = [
  { value: 'bullying', label: 'Bullying', color: '#EF4444' },
  { value: 'physical_assault', label: 'Physical Assault', color: '#DC2626' },
  { value: 'fighting', label: 'Fighting', color: '#F97316' },
  { value: 'harassment', label: 'Harassment', color: '#F59E0B' },
  { value: 'verbal_abuse', label: 'Verbal Abuse', color: '#FB923C' },
  { value: 'cyberbullying', label: 'Cyberbullying', color: '#8B5CF6' },
  { value: 'sexual_harassment', label: 'Sexual Harassment', color: '#BE185D' },
  { value: 'other', label: 'Other', color: '#64748B' },
];

export const BUILDINGS = ['A', 'B', 'C', 'D'];
export const FLOORS = ['1st', '2nd', '3rd', '4th'];
export const ROOMS = Array.from({ length: 20 }, (_, i) => String(i + 1).padStart(2, '0'));

export const STATUS_COLORS: Record<string, string> = {
  under_review: '#F59E0B',
  accepted: '#10B981',
  declined: '#EF4444',
};

export default {
  INCIDENT_TYPES,
  BUILDINGS,
  FLOORS,
  ROOMS,
  STATUS_COLORS,
};
