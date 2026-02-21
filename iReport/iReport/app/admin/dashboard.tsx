import React from 'react';
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
import { Users, FileText, Map, UserCog, FolderOpen, AlertTriangle, ChevronLeft } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useReports } from '@/contexts/ReportContext';
import { useStaff } from '@/contexts/StaffContext';
import { useStudents } from '@/contexts/StudentsContext';
import { useSettings } from '@/contexts/SettingsContext';
import { IncidentReport, StaffMember } from '@/types';
import { ChevronRight } from 'lucide-react-native';

export default function AdminDashboard() {
  const router = useRouter();
  const { currentUser } = useAuth();
  const { reports, getPendingReports, getOverdueReports } = useReports();
  const { staff } = useStaff();
  const { students, gradeLevels, sections } = useStudents();
  const { colors, isDark } = useSettings();

  const pendingReports = getPendingReports();
  const overdueReports = getOverdueReports();
  

  const staffMember = currentUser as StaffMember;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.borderLight }]}>
        <View>
          <Text style={[styles.greeting, { color: colors.textSecondary }]}>Welcome back,</Text>
          <Text style={[styles.name, { color: colors.text }]}>{currentUser?.fullName}</Text>
          <Text style={[styles.role, { color: colors.primary }]}>
            {staffMember?.position?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.replace('/selector')}
        >
          <ChevronRight size={20} color={colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {overdueReports.length > 0 && (
          <View style={[styles.alertBanner, { backgroundColor: isDark ? '#1E3A8A' : '#FEF3C7' }]}>
            <AlertTriangle size={20} color={isDark ? '#93C5FD' : '#92400E'} />
            <Text style={[styles.alertText, { color: isDark ? '#93C5FD' : '#92400E' }]}>
              {overdueReports.length} report{overdueReports.length > 1 ? 's' : ''} pending for more than 3 days
            </Text>
          </View>
        )}

        <View style={styles.statsContainer}>
          <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
            <View style={[styles.statIcon, { backgroundColor: isDark ? '#1E3A8A' : '#DBEAFE' }]}>
              <FileText size={24} color={isDark ? '#93C5FD' : '#3B82F6'} />
            </View>
            <Text style={[styles.statNumber, { color: colors.text }]}>{reports.length}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Total Reports</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
            <View style={[styles.statIcon, { backgroundColor: isDark ? '#064E3B' : '#D1FAE5' }]}>
              <Users size={24} color={isDark ? '#6EE7B7' : '#10B981'} />
            </View>
            <Text style={[styles.statNumber, { color: colors.text }]}>{students.length}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Students</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
            <View style={[styles.statIcon, { backgroundColor: isDark ? '#78350F' : '#FEF3C7' }]}>
              <UserCog size={24} color={isDark ? '#FCD34D' : '#F59E0B'} />
            </View>
            <Text style={[styles.statNumber, { color: colors.text }]}>{staff.length}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Staff</Text>
          </View>
        </View>

        <View style={[styles.quickStatsRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.quickStat}>
            <Text style={[styles.quickStatNumber, { color: colors.text }]}>{pendingReports.length}</Text>
            <Text style={[styles.quickStatLabel, { color: colors.textSecondary }]}>Pending Reviews</Text>
          </View>
          <View style={[styles.quickStatDivider, { backgroundColor: colors.borderLight }]} />
          <View style={styles.quickStat}>
            <Text style={[styles.quickStatNumber, { color: colors.text }]}>{gradeLevels.length}</Text>
            <Text style={[styles.quickStatLabel, { color: colors.textSecondary }]}>Grade Levels</Text>
          </View>
          <View style={[styles.quickStatDivider, { backgroundColor: colors.borderLight }]} />
          <View style={styles.quickStat}>
            <Text style={[styles.quickStatNumber, { color: colors.text }]}>{sections.length}</Text>
            <Text style={[styles.quickStatLabel, { color: colors.textSecondary }]}>Sections</Text>
          </View>
        </View>

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.surface }]}
            onPress={() => router.push('/admin/reports/' as any)}
            testID="view-reports-button"
          >
            <View style={[styles.actionIcon, { backgroundColor: isDark ? '#7F1D1D' : '#FEE2E2' }]}>
              <FileText size={24} color={isDark ? '#FCA5A5' : '#EF4444'} />
            </View>
            <View style={styles.actionContent}>
              <Text style={[styles.actionTitle, { color: colors.text }]}>View Reports</Text>
              <Text style={[styles.actionDescription, { color: colors.textSecondary }]}>
                Review all incident reports
              </Text>
            </View>
            {pendingReports.length > 0 && (
              <View style={[styles.badge, { backgroundColor: colors.error }]}>
                <Text style={[styles.badgeText, { color: colors.surface }]}>{pendingReports.length}</Text>
              </View>
            )}
          </TouchableOpacity>

        {reports.length > 0 && (
          <View style={styles.recentSection}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent Reports</Text>
            {reports.slice(-3).reverse().map((report: IncidentReport) => (
              <TouchableOpacity
                key={report.id}
                style={[styles.reportCard, { backgroundColor: colors.surface }]}
                onPress={() => router.push(`/admin/reports/${report.id}` as any)}
              >
                <View style={styles.reportHeader}>
                  {report.reporterPhoto ? (
                    <Image
                      source={{ uri: report.reporterPhoto }}
                      style={styles.reporterPhoto}
                    />
                  ) : (
                    <View style={[styles.reporterPhotoPlaceholder, { backgroundColor: colors.primary }]}>
                      <Text style={[styles.reporterInitial, { color: colors.surface }]}>
                        {report.reporterName.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                  )}
                  <View style={styles.reportInfo}>
                    <View style={styles.reportTitleRow}>
                      <Text style={[styles.reportVictim, { color: colors.text }]} numberOfLines={1}>
                        {report.victimName}
                      </Text>
                      <View style={[styles.statusBadge, { backgroundColor: getStatusColor(report.status) + '20' }]}>
                        <Text style={[styles.statusBadgeText, { color: getStatusColor(report.status) }]}>
                          {report.status.replace(/_/g, ' ')}
                        </Text>
                      </View>
                    </View>
                    <Text style={[styles.reportLocation, { color: colors.textSecondary }]} numberOfLines={1}>
                      Building {report.location.building} • {report.location.floor} Floor
                    </Text>
                    <Text style={[styles.reportDate, { color: colors.textLight }]}>
                      {new Date(report.createdAt).toLocaleDateString()}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  greeting: {
    fontSize: 14,
  },
  name: {
    fontSize: 22,
    fontWeight: '700' as const,
    marginTop: 2,
  },
  role: {
    fontSize: 13,
    fontWeight: '500' as const,
    marginTop: 2,
  },
  backButton: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  alertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 14,
    borderRadius: 12,
    gap: 10,
  },
  alertText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500' as const,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  statCard: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700' as const,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  quickStatsRow: {
    flexDirection: 'row',
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
  },
  quickStat: {
    flex: 1,
    alignItems: 'center',
  },
  quickStatNumber: {
    fontSize: 20,
    fontWeight: '700' as const,
  },
  quickStatLabel: {
    fontSize: 11,
    marginTop: 2,
  },
  quickStatDivider: {
    width: 1,
    marginHorizontal: 8,
  },
  actionsContainer: {
    gap: 12,
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  actionButton: {
    flexDirection: 'row',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    gap: 16,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    marginHorizontal: 16,
    marginBottom: 20,
  },
  actionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    marginBottom: 4,
  },
  actionDescription: {
    fontSize: 14,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 24,
    alignItems: 'center',
  },
  badgeText: {
    fontSize: 13,
    fontWeight: '600' as const,
  },
  recentSection: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    marginBottom: 16,
  },
  reportCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  reportHeader: {
    flexDirection: 'row',
    gap: 12,
  },
  reporterPhoto: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  reporterPhotoPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reporterInitial: {
    fontSize: 20,
    fontWeight: '600' as const,
  },
  reportInfo: {
    flex: 1,
  },
  reportTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  reportVictim: {
    fontSize: 16,
    fontWeight: '600' as const,
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '600' as const,
    textTransform: 'capitalize' as const,
  },
  reportLocation: {
    fontSize: 14,
    marginBottom: 2,
  },
  reportDate: {
    fontSize: 12,
  },
});
