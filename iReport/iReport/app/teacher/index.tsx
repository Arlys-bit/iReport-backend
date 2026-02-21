import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Users, FileText, Bell, GraduationCap, ChevronRight, ChevronLeft } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useReports } from '@/contexts/ReportContext';
import { useStudents } from '@/contexts/StudentsContext';
import { StaffMember, Student, IncidentReport } from '@/types';
import colors from '@/constants/colors';

export default function TeacherDashboard() {
  const router = useRouter();
  const { currentUser } = useAuth();
  const { getReportsByTeacher, getUnreadNotificationCount } = useReports();
  const { students, gradeLevels, sections, getStudentsByTeacher } = useStudents();

  const staffMember = currentUser as StaffMember;

  const myStudents = useMemo(() => {
    if (!staffMember?.id) return [];
    return getStudentsByTeacher(staffMember.id);
  }, [staffMember, getStudentsByTeacher]);

  const myReports = useMemo(() => {
    if (!staffMember?.id) return [];
    return getReportsByTeacher(staffMember.id);
  }, [staffMember, getReportsByTeacher]);

  const pendingReports = useMemo(() => {
    return myReports.filter(r => r.status === 'under_review');
  }, [myReports]);

  const assignedSections = useMemo(() => {
    if (!staffMember?.assignedSectionIds) return [];
    return sections.filter(s => staffMember.assignedSectionIds?.includes(s.id));
  }, [staffMember, sections]);

  const unreadCount = staffMember?.id ? getUnreadNotificationCount(staffMember.id) : 0;

  

  const getGradeName = (gradeId: string) => gradeLevels.find(g => g.id === gradeId)?.name || 'Unknown';

  const groupedStudents = useMemo(() => {
    const grouped: Record<string, Student[]> = {};
    myStudents.forEach(student => {
      if (!grouped[student.sectionId]) {
        grouped[student.sectionId] = [];
      }
      grouped[student.sectionId].push(student);
    });
    return grouped;
  }, [myStudents]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Welcome back,</Text>
          <Text style={styles.name}>{currentUser?.fullName}</Text>
          <Text style={styles.role}>
            {staffMember?.specialization?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} Teacher
          </Text>
        </View>
        <View style={styles.headerActions}>
          {unreadCount > 0 && (
            <View style={styles.notificationBadge}>
              <Bell size={20} color={colors.text} />
              <View style={styles.badgeDot}>
                <Text style={styles.badgeCount}>{unreadCount}</Text>
              </View>
            </View>
          )}
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.replace('/selector')}
          >
            <ChevronLeft size={20} color={colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#D1FAE5' }]}>
              <Users size={22} color="#10B981" />
            </View>
            <Text style={styles.statNumber}>{myStudents.length}</Text>
            <Text style={styles.statLabel}>My Students</Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#DBEAFE' }]}>
              <FileText size={22} color="#3B82F6" />
            </View>
            <Text style={styles.statNumber}>{myReports.length}</Text>
            <Text style={styles.statLabel}>Reports</Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#FEF3C7' }]}>
              <GraduationCap size={22} color="#F59E0B" />
            </View>
            <Text style={styles.statNumber}>{assignedSections.length}</Text>
            <Text style={styles.statLabel}>Sections</Text>
          </View>
        </View>

        {pendingReports.length > 0 && (
          <View style={styles.alertSection}>
            <View style={styles.alertCard}>
              <FileText size={20} color="#DC2626" />
              <View style={styles.alertContent}>
                <Text style={styles.alertTitle}>Pending Reports</Text>
                <Text style={styles.alertText}>
                  {pendingReports.length} report{pendingReports.length > 1 ? 's' : ''} from your students need attention
                </Text>
              </View>
            </View>
          </View>
        )}

        {assignedSections.length > 0 && (
          <View style={styles.sectionsSection}>
            <Text style={styles.sectionTitle}>My Sections</Text>
            {assignedSections.map(section => {
              const sectionStudents = groupedStudents[section.id] || [];
              const grade = gradeLevels.find(g => g.id === section.gradeLevelId);
              
              return (
                <View key={section.id} style={styles.sectionCard}>
                  <View style={styles.sectionHeader}>
                    <View>
                      <Text style={styles.sectionName}>{grade?.name} - Section {section.name}</Text>
                      <Text style={styles.sectionStudentCount}>
                        {sectionStudents.length} student{sectionStudents.length !== 1 ? 's' : ''}
                      </Text>
                    </View>
                  </View>
                  
                  {sectionStudents.slice(0, 3).map(student => (
                    <TouchableOpacity
                      key={student.id}
                      style={styles.studentRow}
                      onPress={() => router.push(`/teacher/students/${student.id}` as any)}
                    >
                      {student.profilePhoto ? (
                        <Image source={{ uri: student.profilePhoto }} style={styles.studentPhoto} />
                      ) : (
                        <View style={styles.studentPhotoPlaceholder}>
                          <Text style={styles.studentInitial}>
                            {student.fullName.charAt(0).toUpperCase()}
                          </Text>
                        </View>
                      )}
                      <View style={styles.studentInfo}>
                        <Text style={styles.studentName}>{student.fullName}</Text>
                        <Text style={styles.studentLrn}>LRN: {student.lrn}</Text>
                      </View>
                      <ChevronRight size={18} color={colors.textLight} />
                    </TouchableOpacity>
                  ))}
                  
                  {sectionStudents.length > 3 && (
                    <Text style={styles.moreStudents}>
                      +{sectionStudents.length - 3} more students
                    </Text>
                  )}
                </View>
              );
            })}
          </View>
        )}

        {myReports.length > 0 && (
          <View style={styles.reportsSection}>
            <Text style={styles.sectionTitle}>Recent Reports</Text>
            {myReports.slice(0, 5).map((report: IncidentReport) => (
              <TouchableOpacity
                key={report.id}
                style={styles.reportCard}
                onPress={() => router.push(`/teacher/reports/${report.id}` as any)}
              >
                <View style={styles.reportHeader}>
                  <View style={[styles.reportTypeBadge, { backgroundColor: getTypeColor(report.incidentType) + '20' }]}>
                    <Text style={[styles.reportTypeText, { color: getTypeColor(report.incidentType) }]}>
                      {(report.incidentType || 'unknown').replace(/_/g, ' ')}
                    </Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(report.status) + '20' }]}>
                    <Text style={[styles.statusText, { color: getStatusColor(report.status) }]}>
                      {(report.status || 'unknown').replace(/_/g, ' ')}
                    </Text>
                  </View>
                </View>
                <Text style={styles.reportVictim}>Victim: {report.victimName}</Text>
                <Text style={styles.reportDate}>
                  {new Date(report.createdAt).toLocaleDateString()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {myStudents.length === 0 && assignedSections.length === 0 && (
          <View style={styles.emptyState}>
            <GraduationCap size={48} color={colors.textLight} />
            <Text style={styles.emptyTitle}>No assigned sections yet</Text>
            <Text style={styles.emptyText}>
              Contact your administrator to get assigned to sections
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'under_review':
      return '#F59E0B';
    case 'accepted':
      return '#10B981';
    case 'declined':
      return '#EF4444';
    default:
      return '#64748B';
  }
}

function getTypeColor(type: string): string {
  switch (type) {
    case 'bullying':
    case 'physical_assault':
    case 'fighting':
      return '#EF4444';
    case 'harassment':
    case 'verbal_abuse':
      return '#F97316';
    case 'cyberbullying':
      return '#8B5CF6';
    default:
      return '#64748B';
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  greeting: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  name: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: colors.text,
    marginTop: 2,
  },
  role: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '500' as const,
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  notificationBadge: {
    position: 'relative',
    padding: 4,
  },
  badgeDot: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: colors.error,
    borderRadius: 10,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeCount: {
    fontSize: 10,
    fontWeight: '600' as const,
    color: colors.surface,
  },
  backButton: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  statIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: colors.text,
  },
  statLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  alertSection: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  alertCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    borderRadius: 12,
    padding: 14,
    gap: 12,
  },
  alertContent: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#991B1B',
    marginBottom: 2,
  },
  alertText: {
    fontSize: 13,
    color: '#B91C1C',
  },
  sectionsSection: {
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: colors.text,
    marginBottom: 12,
  },
  sectionCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  sectionName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.text,
  },
  sectionStudentCount: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  studentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  studentPhoto: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  studentPhotoPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  studentInitial: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.surface,
  },
  studentInfo: {
    flex: 1,
    marginLeft: 12,
  },
  studentName: {
    fontSize: 15,
    fontWeight: '500' as const,
    color: colors.text,
  },
  studentLrn: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 1,
  },
  moreStudents: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '500' as const,
    textAlign: 'center',
    marginTop: 12,
  },
  reportsSection: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  reportCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  reportTypeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  reportTypeText: {
    fontSize: 11,
    fontWeight: '600' as const,
    textTransform: 'capitalize' as const,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600' as const,
    textTransform: 'capitalize' as const,
  },
  reportVictim: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '500' as const,
    marginBottom: 4,
  },
  reportDate: {
    fontSize: 12,
    color: colors.textLight,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 48,
    marginTop: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
