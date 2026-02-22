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
import { FileText, ChevronLeft, User, Plus, Clock, CheckCircle, XCircle, Phone, ChevronRight } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useReports } from '@/contexts/ReportContext';
import { useStudents } from '@/contexts/StudentsContext';
import { useSettings } from '@/contexts/SettingsContext';
import { Student, IncidentReport } from '@/types';

export default function StudentDashboard() {
  const router = useRouter();
  const { currentUser, logout } = useAuth();
  const { getReportsByStudent } = useReports();
  const { gradeLevels, sections } = useStudents();
  const { colors, isDark } = useSettings();

  const student = currentUser as Student;

  const myReports = useMemo(() => {
    if (!student?.id) return [];
    return getReportsByStudent(student.id);
  }, [student, getReportsByStudent]);

  const pendingReports = myReports.filter(r => r.status === 'under_review');
  const acceptedReports = myReports.filter(r => r.status === 'accepted');
  const declinedReports = myReports.filter(r => r.status === 'declined');

  const currentGrade = gradeLevels.find(g => g.id === student?.gradeLevelId);
  const currentSection = sections.find(s => s.id === student?.sectionId);

  const handleLogout = async () => {
    await logout();
    router.replace('/login');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.borderLight }]}>
        <View style={styles.headerLeft}>
          <View>
            {student?.profilePhoto ? (
              <Image source={{ uri: student.profilePhoto }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatarPlaceholder, { backgroundColor: colors.primary }]}>
                <User size={24} color={colors.surface} />
              </View>
            )}
          </View>
          <View style={styles.headerInfo}>
            <Text style={[styles.greeting, { color: colors.textSecondary }]}>Hello,</Text>
            <Text style={[styles.name, { color: colors.text }]}>{student?.fullName}</Text>
            <Text style={[styles.grade, { color: colors.primary }]}>
              {currentGrade?.name} - Section {currentSection?.name}
            </Text>
          </View>
        </View>
        <TouchableOpacity 
          style={styles.logoutButton} 
          onPress={() => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace('/selector');
            }
          }}
        >
          <ChevronLeft size={20} color={colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.reportButton, { backgroundColor: colors.primary }]}
            onPress={() => router.push('/student/report' as any)}
          >
            <View style={[styles.reportButtonIcon, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
              <Plus size={24} color={colors.surface} />
            </View>
            <View style={styles.reportButtonContent}>
              <Text style={[styles.reportButtonTitle, { color: colors.surface }]}>Report an Incident</Text>
              <Text style={[styles.reportButtonSubtitle, { color: 'rgba(255,255,255,0.8)' }]}>
                Submit a report about bullying or other incidents
              </Text>
            </View>
          </TouchableOpacity>

        </View>

        <View style={[styles.statsRow, { backgroundColor: colors.surface }]}>
          <View style={styles.statItem}>
            <View style={[styles.statIconContainer, { backgroundColor: isDark ? '#1E3A8A' : '#FEF3C7' }]}>
              <Clock size={18} color={isDark ? '#93C5FD' : '#F59E0B'} />
            </View>
            <Text style={[styles.statValue, { color: colors.text }]}>{pendingReports.length}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Under Review</Text>
          </View>
          <View style={styles.statItem}>
            <View style={[styles.statIconContainer, { backgroundColor: isDark ? '#064E3B' : '#D1FAE5' }]}>
              <CheckCircle size={18} color={isDark ? '#6EE7B7' : '#10B981'} />
            </View>
            <Text style={[styles.statValue, { color: colors.text }]}>{acceptedReports.length}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Accepted</Text>
          </View>
          <View style={styles.statItem}>
            <View style={[styles.statIconContainer, { backgroundColor: isDark ? '#7F1D1D' : '#FEE2E2' }]}>
              <XCircle size={18} color={isDark ? '#FCA5A5' : '#EF4444'} />
            </View>
            <Text style={[styles.statValue, { color: colors.text }]}>{declinedReports.length}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Declined</Text>
          </View>
        </View>

        <View style={styles.reportsSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>My Reports</Text>
          
          {myReports.length === 0 ? (
            <View style={[styles.emptyReports, { backgroundColor: colors.surface }]}>
              <FileText size={40} color={colors.textLight} />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>No reports yet</Text>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                When you submit a report, it will appear here
              </Text>
            </View>
          ) : (
            myReports.map((report: IncidentReport) => (
              <TouchableOpacity 
                key={report.id} 
                style={[styles.reportCard, { backgroundColor: colors.surface }]}
                onPress={() => router.push(`/student/reports/${report.id}` as any)}
                activeOpacity={0.7}
              >
                <View style={styles.reportCardHeader}>
                  <View style={[styles.typeBadge, { backgroundColor: getTypeColor(report.incidentType) + '20' }]}>
                    <Text style={[styles.typeBadgeText, { color: getTypeColor(report.incidentType) }]}>
                      {(report.incidentType || 'unknown').replace(/_/g, ' ')}
                    </Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(report.status) + '20' }]}>
                    <Text style={[styles.statusBadgeText, { color: getStatusColor(report.status) }]}>
                      {(report.status || 'unknown').replace(/_/g, ' ')}
                    </Text>
                  </View>
                </View>
                <Text style={[styles.reportCardVictim, { color: colors.text }]}>
                  {report.reportingForSelf ? 'Self-report' : `Victim: ${report.victimName}`}
                </Text>
                <Text style={[styles.reportCardLocation, { color: colors.textSecondary }]}>
                  Building {report.location.building} • {report.location.floor} Floor • {report.location.room}
                </Text>
                <View style={styles.reportCardFooter}>
                  <Text style={[styles.reportCardDate, { color: colors.textLight }]}>
                    Submitted {new Date(report.createdAt).toLocaleDateString()}
                  </Text>
                  <ChevronRight size={16} color={colors.textLight} />
                </View>
                
                {report.status === 'declined' && report.declineReason && (
                  <View style={[styles.declineReasonBox, { backgroundColor: isDark ? '#7F1D1D' : '#FEE2E2' }]}>
                    <Text style={[styles.declineReasonLabel, { color: isDark ? '#FCA5A5' : '#991B1B' }]}>Reason:</Text>
                    <Text style={[styles.declineReasonText, { color: isDark ? '#FECACA' : '#B91C1C' }]}>{report.declineReason}</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))
          )}
        </View>

        <View style={[styles.infoSection, { backgroundColor: isDark ? '#1E3A8A' : '#DBEAFE' }]}>
          <Text style={[styles.infoTitle, { color: isDark ? '#93C5FD' : '#1E40AF' }]}>Need Help?</Text>
          <Text style={[styles.infoText, { color: isDark ? '#93C5FD' : '#1E40AF' }]}>
            If you are experiencing bullying or any form of harassment, please do not hesitate to report it. 
            All reports can be submitted anonymously if you prefer.
          </Text>
          <Text style={[styles.infoText, { color: isDark ? '#93C5FD' : '#1E40AF' }]}>
            Your safety and well-being are our top priority.
          </Text>
        </View>
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
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerInfo: {
    marginLeft: 14,
  },
  greeting: {
    fontSize: 13,
  },
  name: {
    fontSize: 18,
    fontWeight: '700' as const,
  },
  grade: {
    fontSize: 12,
    fontWeight: '500' as const,
    marginTop: 1,
  },
  logoutButton: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  actionButtons: {
    paddingHorizontal: 16,
    marginTop: 20,
    gap: 12,
  },
  reportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: 18,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  reportButtonIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reportButtonContent: {
    flex: 1,
    marginLeft: 14,
  },
  reportButtonTitle: {
    fontSize: 17,
    fontWeight: '700' as const,
    marginBottom: 2,
  },
  reportButtonSubtitle: {
    fontSize: 13,
  },
  hotlineButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DC2626',
    borderRadius: 16,
    padding: 16,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  hotlineButtonIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hotlineButtonContent: {
    flex: 1,
    marginLeft: 14,
  },
  hotlineButtonTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#FFFFFF',
    marginBottom: 2,
  },
  hotlineButtonSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
  },
  statsRow: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 20,
    borderRadius: 14,
    padding: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700' as const,
  },
  statLabel: {
    fontSize: 11,
    marginTop: 2,
  },
  reportsSection: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    marginBottom: 14,
  },
  emptyReports: {
    alignItems: 'center',
    padding: 32,
    borderRadius: 14,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    marginTop: 12,
  },
  emptyText: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: 4,
  },
  reportCard: {
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  reportCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  typeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: '600' as const,
    textTransform: 'capitalize' as const,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '600' as const,
    textTransform: 'capitalize' as const,
  },
  reportCardVictim: {
    fontSize: 15,
    fontWeight: '600' as const,
    marginBottom: 4,
  },
  reportCardLocation: {
    fontSize: 13,
    marginBottom: 4,
  },
  reportCardDate: {
    fontSize: 12,
  },
  reportCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  declineReasonBox: {
    marginTop: 10,
    padding: 10,
    borderRadius: 8,
  },
  declineReasonLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    marginBottom: 2,
  },
  declineReasonText: {
    fontSize: 13,
  },
  infoSection: {
    margin: 16,
    marginTop: 24,
    padding: 18,
    borderRadius: 14,
    marginBottom: 32,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 6,
  },
});
