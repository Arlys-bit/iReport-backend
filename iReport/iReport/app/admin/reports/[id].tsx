import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { 
  Calendar, 
  User, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  MessageSquare,
  X,
  Clock,
} from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useReports } from '@/contexts/ReportContext';
import { useStudents } from '@/contexts/StudentsContext';
import { IncidentReport, ReportStatus, StaffMember } from '@/types';
import { INCIDENT_TYPES, STATUS_COLORS } from '@/constants/school';
import colors from '@/constants/colors';

export default function ReportDetails() {
  const { id } = useLocalSearchParams();
  const { currentUser } = useAuth();
  const { reports, updateReportStatus, addReviewNote, isUpdatingStatus } = useReports();
  const { gradeLevels, sections } = useStudents();

  const report = useMemo(() => reports.find(r => r.id === id), [reports, id]);

  const [showActionModal, setShowActionModal] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [selectedAction, setSelectedAction] = useState<'accepted' | 'declined' | null>(null);
  const [notes, setNotes] = useState('');
  const [declineReason, setDeclineReason] = useState('');

  const staffMember = currentUser as StaffMember;

  if (!report) {
    return (
      <SafeAreaView style={styles.container}>
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

  const handleAction = async () => {
    if (!selectedAction) return;

    if (selectedAction === 'declined' && !declineReason.trim()) {
      Alert.alert('Error', 'Please provide a reason for declining');
      return;
    }

    try {
      await updateReportStatus({
        reportId: report.id,
        status: selectedAction,
        reviewerId: staffMember.id,
        reviewerName: staffMember.fullName,
        notes: notes.trim() || undefined,
        declineReason: selectedAction === 'declined' ? declineReason.trim() : undefined,
      });
      setShowActionModal(false);
      setNotes('');
      setDeclineReason('');
      setSelectedAction(null);
      Alert.alert('Success', `Report ${selectedAction}`);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update report');
    }
  };

  const handleAddNote = async () => {
    if (!notes.trim()) {
      Alert.alert('Error', 'Please enter a note');
      return;
    }

    try {
      await addReviewNote({
        reportId: report.id,
        reviewerId: staffMember.id,
        reviewerName: staffMember.fullName,
        notes: notes.trim(),
      });
      setShowNoteModal(false);
      setNotes('');
      Alert.alert('Success', 'Note added');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to add note');
    }
  };

  const getStatusColor = (status: ReportStatus) => {
    switch (status) {
      case 'under_review': return '#F59E0B';
      case 'accepted': return '#10B981';
      case 'declined': return '#EF4444';
      default: return '#64748B';
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
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
              <CheckCircle size={18} color={colors.success} />
              <Text style={styles.infoText}>
                Reviewed: {new Date(report.reviewedAt).toLocaleString()}
              </Text>
            </View>
          )}
        </View>

        {report.reviewHistory && report.reviewHistory.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Review History</Text>
            {report.reviewHistory.map((entry, index) => (
              <View key={entry.id || index} style={styles.historyItem}>
                <View style={styles.historyDot} />
                <View style={styles.historyContent}>
                  <Text style={styles.historyAction}>
                    {entry.action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </Text>
                  <Text style={styles.historyBy}>by {entry.reviewerName}</Text>
                  {entry.notes && (
                    <Text style={styles.historyNotes}>{entry.notes}</Text>
                  )}
                  <Text style={styles.historyTime}>
                    {new Date(entry.timestamp).toLocaleString()}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {report.declineReason && (
          <View style={styles.declineBox}>
            <AlertTriangle size={18} color="#991B1B" />
            <View style={styles.declineContent}>
              <Text style={styles.declineLabel}>Decline Reason:</Text>
              <Text style={styles.declineText}>{report.declineReason}</Text>
            </View>
          </View>
        )}
      </ScrollView>

      {report.status === 'under_review' && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.addNoteButton}
            onPress={() => setShowNoteModal(true)}
          >
            <MessageSquare size={18} color={colors.primary} />
            <Text style={styles.addNoteButtonText}>Add Note</Text>
          </TouchableOpacity>
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.actionButton, styles.declineButton]}
              onPress={() => {
                setSelectedAction('declined');
                setShowActionModal(true);
              }}
            >
              <XCircle size={18} color="#EF4444" />
              <Text style={styles.declineButtonText}>Decline</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.acceptButton]}
              onPress={() => {
                setSelectedAction('accepted');
                setShowActionModal(true);
              }}
            >
              <CheckCircle size={18} color={colors.surface} />
              <Text style={styles.acceptButtonText}>Accept</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <Modal visible={showActionModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer} edges={['top', 'bottom']}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {selectedAction === 'accepted' ? 'Accept Report' : 'Decline Report'}
            </Text>
            <TouchableOpacity onPress={() => setShowActionModal(false)}>
              <X size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
          <View style={styles.modalContent}>
            {selectedAction === 'declined' && (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Reason for Declining <Text style={styles.required}>*</Text></Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={declineReason}
                  onChangeText={setDeclineReason}
                  placeholder="Explain why this report is being declined..."
                  placeholderTextColor={colors.textLight}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              </View>
            )}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Notes (Optional)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={notes}
                onChangeText={setNotes}
                placeholder="Add any additional notes..."
                placeholderTextColor={colors.textLight}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>
            <TouchableOpacity
              style={[
                styles.submitButton,
                selectedAction === 'declined' ? styles.submitButtonDecline : styles.submitButtonAccept,
                isUpdatingStatus && styles.submitButtonDisabled,
              ]}
              onPress={handleAction}
              disabled={isUpdatingStatus}
            >
              {isUpdatingStatus ? (
                <ActivityIndicator color={colors.surface} />
              ) : (
                <Text style={styles.submitButtonText}>
                  {selectedAction === 'accepted' ? 'Accept Report' : 'Decline Report'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>

      <Modal visible={showNoteModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer} edges={['top', 'bottom']}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add Note</Text>
            <TouchableOpacity onPress={() => setShowNoteModal(false)}>
              <X size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
          <View style={styles.modalContent}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Note</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={notes}
                onChangeText={setNotes}
                placeholder="Enter your note..."
                placeholderTextColor={colors.textLight}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>
            <TouchableOpacity style={styles.submitButton} onPress={handleAddNote}>
              <Text style={styles.submitButtonText}>Add Note</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
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
    backgroundColor: colors.surface,
    margin: 16,
    padding: 16,
    borderRadius: 14,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  typeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  typeBadgeText: {
    fontSize: 13,
    fontWeight: '600' as const,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusBadgeText: {
    fontSize: 13,
    fontWeight: '600' as const,
    textTransform: 'capitalize' as const,
  },
  priorityRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priorityLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginRight: 8,
  },
  priorityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  priorityText: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: colors.surface,
  },
  section: {
    backgroundColor: colors.surface,
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    borderRadius: 14,
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
    gap: 10,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 15,
    color: colors.text,
    flex: 1,
  },
  selfReportNote: {
    fontSize: 13,
    color: colors.primary,
    fontStyle: 'italic' as const,
    marginTop: 4,
  },
  descriptionText: {
    fontSize: 15,
    color: colors.text,
    lineHeight: 22,
  },
  reporterCard: {
    backgroundColor: colors.background,
    borderRadius: 10,
    padding: 14,
  },
  anonymousBadge: {
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  anonymousText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.surface,
  },
  reporterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
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
    marginLeft: 12,
    flex: 1,
  },
  reporterName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.text,
  },
  reporterDetails: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  historyItem: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  historyDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
    marginTop: 4,
    marginRight: 12,
  },
  historyContent: {
    flex: 1,
  },
  historyAction: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.text,
  },
  historyBy: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  historyNotes: {
    fontSize: 13,
    color: colors.text,
    marginTop: 6,
    fontStyle: 'italic' as const,
  },
  historyTime: {
    fontSize: 12,
    color: colors.textLight,
    marginTop: 4,
  },
  declineBox: {
    flexDirection: 'row',
    backgroundColor: '#FEE2E2',
    margin: 16,
    padding: 14,
    borderRadius: 12,
    gap: 10,
  },
  declineContent: {
    flex: 1,
  },
  declineLabel: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#991B1B',
    marginBottom: 4,
  },
  declineText: {
    fontSize: 14,
    color: '#B91C1C',
  },
  footer: {
    padding: 16,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  addNoteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 10,
  },
  addNoteButtonText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: colors.primary,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 10,
  },
  declineButton: {
    backgroundColor: '#FEE2E2',
  },
  declineButtonText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#EF4444',
  },
  acceptButton: {
    backgroundColor: '#10B981',
  },
  acceptButtonText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: colors.surface,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: colors.text,
  },
  modalContent: {
    padding: 24,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.text,
    marginBottom: 8,
  },
  required: {
    color: colors.error,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: colors.text,
  },
  textArea: {
    minHeight: 100,
    paddingTop: 14,
  },
  submitButton: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonAccept: {
    backgroundColor: '#10B981',
  },
  submitButtonDecline: {
    backgroundColor: '#EF4444',
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: colors.surface,
  },
});
