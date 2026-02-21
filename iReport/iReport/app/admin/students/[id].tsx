import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { 
  Mail, 
  IdCard, 
  GraduationCap,
  Lock,
  Edit2,
  Trash2,
  ChevronDown,
  X,
  ArrowUpCircle,
  ArrowRightCircle,
  AlertTriangle,
  Camera,
  User,
} from 'lucide-react-native';
import { useStudents } from '@/contexts/StudentsContext';
import { useStaff } from '@/contexts/StaffContext';
import { useAuth } from '@/contexts/AuthContext';
import { useReports } from '@/contexts/ReportContext';
import { Student, ViolationRecord } from '@/types';
import colors from '@/constants/colors';

export default function StudentProfile() {
  const { id } = useLocalSearchParams();
  const { currentUser, checkPermission, isAdmin } = useAuth();
  const { students, gradeLevels, sections, updateStudent, promoteStudent, transferStudent, deleteStudent, resetStudentPassword, isUpdating } = useStudents();
  const { staff } = useStaff();
  const { reports } = useReports();

  const student = useMemo(() => students.find(s => s.id === id), [students, id]);

  const [editMode, setEditMode] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPromoteModal, setShowPromoteModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);

  const [editedName, setEditedName] = useState('');
  const [editedEmail, setEditedEmail] = useState('');
  const [editedLrn, setEditedLrn] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showRemovePhotoModal, setShowRemovePhotoModal] = useState(false);

  const [selectedGradeId, setSelectedGradeId] = useState('');
  const [selectedSectionId, setSelectedSectionId] = useState('');
  const [showGradePicker, setShowGradePicker] = useState(false);
  const [showSectionPicker, setShowSectionPicker] = useState(false);

  const canEditStudents = checkPermission('edit_students');
  const canPromoteTransfer = checkPermission('promote_transfer_students');
  const canRemoveStudents = isAdmin;
  const canAccessSensitive = checkPermission('access_sensitive_data');

  const studentReports = useMemo(() => {
    return reports.filter(r => r.reporterId === id);
  }, [reports, id]);

  const currentGrade = useMemo(() => gradeLevels.find(g => g.id === student?.gradeLevelId), [gradeLevels, student]);
  const currentSection = useMemo(() => sections.find(s => s.id === student?.sectionId), [sections, student]);
  const assignedTeacher = useMemo(() => staff.find(s => s.id === student?.assignedTeacherId), [staff, student]);

  const availableSections = useMemo(() => {
    return sections.filter(s => s.gradeLevelId === selectedGradeId);
  }, [sections, selectedGradeId]);

  React.useEffect(() => {
    if (student) {
      setEditedName(student.fullName);
      setEditedEmail(student.email);
      setEditedLrn(student.lrn);
    }
  }, [student]);

  if (!student) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Student not found</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const handleSaveEdits = async () => {
    if (!editedName.trim()) {
      Alert.alert('Error', 'Please enter a name');
      return;
    }
    if (!editedLrn.trim()) {
      Alert.alert('Error', 'Please enter an LRN');
      return;
    }
    if (!editedEmail.trim()) {
      Alert.alert('Error', 'Please enter an email');
      return;
    }
    
    try {
      await updateStudent({
        id: student.id,
        updates: {
          fullName: editedName.trim(),
          lrn: editedLrn.trim(),
          email: editedEmail.trim(),
          schoolEmail: editedEmail.trim(),
        },
      });
      setEditMode(false);
      Alert.alert('Success', 'Student information updated');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update student');
    }
  };

  const handleRemovePhoto = async () => {
    try {
      await updateStudent({
        id: student.id,
        updates: { profilePhoto: undefined },
      });
      setShowRemovePhotoModal(false);
      Alert.alert('Success', 'Profile photo removed');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to remove photo');
    }
  };

  const handleChangePassword = async () => {
    if (!newPassword || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    try {
      await resetStudentPassword({ studentId: student.id, newPassword });
      setNewPassword('');
      setConfirmPassword('');
      setShowPasswordModal(false);
      Alert.alert('Success', 'Password changed successfully');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to change password');
    }
  };

  const handlePromote = async () => {
    if (!selectedGradeId || !selectedSectionId) {
      Alert.alert('Error', 'Please select grade level and section');
      return;
    }

    const section = sections.find(s => s.id === selectedSectionId);

    try {
      await promoteStudent({
        studentId: student.id,
        newGradeLevelId: selectedGradeId,
        newSectionId: selectedSectionId,
        newTeacherId: section?.advisorId,
      });
      setShowPromoteModal(false);
      setSelectedGradeId('');
      setSelectedSectionId('');
      Alert.alert('Success', 'Student promoted successfully');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to promote student');
    }
  };

  const handleTransfer = async () => {
    if (!selectedSectionId) {
      Alert.alert('Error', 'Please select a section');
      return;
    }

    const section = sections.find(s => s.id === selectedSectionId);

    try {
      await transferStudent({
        studentId: student.id,
        newSectionId: selectedSectionId,
        newTeacherId: section?.advisorId,
      });
      setShowTransferModal(false);
      setSelectedSectionId('');
      Alert.alert('Success', 'Student transferred successfully');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to transfer student');
    }
  };

  const handleDelete = async () => {
    try {
      await deleteStudent(student.id);
      setShowDeleteModal(false);
      router.back();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to delete student');
    }
  };

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled) {
      try {
        await updateStudent({
          id: student.id,
          updates: { profilePhoto: result.assets[0].uri },
        });
        Alert.alert('Success', 'Profile photo updated');
      } catch (error: any) {
        Alert.alert('Error', error.message || 'Failed to update photo');
      }
    }
  };

  const getGradeName = (gradeId: string) => gradeLevels.find(g => g.id === gradeId)?.name || 'Unknown';
  const getSectionName = (sectionId: string) => sections.find(s => s.id === sectionId)?.name || 'Unknown';

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView style={styles.content}>
        <View style={styles.headerSection}>
          <View style={styles.photoContainer}>
            <TouchableOpacity onPress={handlePickImage} disabled={!canEditStudents}>
              {student.profilePhoto ? (
                <Image source={{ uri: student.profilePhoto }} style={styles.profilePhoto} />
              ) : (
                <View style={styles.profilePhotoPlaceholder}>
                  <User size={48} color={colors.surface} />
                </View>
              )}
              {canEditStudents && (
                <View style={styles.editPhotoOverlay}>
                  <Camera size={16} color={colors.surface} />
                </View>
              )}
            </TouchableOpacity>
            {canEditStudents && student.profilePhoto && (
              <TouchableOpacity
                style={styles.removePhotoButton}
                onPress={() => setShowRemovePhotoModal(true)}
              >
                <X size={14} color={colors.surface} />
              </TouchableOpacity>
            )}
          </View>
          <Text style={styles.name}>{student.fullName}</Text>
          <Text style={styles.subtitle}>{currentGrade?.name} - Section {currentSection?.name}</Text>

          {canEditStudents && (
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => setEditMode(!editMode)}
              >
                <Edit2 size={18} color={colors.primary} />
                <Text style={styles.actionButtonText}>{editMode ? 'Cancel' : 'Edit'}</Text>
              </TouchableOpacity>
              {canRemoveStudents && (
                <TouchableOpacity
                  style={[styles.actionButton, styles.deleteButton]}
                  onPress={() => setShowDeleteModal(true)}
                >
                  <Trash2 size={18} color={colors.error} />
                  <Text style={[styles.actionButtonText, styles.deleteButtonText]}>Remove</Text>
                </TouchableOpacity>
              )}
            </View>
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
              {editMode ? (
                <TextInput
                  style={styles.editInput}
                  value={editedLrn}
                  onChangeText={setEditedLrn}
                  placeholder="Enter LRN"
                  placeholderTextColor={colors.textLight}
                  keyboardType="number-pad"
                />
              ) : (
                <Text style={styles.infoValue}>{student.lrn}</Text>
              )}
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoIcon}>
              <Mail size={20} color={colors.primary} />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>School Email</Text>
              {editMode ? (
                <TextInput
                  style={styles.editInput}
                  value={editedEmail}
                  onChangeText={setEditedEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              ) : (
                <Text style={styles.infoValue}>{student.schoolEmail || student.email}</Text>
              )}
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

          {assignedTeacher && (
            <View style={styles.infoRow}>
              <View style={styles.infoIcon}>
                <User size={20} color={colors.primary} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Assigned Teacher</Text>
                <Text style={styles.infoValue}>{assignedTeacher.fullName}</Text>
              </View>
            </View>
          )}

          {editMode && (
            <View style={styles.infoRow}>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Full Name</Text>
                <TextInput
                  style={styles.editInput}
                  value={editedName}
                  onChangeText={setEditedName}
                />
              </View>
            </View>
          )}

          {editMode && (
            <TouchableOpacity style={styles.saveButton} onPress={handleSaveEdits} disabled={isUpdating}>
              {isUpdating ? (
                <ActivityIndicator color={colors.surface} />
              ) : (
                <Text style={styles.saveButtonText}>Save Changes</Text>
              )}
            </TouchableOpacity>
          )}
        </View>

        {student.violationHistory && student.violationHistory.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <AlertTriangle size={20} color={colors.warning} />
              <Text style={styles.sectionTitle}>Violation History</Text>
            </View>
            {student.violationHistory.map((violation: ViolationRecord) => (
              <View key={violation.id} style={styles.violationCard}>
                <Text style={styles.violationType}>{violation.type.replace(/_/g, ' ').toUpperCase()}</Text>
                <Text style={styles.violationDescription}>{violation.description}</Text>
                <Text style={styles.violationDate}>{new Date(violation.date).toLocaleDateString()}</Text>
              </View>
            ))}
          </View>
        )}

        {canPromoteTransfer && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Student Actions</Text>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => {
                setSelectedGradeId('');
                setSelectedSectionId('');
                setShowPromoteModal(true);
              }}
            >
              <View style={styles.actionCardIcon}>
                <ArrowUpCircle size={24} color={colors.success} />
              </View>
              <View style={styles.actionCardContent}>
                <Text style={styles.actionCardTitle}>Promote Student</Text>
                <Text style={styles.actionCardDescription}>Move to next grade level</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => {
                setSelectedGradeId(student.gradeLevelId);
                setSelectedSectionId('');
                setShowTransferModal(true);
              }}
            >
              <View style={styles.actionCardIcon}>
                <ArrowRightCircle size={24} color={colors.primary} />
              </View>
              <View style={styles.actionCardContent}>
                <Text style={styles.actionCardTitle}>Transfer Student</Text>
                <Text style={styles.actionCardDescription}>Move to different section</Text>
              </View>
            </TouchableOpacity>
          </View>
        )}

        {canAccessSensitive && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Lock size={20} color={colors.primary} />
              <Text style={styles.sectionTitle}>Account Settings</Text>
            </View>

            <View style={styles.infoRow}>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Password</Text>
                <Text style={styles.infoValue}>••••••••</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.changePasswordButton}
              onPress={() => setShowPasswordModal(true)}
            >
              <Lock size={18} color={colors.surface} />
              <Text style={styles.changePasswordButtonText}>Reset Password</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      <Modal visible={showPasswordModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer} edges={['top', 'bottom']}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Reset Password</Text>
            <TouchableOpacity onPress={() => setShowPasswordModal(false)}>
              <X size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
          <View style={styles.modalContent}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>New Password</Text>
              <TextInput
                style={styles.input}
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="Enter new password"
                placeholderTextColor={colors.textLight}
                secureTextEntry
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Confirm Password</Text>
              <TextInput
                style={styles.input}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Confirm new password"
                placeholderTextColor={colors.textLight}
                secureTextEntry
              />
            </View>
            <TouchableOpacity style={styles.modalButton} onPress={handleChangePassword}>
              <Text style={styles.modalButtonText}>Reset Password</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>

      <Modal visible={showPromoteModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer} edges={['top', 'bottom']}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Promote Student</Text>
            <TouchableOpacity onPress={() => setShowPromoteModal(false)}>
              <X size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
          <View style={styles.modalContent}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>New Grade Level</Text>
              <TouchableOpacity style={styles.pickerButton} onPress={() => setShowGradePicker(true)}>
                <Text style={styles.pickerButtonText}>
                  {selectedGradeId ? getGradeName(selectedGradeId) : 'Select Grade Level'}
                </Text>
                <ChevronDown size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>New Section</Text>
              <TouchableOpacity
                style={[styles.pickerButton, !selectedGradeId && styles.pickerButtonDisabled]}
                onPress={() => selectedGradeId && setShowSectionPicker(true)}
                disabled={!selectedGradeId}
              >
                <Text style={styles.pickerButtonText}>
                  {selectedSectionId ? `Section ${getSectionName(selectedSectionId)}` : 'Select Section'}
                </Text>
                <ChevronDown size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.modalButton} onPress={handlePromote}>
              <Text style={styles.modalButtonText}>Promote Student</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>

      <Modal visible={showTransferModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer} edges={['top', 'bottom']}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Transfer Student</Text>
            <TouchableOpacity onPress={() => setShowTransferModal(false)}>
              <X size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
          <View style={styles.modalContent}>
            <Text style={styles.infoText}>
              Current: {currentGrade?.name} - Section {currentSection?.name}
            </Text>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>New Section</Text>
              <TouchableOpacity style={styles.pickerButton} onPress={() => setShowSectionPicker(true)}>
                <Text style={styles.pickerButtonText}>
                  {selectedSectionId ? `Section ${getSectionName(selectedSectionId)}` : 'Select Section'}
                </Text>
                <ChevronDown size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.modalButton} onPress={handleTransfer}>
              <Text style={styles.modalButtonText}>Transfer Student</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>

      <Modal visible={showDeleteModal} transparent animationType="fade">
        <View style={styles.deleteModalOverlay}>
          <View style={styles.deleteModal}>
            <Text style={styles.deleteModalTitle}>Remove Student?</Text>
            <Text style={styles.deleteModalText}>
              Are you sure you want to remove {student.fullName}? This action cannot be undone.
            </Text>
            <View style={styles.deleteModalButtons}>
              <TouchableOpacity style={styles.deleteModalCancelButton} onPress={() => setShowDeleteModal(false)}>
                <Text style={styles.deleteModalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.deleteModalConfirmButton} onPress={handleDelete}>
                <Text style={styles.deleteModalConfirmText}>Remove</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={showRemovePhotoModal} transparent animationType="fade">
        <View style={styles.deleteModalOverlay}>
          <View style={styles.deleteModal}>
            <Text style={styles.deleteModalTitle}>Remove Photo?</Text>
            <Text style={styles.deleteModalText}>
              Are you sure you want to remove the profile photo for {student.fullName}?
            </Text>
            <View style={styles.deleteModalButtons}>
              <TouchableOpacity
                style={styles.deleteModalCancelButton}
                onPress={() => setShowRemovePhotoModal(false)}
              >
                <Text style={styles.deleteModalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.deleteModalConfirmButton}
                onPress={handleRemovePhoto}
              >
                <Text style={styles.deleteModalConfirmText}>Remove</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={showGradePicker} transparent animationType="fade">
        <TouchableOpacity style={styles.pickerOverlay} activeOpacity={1} onPress={() => setShowGradePicker(false)}>
          <View style={styles.pickerModal}>
            <Text style={styles.pickerTitle}>Select Grade Level</Text>
            <ScrollView style={styles.pickerScroll}>
              {gradeLevels.map(grade => (
                <TouchableOpacity
                  key={grade.id}
                  style={[styles.pickerOption, selectedGradeId === grade.id && styles.pickerOptionSelected]}
                  onPress={() => {
                    setSelectedGradeId(grade.id);
                    setSelectedSectionId('');
                    setShowGradePicker(false);
                  }}
                >
                  <Text style={[styles.pickerOptionText, selectedGradeId === grade.id && styles.pickerOptionTextSelected]}>
                    {grade.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal visible={showSectionPicker} transparent animationType="fade">
        <TouchableOpacity style={styles.pickerOverlay} activeOpacity={1} onPress={() => setShowSectionPicker(false)}>
          <View style={styles.pickerModal}>
            <Text style={styles.pickerTitle}>Select Section</Text>
            <ScrollView style={styles.pickerScroll}>
              {availableSections.map(section => (
                <TouchableOpacity
                  key={section.id}
                  style={[styles.pickerOption, selectedSectionId === section.id && styles.pickerOptionSelected]}
                  onPress={() => {
                    setSelectedSectionId(section.id);
                    setShowSectionPicker(false);
                  }}
                >
                  <Text style={[styles.pickerOptionText, selectedSectionId === section.id && styles.pickerOptionTextSelected]}>
                    Section {section.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
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
  headerSection: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  photoContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  profilePhoto: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  profilePhotoPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editPhotoOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removePhotoButton: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.error,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.surface,
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
    marginBottom: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: colors.background,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.primary,
  },
  deleteButton: {
    backgroundColor: '#FEE2E2',
  },
  deleteButtonText: {
    color: colors.error,
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
  infoText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 16,
    textAlign: 'center',
  },
  editInput: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: colors.text,
  },
  saveButton: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.surface,
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
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  actionCardIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  actionCardContent: {
    flex: 1,
  },
  actionCardTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.text,
    marginBottom: 2,
  },
  actionCardDescription: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  changePasswordButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  changePasswordButtonText: {
    fontSize: 14,
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
  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  pickerButtonDisabled: {
    opacity: 0.5,
  },
  pickerButtonText: {
    fontSize: 16,
    color: colors.text,
  },
  modalButton: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: colors.surface,
  },
  deleteModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  deleteModal: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  deleteModalTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: colors.text,
    marginBottom: 12,
  },
  deleteModalText: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 24,
    lineHeight: 22,
  },
  deleteModalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  deleteModalCancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    backgroundColor: colors.background,
    alignItems: 'center',
  },
  deleteModalCancelText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.text,
  },
  deleteModalConfirmButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    backgroundColor: colors.error,
    alignItems: 'center',
  },
  deleteModalConfirmText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.surface,
  },
  pickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  pickerModal: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 400,
    maxHeight: '70%',
  },
  pickerScroll: {
    maxHeight: 300,
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: colors.text,
    marginBottom: 16,
  },
  pickerOption: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 4,
  },
  pickerOptionSelected: {
    backgroundColor: colors.primary + '15',
  },
  pickerOptionText: {
    fontSize: 16,
    color: colors.text,
  },
  pickerOptionTextSelected: {
    fontWeight: '600' as const,
    color: colors.primary,
  },
});
