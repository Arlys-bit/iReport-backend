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
import { 
  Mail, 
  IdCard, 
  Award, 
  BookOpen, 
  Shield, 
  Lock,
  Edit2,
  Trash2,
  ChevronDown,
  X,
} from 'lucide-react-native';
import { useStaff } from '@/contexts/StaffContext';
import { useStudents } from '@/contexts/StudentsContext';
import { useAuth } from '@/contexts/AuthContext';
import { 
  StaffPosition, 
  SubjectSpecialization, 
  TeacherRank, 
  ClusterRole,
  StaffPermission,
} from '@/types';
import { 
  STAFF_POSITIONS, 
  SUBJECT_SPECIALIZATIONS, 
  TEACHER_RANKS, 
  CLUSTER_ROLES,
  STAFF_PERMISSIONS,
} from '@/constants/staff';
import colors from '@/constants/colors';
import PasswordInput from '@/components/PasswordInput';

export default function StaffProfile() {
  const { id } = useLocalSearchParams();
  const { staff, updateStaff, updatePermissions, changePassword, changePasswordMutation, deleteStaff, isUpdating } = useStaff();
  const { gradeLevels, sections } = useStudents();
  
  const staffMember = useMemo(() => {
    return staff.find(s => s.id === id);
  }, [staff, id]);

  const [editMode, setEditMode] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [editedName, setEditedName] = useState('');
  const [editedStaffId, setEditedStaffId] = useState('');
  const [editedEmail, setEditedEmail] = useState('');
  
  const [editedSpecialization, setEditedSpecialization] = useState(undefined as SubjectSpecialization | undefined);
  const [editedRank, setEditedRank] = useState(undefined as TeacherRank | undefined);
  const [editedClusterRole, setEditedClusterRole] = useState(undefined as ClusterRole | undefined);
  const [editedGradeIds, setEditedGradeIds] = useState([] as string[]);
  const [editedSectionIds, setEditedSectionIds] = useState([] as string[]);
  const [selectedPermissions, setSelectedPermissions] = useState([] as StaffPermission[]);

  const [showSpecializationPicker, setShowSpecializationPicker] = useState(false);
  const [showRankPicker, setShowRankPicker] = useState(false);
  const [showClusterRolePicker, setShowClusterRolePicker] = useState(false);
  const [showRemovePhotoModal, setShowRemovePhotoModal] = useState(false);

  const { currentUser, checkPermission, isAdmin } = useAuth();
  const canEditAccounts = checkPermission('edit_staff_profiles') || isAdmin;
  const canRemovePhoto = checkPermission('edit_staff_profiles') || isAdmin;

  React.useEffect(() => {
    if (staffMember) {
      setEditedSpecialization(staffMember.specialization);
      setEditedRank(staffMember.rank);
      setEditedClusterRole(staffMember.clusterRole);
      setEditedGradeIds(staffMember.assignedGradeLevelIds || []);
      setEditedSectionIds(staffMember.assignedSectionIds || []);
      setSelectedPermissions(staffMember.permissions);
      setEditedName(staffMember.fullName);
      setEditedStaffId(staffMember.staffId);
      setEditedEmail(staffMember.schoolEmail);
    }
  }, [staffMember]);

  if (!staffMember) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Staff member not found</Text>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const getPositionName = (pos: StaffPosition) => {
    return STAFF_POSITIONS.find(p => p.key === pos)?.name || pos;
  };

  const getSpecializationName = (spec: SubjectSpecialization) => {
    return SUBJECT_SPECIALIZATIONS.find(s => s.key === spec)?.name || spec;
  };

  const getRankName = (r: TeacherRank) => {
    return TEACHER_RANKS.find(tr => tr.key === r)?.name || r;
  };

  const getClusterRoleName = (cr: ClusterRole) => {
    return CLUSTER_ROLES.find(c => c.key === cr)?.name || cr;
  };

  const getGradeName = (gradeId: string) => {
    return gradeLevels.find(g => g.id === gradeId)?.name || 'Unknown';
  };

  const handleSaveEdits = () => {
    if (!editedName.trim()) {
      Alert.alert('Error', 'Please enter a name');
      return;
    }
    if (!editedStaffId.trim()) {
      Alert.alert('Error', 'Please enter a staff ID');
      return;
    }
    if (!editedEmail.trim()) {
      Alert.alert('Error', 'Please enter an email');
      return;
    }
    
    updateStaff({
      id: staffMember.id,
      updates: {
        fullName: editedName.trim(),
        staffId: editedStaffId.trim(),
        schoolEmail: editedEmail.trim(),
        email: editedEmail.trim(),
        specialization: editedSpecialization,
        rank: editedRank,
        clusterRole: editedClusterRole,
        assignedGradeLevelIds: editedGradeIds,
        assignedSectionIds: editedSectionIds,
      },
      adminId: currentUser?.id || 'admin',
      adminName: (currentUser as any)?.fullName || 'System Admin',
    });
    setEditMode(false);
    Alert.alert('Success', 'Staff information updated');
  };

  const handleRemovePhoto = () => {
    updateStaff({
      id: staffMember.id,
      updates: {
        profilePhoto: undefined,
      },
      adminId: currentUser?.id || 'admin',
      adminName: (currentUser as any)?.fullName || 'System Admin',
    });
    setShowRemovePhotoModal(false);
    Alert.alert('Success', 'Profile photo removed');
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
      await changePassword({
        staffId: staffMember.id,
        newPassword,
        adminId: 'admin',
        adminName: 'System Admin',
      });
      
      setNewPassword('');
      setConfirmPassword('');
      setShowPasswordModal(false);
      Alert.alert('Success', 'Password changed successfully');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to change password');
      console.error('Password change error:', error);
    }
  };

  const handleUpdatePermissions = () => {
    updatePermissions({
      staffId: staffMember.id,
      permissions: selectedPermissions,
      adminId: 'admin',
      adminName: 'System Admin',
    });
    setShowPermissionsModal(false);
    Alert.alert('Success', 'Permissions updated successfully');
  };

  const handleDeleteStaff = () => {
    deleteStaff({
      staffId: staffMember.id,
      adminId: 'admin',
      adminName: 'System Admin',
    });
    setShowDeleteModal(false);
    router.back();
  };

  const togglePermission = (perm: StaffPermission) => {
    setSelectedPermissions(prev =>
      prev.includes(perm)
        ? prev.filter(p => p !== perm)
        : [...prev, perm]
    );
  };

  const toggleGrade = (gradeId: string) => {
    setEditedGradeIds(prev =>
      prev.includes(gradeId)
        ? prev.filter(g => g !== gradeId)
        : [...prev, gradeId]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView style={styles.content}>
        <View style={styles.headerSection}>
          <View style={styles.photoContainer}>
            {staffMember.profilePhoto ? (
              <Image source={{ uri: staffMember.profilePhoto }} style={styles.profilePhoto} />
            ) : (
              <View style={styles.profilePhotoPlaceholder}>
                <Text style={styles.profileInitial}>
                  {staffMember.fullName.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
            {canRemovePhoto && staffMember.profilePhoto && (
              <TouchableOpacity
                style={styles.removePhotoButton}
                onPress={() => setShowRemovePhotoModal(true)}
              >
                <X size={14} color={colors.surface} />
              </TouchableOpacity>
            )}
          </View>
          <Text style={styles.name}>{staffMember.fullName}</Text>
          <Text style={styles.position}>{getPositionName(staffMember.position)}</Text>
          
          {canEditAccounts && <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => setEditMode(!editMode)}
            >
              <Edit2 size={18} color={colors.primary} />
              <Text style={styles.actionButtonText}>{editMode ? 'Cancel' : 'Edit'}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.deleteButton]}
              onPress={() => setShowDeleteModal(true)}
            >
              <Trash2 size={18} color={colors.error} />
              <Text style={[styles.actionButtonText, styles.deleteButtonText]}>Delete</Text>
            </TouchableOpacity>
          </View>}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Information</Text>
          
          {editMode && (
            <View style={styles.infoRow}>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Full Name</Text>
                <TextInput
                  style={styles.editInput}
                  value={editedName}
                  onChangeText={setEditedName}
                  placeholder="Enter full name"
                  placeholderTextColor={colors.textLight}
                />
              </View>
            </View>
          )}
          
          <View style={styles.infoRow}>
            <View style={styles.infoIcon}>
              <IdCard size={20} color={colors.primary} />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Staff ID</Text>
              {editMode ? (
                <TextInput
                  style={styles.editInput}
                  value={editedStaffId}
                  onChangeText={setEditedStaffId}
                  placeholder="Enter staff ID"
                  placeholderTextColor={colors.textLight}
                />
              ) : (
                <Text style={styles.infoValue}>{staffMember.staffId}</Text>
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
                  placeholder="Enter email"
                  placeholderTextColor={colors.textLight}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              ) : (
                <Text style={styles.infoValue}>{staffMember.schoolEmail}</Text>
              )}
            </View>
          </View>
        </View>

        {staffMember.position === 'teacher' && (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Teaching Assignment</Text>

              <View style={styles.infoRow}>
                <View style={styles.infoIcon}>
                  <BookOpen size={20} color={colors.primary} />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Specialization</Text>
                  {editMode ? (
                    <TouchableOpacity
                      style={styles.editPickerButton}
                      onPress={() => setShowSpecializationPicker(true)}
                    >
                      <Text style={styles.infoValue}>
                        {editedSpecialization ? getSpecializationName(editedSpecialization) : 'Not set'}
                      </Text>
                      <ChevronDown size={16} color={colors.textSecondary} />
                    </TouchableOpacity>
                  ) : (
                    <Text style={styles.infoValue}>
                      {staffMember.specialization ? getSpecializationName(staffMember.specialization) : 'Not set'}
                    </Text>
                  )}
                </View>
              </View>

              <View style={styles.infoRow}>
                <View style={styles.infoIcon}>
                  <Award size={20} color={colors.primary} />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Professional Rank</Text>
                  {editMode ? (
                    <TouchableOpacity
                      style={styles.editPickerButton}
                      onPress={() => setShowRankPicker(true)}
                    >
                      <Text style={styles.infoValue}>
                        {editedRank ? getRankName(editedRank) : 'Regular Teacher'}
                      </Text>
                      <ChevronDown size={16} color={colors.textSecondary} />
                    </TouchableOpacity>
                  ) : (
                    <Text style={styles.infoValue}>
                      {staffMember.rank ? getRankName(staffMember.rank) : 'Regular Teacher'}
                    </Text>
                  )}
                </View>
              </View>

              {(staffMember.clusterRole || editMode) && (
                <View style={styles.infoRow}>
                  <View style={styles.infoIcon}>
                    <Award size={20} color="#2563EB" />
                  </View>
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Cluster Role</Text>
                    {editMode ? (
                      <TouchableOpacity
                        style={styles.editPickerButton}
                        onPress={() => setShowClusterRolePicker(true)}
                      >
                        <Text style={styles.infoValue}>
                          {editedClusterRole ? getClusterRoleName(editedClusterRole) : 'None'}
                        </Text>
                        <ChevronDown size={16} color={colors.textSecondary} />
                      </TouchableOpacity>
                    ) : (
                      <Text style={[styles.infoValue, styles.clusterRoleText]}>
                        {staffMember.clusterRole ? getClusterRoleName(staffMember.clusterRole) : 'None'}
                      </Text>
                    )}
                  </View>
                </View>
              )}

              {editMode && (
                <View style={styles.infoRow}>
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Grade Levels Handled</Text>
                    <View style={styles.chipContainer}>
                      {gradeLevels.map(grade => (
                        <TouchableOpacity
                          key={grade.id}
                          style={[
                            styles.chip,
                            editedGradeIds.includes(grade.id) && styles.chipSelected,
                          ]}
                          onPress={() => toggleGrade(grade.id)}
                        >
                          <Text
                            style={[
                              styles.chipText,
                              editedGradeIds.includes(grade.id) && styles.chipTextSelected,
                            ]}
                          >
                            {grade.name}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                </View>
              )}

              {!editMode && staffMember.assignedGradeLevelIds && staffMember.assignedGradeLevelIds.length > 0 && (
                <View style={styles.infoRow}>
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Grade Levels Handled</Text>
                    <Text style={styles.infoValue}>
                      {staffMember.assignedGradeLevelIds.map(id => getGradeName(id)).join(', ')}
                    </Text>
                  </View>
                </View>
              )}
            </View>

            {editMode && (
              <View style={styles.saveButtonContainer}>
                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={handleSaveEdits}
                  disabled={isUpdating}
                >
                  {isUpdating ? (
                    <ActivityIndicator color={colors.surface} />
                  ) : (
                    <Text style={styles.saveButtonText}>Save Changes</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </>
        )}

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Shield size={20} color={colors.primary} />
            <Text style={styles.sectionTitle}>Permissions</Text>
          </View>
          
          <View style={styles.permissionsList}>
            {staffMember.permissions.map(perm => {
              const permInfo = STAFF_PERMISSIONS.find(p => p.key === perm);
              return permInfo ? (
                <View key={perm} style={styles.permissionChip}>
                  <Text style={styles.permissionChipText}>{permInfo.name}</Text>
                </View>
              ) : null;
            })}
          </View>

          <TouchableOpacity
            style={styles.editPermissionsButton}
            onPress={() => setShowPermissionsModal(true)}
          >
            <Text style={styles.editPermissionsButtonText}>Manage Permissions</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Lock size={20} color={colors.primary} />
            <Text style={styles.sectionTitle}>Teacher Settings</Text>
          </View>

          <TouchableOpacity
            style={styles.changePasswordButton}
            onPress={() => setShowPasswordModal(true)}
          >
            <Lock size={18} color={colors.surface} />
            <Text style={styles.changePasswordButtonText}>Change Password</Text>
          </TouchableOpacity>

          <View style={styles.securityNote}>
            <Text style={styles.securityNoteText}>
              Password changes are logged for security purposes
            </Text>
          </View>
        </View>
      </ScrollView>

      <Modal
        visible={showPasswordModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowPasswordModal(false)}
      >
        <SafeAreaView style={styles.modalContainer} edges={['top', 'bottom']}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Change Password</Text>
            <TouchableOpacity onPress={() => setShowPasswordModal(false)}>
              <X size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>New Password</Text>
              <PasswordInput
                style={styles.input}
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="Enter new password"
                placeholderTextColor={colors.textLight}
                autoCapitalize="none"
                iconColor={colors.textLight}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Confirm Password</Text>
              <PasswordInput
                style={styles.input}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Confirm new password"
                placeholderTextColor={colors.textLight}
                autoCapitalize="none"
                iconColor={colors.textLight}
              />
              />
            </View>

            <TouchableOpacity
              style={[styles.modalButton, changePasswordMutation?.isPending && styles.disabledButton]}
              onPress={handleChangePassword}
              disabled={changePasswordMutation?.isPending}
            >
              {changePasswordMutation?.isPending ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.modalButtonText}>Change Password</Text>
              )}
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>

      <Modal
        visible={showPermissionsModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowPermissionsModal(false)}
      >
        <SafeAreaView style={styles.modalContainer} edges={['top', 'bottom']}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Manage Permissions</Text>
            <TouchableOpacity onPress={() => setShowPermissionsModal(false)}>
              <X size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {STAFF_PERMISSIONS.map(perm => (
              <TouchableOpacity
                key={perm.key}
                style={styles.permissionItem}
                onPress={() => togglePermission(perm.key)}
              >
                <View style={styles.permissionInfo}>
                  <Text style={styles.permissionName}>{perm.name}</Text>
                  <Text style={styles.permissionDescription}>{perm.description}</Text>
                </View>
                <View style={[styles.checkbox, selectedPermissions.includes(perm.key) && styles.checkboxChecked]}>
                  {selectedPermissions.includes(perm.key) && <View style={styles.checkboxInner} />}
                </View>
              </TouchableOpacity>
            ))}

            <TouchableOpacity
              style={styles.modalButton}
              onPress={handleUpdatePermissions}
            >
              <Text style={styles.modalButtonText}>Update Permissions</Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      <Modal
        visible={showDeleteModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDeleteModal(false)}
      >
        <View style={styles.deleteModalOverlay}>
          <View style={styles.deleteModal}>
            <Text style={styles.deleteModalTitle}>Delete Staff Member?</Text>
            <Text style={styles.deleteModalText}>
              Are you sure you want to delete {staffMember.fullName}? This action cannot be undone.
            </Text>
            <View style={styles.deleteModalButtons}>
              <TouchableOpacity
                style={styles.deleteModalCancelButton}
                onPress={() => setShowDeleteModal(false)}
              >
                <Text style={styles.deleteModalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.deleteModalConfirmButton}
                onPress={handleDeleteStaff}
              >
                <Text style={styles.deleteModalConfirmText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showRemovePhotoModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowRemovePhotoModal(false)}
      >
        <View style={styles.deleteModalOverlay}>
          <View style={styles.deleteModal}>
            <Text style={styles.deleteModalTitle}>Remove Photo?</Text>
            <Text style={styles.deleteModalText}>
              Are you sure you want to remove the profile photo for {staffMember.fullName}?
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

      <Modal
        visible={showSpecializationPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSpecializationPicker(false)}
      >
        <TouchableOpacity
          style={styles.pickerOverlay}
          activeOpacity={1}
          onPress={() => setShowSpecializationPicker(false)}
        >
          <View style={styles.pickerModal}>
            <Text style={styles.pickerTitle}>Select Specialization</Text>
            <ScrollView style={styles.pickerScroll}>
              {SUBJECT_SPECIALIZATIONS.map(spec => (
                <TouchableOpacity
                  key={spec.key}
                  style={[
                    styles.pickerOption,
                    editedSpecialization === spec.key && styles.pickerOptionSelected,
                  ]}
                  onPress={() => {
                    setEditedSpecialization(spec.key);
                    setShowSpecializationPicker(false);
                  }}
                >
                  <Text
                    style={[
                      styles.pickerOptionText,
                      editedSpecialization === spec.key && styles.pickerOptionTextSelected,
                    ]}
                  >
                    {spec.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal
        visible={showRankPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowRankPicker(false)}
      >
        <TouchableOpacity
          style={styles.pickerOverlay}
          activeOpacity={1}
          onPress={() => setShowRankPicker(false)}
        >
          <View style={styles.pickerModal}>
            <Text style={styles.pickerTitle}>Select Rank</Text>
            {TEACHER_RANKS.map(r => (
              <TouchableOpacity
                key={r.key}
                style={[
                  styles.pickerOption,
                  editedRank === r.key && styles.pickerOptionSelected,
                ]}
                onPress={() => {
                  setEditedRank(r.key);
                  setShowRankPicker(false);
                }}
              >
                <Text
                  style={[
                    styles.pickerOptionText,
                    editedRank === r.key && styles.pickerOptionTextSelected,
                  ]}
                >
                  {r.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal
        visible={showClusterRolePicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowClusterRolePicker(false)}
      >
        <TouchableOpacity
          style={styles.pickerOverlay}
          activeOpacity={1}
          onPress={() => setShowClusterRolePicker(false)}
        >
          <View style={styles.pickerModal}>
            <Text style={styles.pickerTitle}>Select Cluster Role</Text>
            <TouchableOpacity
              style={[
                styles.pickerOption,
                !editedClusterRole && styles.pickerOptionSelected,
              ]}
              onPress={() => {
                setEditedClusterRole(undefined);
                setShowClusterRolePicker(false);
              }}
            >
              <Text
                style={[
                  styles.pickerOptionText,
                  !editedClusterRole && styles.pickerOptionTextSelected,
                ]}
              >
                None
              </Text>
            </TouchableOpacity>
            {CLUSTER_ROLES.map(cr => (
              <TouchableOpacity
                key={cr.key}
                style={[
                  styles.pickerOption,
                  editedClusterRole === cr.key && styles.pickerOptionSelected,
                ]}
                onPress={() => {
                  setEditedClusterRole(cr.key);
                  setShowClusterRolePicker(false);
                }}
              >
                <Text
                  style={[
                    styles.pickerOptionText,
                    editedClusterRole === cr.key && styles.pickerOptionTextSelected,
                  ]}
                >
                  {cr.name}
                </Text>
              </TouchableOpacity>
            ))}
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
  profilePhoto: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  profilePhotoPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#90C659',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoContainer: {
    position: 'relative',
    marginBottom: 16,
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
  profileInitial: {
    fontSize: 48,
    fontWeight: '700' as const,
    color: colors.surface,
  },
  name: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: colors.text,
    marginBottom: 4,
  },
  position: {
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: colors.text,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
  clusterRoleText: {
    color: '#2563EB',
    fontWeight: '600' as const,
  },
  editPickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    fontSize: 13,
    color: colors.text,
  },
  chipTextSelected: {
    color: colors.surface,
    fontWeight: '600' as const,
  },
  permissionsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  permissionChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#DBEAFE',
  },
  permissionChipText: {
    fontSize: 13,
    color: '#1E40AF',
    fontWeight: '500' as const,
  },
  editPermissionsButton: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  editPermissionsButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.surface,
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
  securityNote: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
  },
  securityNoteText: {
    fontSize: 13,
    color: '#92400E',
  },
  saveButtonContainer: {
    padding: 24,
    backgroundColor: colors.surface,
    marginTop: 12,
  },
  saveButton: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
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
  modalButton: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 24,
  },
  disabledButton: {
    backgroundColor: colors.textLight,
    opacity: 0.5,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: colors.surface,
  },
  permissionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  permissionInfo: {
    flex: 1,
    marginRight: 12,
  },
  permissionName: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: colors.text,
    marginBottom: 2,
  },
  permissionDescription: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checkboxInner: {
    width: 12,
    height: 12,
    borderRadius: 3,
    backgroundColor: colors.surface,
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
