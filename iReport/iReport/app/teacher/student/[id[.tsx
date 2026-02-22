import React, { useMemo, useState } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Mail, IdCard, GraduationCap, User, AlertTriangle, Edit2, X } from 'lucide-react-native';
import { useStudents } from '@/contexts/StudentsContext';
import { useReports } from '@/contexts/ReportContext';
import { useAuth } from '@/contexts/AuthContext';
import { ViolationRecord, StaffMember } from '@/types';
import colors from '@/constants/colors';

export default function TeacherStudentProfile() {
  const { id } = useLocalSearchParams();
  const { students, gradeLevels, sections, updateStudent } = useStudents();
  const { reports } = useReports();
  const { currentUser } = useAuth();
  const staffMember = currentUser as StaffMember;
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editedFirstName, setEditedFirstName] = useState('');
  const [editedLastName, setEditedLastName] = useState('');
  const [editedEmail, setEditedEmail] = useState('');
  const [editedSchoolEmail, setEditedSchoolEmail] = useState('');

  const student = useMemo(() => students.find(s => s.id === id), [students, id]);

  // Check if teacher can VIEW this student
  // View access allowed if:
  // 1. Student is in assigned section, OR
  // 2. Has edit_any_student permission
  const hasViewAccess = useMemo(() => {
    if (!student || !staffMember?.assignedSectionIds || staffMember.assignedSectionIds.length === 0) {
      return staffMember?.permissions?.includes('edit_any_student') || false;
    }
    
    const isInAssignedSection = staffMember.assignedSectionIds.includes(student.sectionId);
    const canEditAnyStudent = staffMember.permissions?.includes('edit_any_student') || false;
    
    return isInAssignedSection || canEditAnyStudent;
  }, [student, staffMember]);

  // Check if teacher can EDIT this student
  // Edit access ONLY if:
  // 1. Student is in assigned section (no special permission needed), OR
  // 2. Has edit_any_student permission (can edit any student)
  const canEditStudent = useMemo(() => {
    if (!student || !staffMember?.assignedSectionIds) {
      return staffMember?.permissions?.includes('edit_any_student') || false;
    }
    
    const isInAssignedSection = staffMember.assignedSectionIds.includes(student.sectionId);
    const hasEditAnyPermission = staffMember?.permissions?.includes('edit_any_student') || false;
    
    return isInAssignedSection || hasEditAnyPermission;
  }, [student, staffMember]);

  const studentReports = useMemo(() => {
    return reports.filter(r => r.reporterId === id);
  }, [reports, id]);

  const currentGrade = useMemo(() => gradeLevels.find(g => g.id === student?.gradeLevelId), [gradeLevels, student]);
  const currentSection = useMemo(() => sections.find(s => s.id === student?.sectionId), [sections, student]);

  const openEditModal = () => {
    if (student) {
      const [firstName, ...lastNameParts] = student.fullName.split(' ');
      setEditedFirstName(firstName);
      setEditedLastName(lastNameParts.join(' '));
      setEditedEmail(student.email);
      setEditedSchoolEmail(student.schoolEmail || '');
      setIsEditModalVisible(true);
    }
  };

  const handleSaveChanges = async () => {
    if (!student) return;
    
    if (!editedFirstName.trim() || !editedLastName.trim()) {
      Alert.alert('Error', 'First name and last name are required');
      return;
    }

    if (!editedEmail.trim() || !editedSchoolEmail.trim()) {
      Alert.alert('Error', 'Both email addresses are required');
      return;
    }

    try {
      const updatedStudent = {
        ...student,
        fullName: `${editedFirstName.trim()} ${editedLastName.trim()}`,
        email: editedEmail.trim(),
        schoolEmail: editedSchoolEmail.trim(),
      };

      await updateStudent(updatedStudent);
      setIsEditModalVisible(false);
      Alert.alert('Success', 'Student information updated successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to update student information');
    }
  };

  if (!student || !hasViewAccess) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{!student ? 'Student not found' : 'You do not have access to this student'}</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView style={styles.content}>
        <View style={styles.headerSection}>
          {student.profilePhoto ? (
            <Image source={{ uri: student.profilePhoto }} style={styles.profilePhoto} />
          ) : (
            <View style={styles.profilePhotoPlaceholder}>
              <User size={48} color={colors.surface} />
            </View>
          )}
          <Text style={styles.name}>{student.fullName}</Text>
          <Text style={styles.subtitle}>{currentGrade?.name} - Section {currentSection?.name}</Text>
          
          {canEditStudent && (
            <TouchableOpacity style={styles.editButton} onPress={openEditModal}>
              <Edit2 size={16} color={colors.surface} />
              <Text style={styles.editButtonText}>Edit Student</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Student Information</Text>

          <View style={styles.infoRow}>
            <View style={styles.infoIcon}>
              <IdCard size={20} color={colors.primary} />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>LRN</Text>
              <Text style={styles.infoValue}>{student.lrn}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoIcon}>
              <Mail size={20} color={colors.primary} />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>School Email</Text>
              <Text style={styles.infoValue}>{student.schoolEmail || student.email}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoIcon}>
              <GraduationCap size={20} color={colors.primary} />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Grade & Section</Text>
              <Text style={styles.infoValue}>{currentGrade?.name} - Section {currentSection?.name}</Text>
            </View>
          </View>
        </View>

        {student.violationHistory && student.violationHistory.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <AlertTriangle size={20} color={colors.warning} />
              <Text style={styles.sectionTitle}>Violation History</Text>
            </View>
            {student.violationHistory.map((violation: ViolationRecord, index: number) => (
              <View key={violation.id || index} style={styles.violationCard}>
                <Text style={styles.violationType}>{violation.type.replace(/_/g, ' ').toUpperCase()}</Text>
                <Text style={styles.violationDescription}>{violation.description}</Text>
                <Text style={styles.violationDate}>{new Date(violation.date).toLocaleDateString()}</Text>
              </View>
            ))}
          </View>
        )}

        {studentReports.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Reports Submitted ({studentReports.length})</Text>
            {studentReports.map(report => (
              <View key={report.id} style={styles.reportItem}>
                <View style={[styles.typeBadge, { backgroundColor: getTypeColor(report.incidentType) + '20' }]}>
                  <Text style={[styles.typeBadgeText, { color: getTypeColor(report.incidentType) }]}>
                    {report.incidentType.replace(/_/g, ' ')}
                  </Text>
                </View>
                <Text style={styles.reportVictim}>Victim: {report.victimName}</Text>
                <Text style={styles.reportDate}>{new Date(report.createdAt).toLocaleDateString()}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={styles.infoBox}>
          <Text style={styles.infoBoxTitle}>Teacher View</Text>
          <Text style={styles.infoBoxText}>
            You can view student information for students in your assigned sections.
            {canEditStudent ? ' You can edit this student\'s basic information.' : ' Contact your administrator to get edit permissions.'}
          </Text>
        </View>

        <Modal
          visible={isEditModalVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setIsEditModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Edit Student Information</Text>
                <TouchableOpacity onPress={() => setIsEditModalVisible(false)}>
                  <X size={24} color={colors.text} />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalForm}>
                <Text style={styles.inputLabel}>First Name</Text>
                <TextInput
                  style={styles.input}
                  value={editedFirstName}
                  onChangeText={setEditedFirstName}
                  placeholder="First Name"
                  placeholderTextColor={colors.textLight}
                />

                <Text style={styles.inputLabel}>Last Name</Text>
                <TextInput
                  style={styles.input}
                  value={editedLastName}
                  onChangeText={setEditedLastName}
                  placeholder="Last Name"
                  placeholderTextColor={colors.textLight}
                />

                <Text style={styles.inputLabel}>Email Address</Text>
                <TextInput
                  style={styles.input}
                  value={editedEmail}
                  onChangeText={setEditedEmail}
                  placeholder="Email"
                  placeholderTextColor={colors.textLight}
                  keyboardType="email-address"
                />

                <Text style={styles.inputLabel}>School Email</Text>
                <TextInput
                  style={styles.input}
                  value={editedSchoolEmail}
                  onChangeText={setEditedSchoolEmail}
                  placeholder="School Email"
                  placeholderTextColor={colors.textLight}
                  keyboardType="email-address"
                />
              </ScrollView>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.button, styles.cancelButton]}
                  onPress={() => setIsEditModalVisible(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, styles.saveButton]}
                  onPress={handleSaveChanges}
                >
                  <Text style={styles.saveButtonText}>Save Changes</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </ScrollView>
    </SafeAreaView>
  );
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
  headerSection: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  profilePhoto: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 16,
  },
  profilePhotoPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  name: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: colors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  section: {
    padding: 24,
    backgroundColor: colors.surface,
    marginTop: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: colors.text,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  infoIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    color: colors.text,
    fontWeight: '500' as const,
  },
  violationCard: {
    backgroundColor: '#FEF3C7',
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
  },
  violationType: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#92400E',
    marginBottom: 4,
  },
  violationDescription: {
    fontSize: 14,
    color: '#78350F',
    marginBottom: 4,
  },
  violationDate: {
    fontSize: 12,
    color: '#A16207',
  },
  reportItem: {
    backgroundColor: colors.background,
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
  },
  typeBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 8,
  },
  typeBadgeText: {
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
  infoBox: {
    margin: 16,
    padding: 16,
    backgroundColor: '#DBEAFE',
    borderRadius: 12,
    marginBottom: 32,
  },
  infoBoxTitle: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#1E40AF',
    marginBottom: 6,
  },
  infoBoxText: {
    fontSize: 14,
    color: '#1E40AF',
    lineHeight: 20,
  },
  editButton: {
    marginTop: 12,
    flexDirection: 'row',
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    gap: 8,
  },
  editButtonText: {
    color: colors.surface,
    fontSize: 14,
    fontWeight: '600' as const,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    width: '100%',
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: colors.text,
  },
  modalForm: {
    padding: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.text,
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.text,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  cancelButtonText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600' as const,
  },
  saveButton: {
    backgroundColor: colors.primary,
  },
  saveButtonText: {
    color: colors.surface,
    fontSize: 14,
    fontWeight: '600' as const,
  },
});
