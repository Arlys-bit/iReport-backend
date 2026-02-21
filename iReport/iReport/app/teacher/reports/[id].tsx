import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { 
  Calendar, 
  User, 
  Clock,
  ChevronLeft,
} from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useReports } from '@/contexts/ReportContext';
import { useStudents } from '@/contexts/StudentsContext';
import { IncidentReport, StaffMember } from '@/types';
import { INCIDENT_TYPES, STATUS_COLORS } from '@/constants/school';
import colors from '@/constants/colors';

export default function TeacherReportDetails() {
  const { id } = useLocalSearchParams();
  const { currentUser } = useAuth();
  const { reports } = useReports();
  const { gradeLevels, sections } = useStudents();

  const report = useMemo(() => reports.find(r => r.id === id), [reports, id]);

  const staffMember = currentUser as StaffMember;

  if (!report) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.headerBar}>
          <TouchableOpacity onPress={() => router.back()}>
            <ChevronLeft size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Report Details</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Report not found</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const incidentInfo = INCIDENT_TYPES.find(t => t.value === report.incidentType);
  const reporterGrade = gradeLevels.find(g => g.id === report.reporterGradeLevelId);
  const reporterSection = sections.find(s => s.id === report.reporterSectionId);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'under_review': return '#F59E0B';
      case 'accepted': return '#10B981';
      case 'declined': return '#EF4444';
      default: return '#64748B';
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.headerBar}>
        <TouchableOpacity onPress={() => router.back()}>
          <ChevronLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Report Details</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.headerCard}>
          <View style={styles.headerTop}>
            <View style={[styles.typeBadge, { backgroundColor: incidentInfo?.color + '20' }]}>
              <Text style={[styles.typeBadgeText, { color: incidentInfo?.color }]}>
                {incidentInfo?.label || report.incidentType}
              </Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(report.status) + '20' }]}>
              <Text style={[styles.statusBadgeText, { color: getStatusColor(report.status) }]}>
                {report.status.replace(/_/g, ' ')}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Victim Information</Text>
          <View style={styles.infoRow}>
            <User size={18} color={colors.primary} />
            <Text style={styles.infoText}>{report.victimName}</Text>
          </View>
          {report.reportingForSelf && (
            <Text style={styles.selfReportNote}>Reporter is the victim</Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Time of Incident</Text>
          <View style={styles.infoRow}>
            <Clock size={18} color={colors.primary} />
            <Text style={styles.infoText}>
              {report.dateTime && !report.cantRememberDateTime ? report.dateTime : 'Student couldn\'t remember'}
            </Text>
          </View>
        </View>

        {report.description && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.descriptionText}>{report.description}</Text>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Reporter Details</Text>
          <View style={styles.reporterCard}>
            {report.isAnonymous ? (
              <View style={styles.anonymousBadge}>
                <Text style={styles.anonymousText}>Anonymous Report</Text>
              </View>
            ) : (
              <>
                <View style={styles.reporterHeader}>
                  {report.reporterPhoto ? (
                    <Image source={{ uri: report.reporterPhoto }} style={styles.reporterPhoto} />
                  ) : (
                    <View style={styles.reporterPhotoPlaceholder}>
                      <Text style={styles.reporterInitial}>
                        {report.reporterName.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                  )}
                  <View style={styles.reporterInfo}>
                    <Text style={styles.reporterName}>{report.reporterName}</Text>
                    <Text style={styles.reporterDetails}>LRN: {report.reporterLRN}</Text>
                    <Text style={styles.reporterDetails}>
                      {reporterGrade?.name} - Section {reporterSection?.name}
                    </Text>
                  </View>
                </View>
              </>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Timeline</Text>
          <View style={styles.infoRow}>
            <Calendar size={18} color={colors.primary} />
            <Text style={styles.infoText}>
              Submitted: {new Date(report.createdAt).toLocaleString()}
            </Text>
          </View>
          {report.reviewedAt && (
            <View style={styles.infoRow}>
              <Calendar size={18} color={colors.success} />
              <Text style={styles.infoText}>
                Reviewed: {new Date(report.reviewedAt).toLocaleString()}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.infoBoxTitle}>Teacher View</Text>
          <Text style={styles.infoBoxText}>
            This report has been submitted to administration for review. You can monitor the status and any updates made to this report.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: colors.text,
  },
  content: {
    flex: 1,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  errorText: {
    fontSize: 18,
    color: colors.text,
    marginBottom: 16,
  },
  backButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: colors.surface,
    fontSize: 16,
    fontWeight: '600' as const,
  },
  headerCard: {
    padding: 16,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  headerTop: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  typeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  typeBadgeText: {
    fontSize: 12,
    fontWeight: '600' as const,
    textTransform: 'capitalize' as const,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '600' as const,
    textTransform: 'capitalize' as const,
  },
  priorityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  priorityLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.text,
  },
  priorityBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 6,
  },
  priorityText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: colors.surface,
  },
  section: {
    padding: 16,
    backgroundColor: colors.surface,
    marginVertical: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.text,
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
  },
  selfReportNote: {
    fontSize: 13,
    color: colors.warning,
    fontWeight: '500' as const,
    marginTop: 8,
    paddingLeft: 30,
  },
  descriptionText: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 22,
  },
  reporterCard: {
    backgroundColor: colors.background,
    borderRadius: 10,
    padding: 12,
  },
  reporterHeader: {
    flexDirection: 'row',
    gap: 12,
  },
  reporterPhoto: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  reporterPhotoPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reporterInitial: {
    fontSize: 20,
    fontWeight: '600' as const,
    color: colors.surface,
  },
  reporterInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  reporterName: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: colors.text,
    marginBottom: 4,
  },
  reporterDetails: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  anonymousBadge: {
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  anonymousText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.text,
  },
  infoBox: {
    margin: 16,
    padding: 16,
    backgroundColor: colors.surface,
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  infoBoxTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.text,
    marginBottom: 8,
  },
  infoBoxText: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 20,
  },
});
