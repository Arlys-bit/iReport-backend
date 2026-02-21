import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  MapPin, 
  Calendar,
  User,
  AlertTriangle,
  FileText,
  Building,
} from 'lucide-react-native';
import { useReports } from '@/contexts/ReportContext';
import { useStudents } from '@/contexts/StudentsContext';
import colors from '@/constants/colors';

export default function StudentReportDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { reports } = useReports();
  const { gradeLevels, sections } = useStudents();

  const report = useMemo(() => {
    return reports.find(r => r.id === id);
  }, [reports, id]);

  if (!report) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyState}>
          <FileText size={48} color={colors.textLight} />
          <Text style={styles.emptyTitle}>Report not found</Text>
          <Text style={styles.emptyText}>
            This report may have been removed or does not exist.
          </Text>
        </View>
      </View>
    );
  }

  const gradeLevel = gradeLevels.find(g => g.id === report.reporterGradeLevelId);
  const section = sections.find(s => s.id === report.reporterSectionId);

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'under_review':
        return { 
          icon: Clock, 
          color: '#F59E0B', 
          bgColor: '#FEF3C7',
          label: 'Under Review' 
        };
      case 'accepted':
        return { 
          icon: CheckCircle, 
          color: '#10B981', 
          bgColor: '#D1FAE5',
          label: 'Accepted' 
        };
      case 'declined':
        return { 
          icon: XCircle, 
          color: '#EF4444', 
          bgColor: '#FEE2E2',
          label: 'Declined' 
        };
      default:
        return { 
          icon: Clock, 
          color: '#64748B', 
          bgColor: '#F1F5F9',
          label: 'Unknown' 
        };
    }
  };

  const getTypeColor = (type: string): string => {
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
  };

  const getPriorityConfig = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return { color: '#DC2626', bgColor: '#FEE2E2', label: 'Urgent' };
      case 'high':
        return { color: '#EA580C', bgColor: '#FFEDD5', label: 'High' };
      case 'medium':
        return { color: '#F59E0B', bgColor: '#FEF3C7', label: 'Medium' };
      default:
        return { color: '#64748B', bgColor: '#F1F5F9', label: 'Low' };
    }
  };

  const statusConfig = getStatusConfig(report.status);
  const priorityConfig = getPriorityConfig(report.priority);
  const StatusIcon = statusConfig.icon;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={[styles.statusBanner, { backgroundColor: statusConfig.bgColor }]}>
        <StatusIcon size={24} color={statusConfig.color} />
        <View style={styles.statusBannerContent}>
          <Text style={[styles.statusBannerTitle, { color: statusConfig.color }]}>
            {statusConfig.label}
          </Text>
          <Text style={[styles.statusBannerSubtitle, { color: statusConfig.color }]}>
            {report.status === 'under_review' 
              ? 'Your report is being reviewed by staff'
              : report.status === 'accepted'
              ? 'Your report has been accepted and is being handled'
              : 'Your report was declined'
            }
          </Text>
        </View>
      </View>

      {report.status === 'declined' && report.declineReason && (
        <View style={styles.declineReasonSection}>
          <Text style={styles.declineReasonTitle}>Reason for Decline</Text>
          <Text style={styles.declineReasonText}>{report.declineReason}</Text>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Incident Information</Text>
        
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <View style={styles.infoLabel}>
              <AlertTriangle size={16} color={colors.textSecondary} />
              <Text style={styles.infoLabelText}>Type</Text>
            </View>
            <View style={[styles.typeBadge, { backgroundColor: getTypeColor(report.incidentType) + '20' }]}>
              <Text style={[styles.typeBadgeText, { color: getTypeColor(report.incidentType) }]}>
                {report.incidentType.replace(/_/g, ' ')}
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <View style={styles.infoLabel}>
              <AlertTriangle size={16} color={colors.textSecondary} />
              <Text style={styles.infoLabelText}>Priority</Text>
            </View>
            <View style={[styles.priorityBadge, { backgroundColor: priorityConfig.bgColor }]}>
              <Text style={[styles.priorityBadgeText, { color: priorityConfig.color }]}>
                {priorityConfig.label}
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <View style={styles.infoLabel}>
              <User size={16} color={colors.textSecondary} />
              <Text style={styles.infoLabelText}>Victim</Text>
            </View>
            <Text style={styles.infoValue}>
              {report.reportingForSelf ? 'Self-report' : report.victimName}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Location</Text>
        
        <View style={styles.infoCard}>
          <View style={styles.locationGrid}>
            <View style={styles.locationItem}>
              <Building size={18} color={colors.primary} />
              <Text style={styles.locationLabel}>Building</Text>
              <Text style={styles.locationValue}>{report.location.building}</Text>
            </View>
            <View style={styles.locationItem}>
              <MapPin size={18} color={colors.primary} />
              <Text style={styles.locationLabel}>Floor</Text>
              <Text style={styles.locationValue}>{report.location.floor}</Text>
            </View>
            <View style={styles.locationItem}>
              <FileText size={18} color={colors.primary} />
              <Text style={styles.locationLabel}>Room</Text>
              <Text style={styles.locationValue}>{report.location.room}</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Date & Time</Text>
        
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <View style={styles.infoLabel}>
              <Calendar size={16} color={colors.textSecondary} />
              <Text style={styles.infoLabelText}>Incident Date</Text>
            </View>
            <Text style={styles.infoValue}>
              {report.cantRememberDateTime 
                ? "Cannot remember" 
                : report.dateTime 
                  ? new Date(report.dateTime).toLocaleDateString('en-US', {
                      weekday: 'short',
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : 'Not specified'
              }
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <View style={styles.infoLabel}>
              <Clock size={16} color={colors.textSecondary} />
              <Text style={styles.infoLabelText}>Submitted</Text>
            </View>
            <Text style={styles.infoValue}>
              {new Date(report.createdAt).toLocaleDateString('en-US', {
                weekday: 'short',
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}
            </Text>
          </View>
        </View>
      </View>

      {report.description && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Description</Text>
          <View style={styles.descriptionCard}>
            <Text style={styles.descriptionText}>{report.description}</Text>
          </View>
        </View>
      )}

      {report.photoEvidence && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Photo Evidence</Text>
          <View style={styles.photoCard}>
            <Image 
              source={{ uri: report.photoEvidence }} 
              style={styles.evidencePhoto}
              resizeMode="cover"
            />
          </View>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Reporter Information</Text>
        
        <View style={styles.infoCard}>
          {report.isAnonymous ? (
            <View style={styles.anonymousBadge}>
              <User size={18} color="#6366F1" />
              <Text style={styles.anonymousText}>Submitted Anonymously</Text>
            </View>
          ) : (
            <>
              <View style={styles.infoRow}>
                <View style={styles.infoLabel}>
                  <User size={16} color={colors.textSecondary} />
                  <Text style={styles.infoLabelText}>Name</Text>
                </View>
                <Text style={styles.infoValue}>{report.reporterName}</Text>
              </View>

              <View style={styles.divider} />

              <View style={styles.infoRow}>
                <View style={styles.infoLabel}>
                  <FileText size={16} color={colors.textSecondary} />
                  <Text style={styles.infoLabelText}>LRN</Text>
                </View>
                <Text style={styles.infoValue}>{report.reporterLRN}</Text>
              </View>

              <View style={styles.divider} />

              <View style={styles.infoRow}>
                <View style={styles.infoLabel}>
                  <Building size={16} color={colors.textSecondary} />
                  <Text style={styles.infoLabelText}>Grade & Section</Text>
                </View>
                <Text style={styles.infoValue}>
                  {gradeLevel?.name || 'Unknown'} - Section {section?.name || 'Unknown'}
                </Text>
              </View>
            </>
          )}
        </View>
      </View>

      {report.reviewHistory && report.reviewHistory.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Review History</Text>
          <View style={styles.timelineCard}>
            {report.reviewHistory.map((history, index) => (
              <View key={history.id} style={styles.timelineItem}>
                <View style={styles.timelineDot} />
                {index < report.reviewHistory.length - 1 && (
                  <View style={styles.timelineLine} />
                )}
                <View style={styles.timelineContent}>
                  <Text style={styles.timelineAction}>
                    {history.action.replace(/_/g, ' ')}
                  </Text>
                  {history.notes && (
                    <Text style={styles.timelineNotes}>{history.notes}</Text>
                  )}
                  <Text style={styles.timelineDate}>
                    {new Date(history.timestamp).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      )}

      <View style={styles.bottomPadding} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 48,
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
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    margin: 16,
    borderRadius: 14,
    gap: 14,
  },
  statusBannerContent: {
    flex: 1,
  },
  statusBannerTitle: {
    fontSize: 17,
    fontWeight: '700' as const,
    marginBottom: 2,
  },
  statusBannerSubtitle: {
    fontSize: 13,
    opacity: 0.8,
  },
  declineReasonSection: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    backgroundColor: '#FEE2E2',
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
  },
  declineReasonTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#991B1B',
    marginBottom: 6,
  },
  declineReasonText: {
    fontSize: 14,
    color: '#B91C1C',
    lineHeight: 20,
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: colors.text,
    marginBottom: 12,
  },
  infoCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 16,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  infoLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoLabelText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: colors.text,
    textAlign: 'right',
    flex: 1,
    marginLeft: 12,
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginVertical: 12,
  },
  typeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  typeBadgeText: {
    fontSize: 12,
    fontWeight: '600' as const,
    textTransform: 'capitalize' as const,
  },
  priorityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  priorityBadgeText: {
    fontSize: 12,
    fontWeight: '600' as const,
  },
  locationGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  locationItem: {
    alignItems: 'center',
    flex: 1,
  },
  locationLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 6,
  },
  locationValue: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.text,
    marginTop: 2,
  },
  descriptionCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 16,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  descriptionText: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 22,
  },
  photoCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  evidencePhoto: {
    width: '100%',
    height: 200,
  },
  anonymousBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 8,
    backgroundColor: '#EEF2FF',
    borderRadius: 8,
  },
  anonymousText: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: '#6366F1',
  },
  timelineCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 16,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  timelineItem: {
    flexDirection: 'row',
    position: 'relative',
    paddingBottom: 16,
  },
  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
    marginTop: 4,
  },
  timelineLine: {
    position: 'absolute',
    left: 4,
    top: 16,
    bottom: 0,
    width: 2,
    backgroundColor: colors.borderLight,
  },
  timelineContent: {
    flex: 1,
    marginLeft: 14,
  },
  timelineAction: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.text,
    textTransform: 'capitalize' as const,
  },
  timelineNotes: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 4,
  },
  timelineDate: {
    fontSize: 12,
    color: colors.textLight,
    marginTop: 4,
  },
  bottomPadding: {
    height: 32,
  },
});
