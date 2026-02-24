import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Image,
  Modal,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { X, Camera, User, ChevronDown, Search, Users, Shield } from 'lucide-react-native';
import { useStaff } from '@/contexts/StaffContext';
import { StaffMember, StaffPosition, SubjectSpecialization, TeacherRank, ClusterRole, StaffPermission } from '@/types';
import { STAFF_POSITIONS, SUBJECT_SPECIALIZATIONS, TEACHER_RANKS, CLUSTER_ROLES, STAFF_PERMISSIONS } from '@/constants/staff';
import colors from '@/constants/colors';
import PasswordInput from '@/components/PasswordInput';

export default function ManageStaff() {
  const { staff, createStaff, isCreating } = useStaff() as any;
  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [fullName, setFullName] = useState('');
  const [staffId, setStaffId] = useState('');
  const [schoolEmail, setSchoolEmail] = useState('');
  const [password, setPassword] = useState('');
  const [position, setPosition] = useState('teacher' as StaffPosition);
  const [specialization, setSpecialization] = useState('english' as SubjectSpecialization);
  const [rank, setRank] = useState('regular_teacher' as TeacherRank);
  const [clusterRole, setClusterRole] = useState(undefined as ClusterRole | undefined);
  const [profilePhoto, setProfilePhoto] = useState(undefined as string | undefined);
  const [permissions, setPermissions] = useState(['view_all_reports', 'manage_reports'] as StaffPermission[]);
  
  const [showPositionPicker, setShowPositionPicker] = useState(false);
  const [showSpecializationPicker, setShowSpecializationPicker] = useState(false);
  const [showRankPicker, setShowRankPicker] = useState(false);
  const [showClusterRolePicker, setShowClusterRolePicker] = useState(false);

  const filteredStaff = useMemo(() => {
    if (!searchQuery.trim()) return staff;
    const query = searchQuery.toLowerCase();
    return staff.filter(s => 
      s.fullName.toLowerCase().includes(query) ||
      s.staffId.toLowerCase().includes(query) ||
      s.schoolEmail.toLowerCase().includes(query) ||
      (s.specialization && SUBJECT_SPECIALIZATIONS.find(sp => sp.key === s.specialization)?.name.toLowerCase().includes(query))
    );
  }, [staff, searchQuery]);

  const groupedStaff = useMemo(() => {
    const groups: {
      administration: StaffMember[];
      teachers: Record<SubjectSpecialization, StaffMember[]>;
    } = {
      administration: [],
      teachers: {} as Record<SubjectSpecialization, StaffMember[]>,
    };

    filteredStaff.forEach(member => {
      if (member.position === 'principal' || member.position === 'vice_principal' || member.position === 'guidance_counselor') {
        groups.administration.push(member);
      } else if (member.position === 'teacher' && member.specialization) {
        if (!groups.teachers[member.specialization]) {
          groups.teachers[member.specialization] = [];
        }
        groups.teachers[member.specialization].push(member);
      }
    });

    groups.administration.sort((a, b) => {
      const order = { principal: 0, vice_principal: 1, guidance_counselor: 2 };
      return order[a.position as keyof typeof order] - order[b.position as keyof typeof order];
    });

    Object.keys(groups.teachers).forEach(spec => {
      groups.teachers[spec as SubjectSpecialization].sort((a, b) => {
        const rankOrder = { master_teacher_ii: 0, master_teacher_i: 1, senior_teacher: 2, regular_teacher: 3 };
        const aRank = a.rank || 'regular_teacher';
        const bRank = b.rank || 'regular_teacher';
        return rankOrder[aRank] - rankOrder[bRank];
      });
    });

    return groups;
  }, [filteredStaff]);

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled) {
      setProfilePhoto(result.assets[0].uri);
    }
  };

  const togglePermission = (perm: StaffPermission) => {
    setPermissions(prev => 
      prev.includes(perm) 
        ? prev.filter(p => p !== perm)
        : [...prev, perm]
    );
  };

  const handleCreateStaff = () => {
    if (!fullName.trim() || !staffId.trim() || !schoolEmail.trim() || !password.trim()) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    createStaff({
      fullName: fullName.trim(),
      staffId: staffId.trim(),
      schoolEmail: schoolEmail.trim(),
      password: password.trim(),
      email: schoolEmail.trim(),
      position,
      specialization: position === 'teacher' ? specialization : undefined,
      rank: position === 'teacher' ? rank : undefined,
      clusterRole: position === 'teacher' && clusterRole ? clusterRole : undefined,
      profilePhoto,
      permissions,
    });

    resetForm();
    setModalVisible(false);
  };

  const resetForm = () => {
    setFullName('');
    setStaffId('');
    setSchoolEmail('');
    setPassword('');
    setPosition('teacher');
    setSpecialization('english');
    setRank('regular_teacher');
    setClusterRole(undefined);
    setProfilePhoto(undefined);
    setPermissions(['view_all_reports', 'manage_reports']);
  };

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

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.header}>
        <View style={styles.searchContainer}>
          <Search size={20} color={colors.textLight} />
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search staff by name, ID, or subject..."
            placeholderTextColor={colors.textLight}
          />
        </View>
      </View>

      <ScrollView style={styles.content}>
        {staff.length === 0 ? (
          <View style={styles.emptyState}>
            <Users size={48} color={colors.textLight} />
            <Text style={styles.emptyTitle}>No staff members yet</Text>
            <Text style={styles.emptyText}>
              Create your first staff account to get started
            </Text>
          </View>
        ) : (
          <View style={styles.staffList}>
            {groupedStaff.administration.length > 0 && (
              <View style={styles.categorySection}>
                <Text style={styles.categoryTitle}>Administration</Text>
                <View style={styles.divider} />
                {groupedStaff.administration.map(member => (
                  <TouchableOpacity
                    key={member.id}
                    style={styles.staffCard}
                    onPress={() => router.push(`/admin/staff/${member.id}`)}
                  >
                    {member.profilePhoto ? (
                      <Image source={{ uri: member.profilePhoto }} style={styles.staffPhoto} />
                    ) : (
                      <View style={styles.staffPhotoPlaceholder}>
                        <Text style={styles.staffInitial}>
                          {member.fullName.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                    )}
                    <View style={styles.staffInfo}>
                      <Text style={styles.staffName}>{member.fullName}</Text>
                      <Text style={styles.staffPosition}>{getPositionName(member.position)}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {Object.entries(groupedStaff.teachers).map(([spec, teachers]) => {
              if ((teachers as any[]).length === 0) return null;
              return (
                <View key={spec} style={styles.categorySection}>
                  <Text style={styles.categoryTitle}>
                    {getSpecializationName(spec as SubjectSpecialization)}
                  </Text>
                  <View style={styles.divider} />
                  {(teachers as any[]).map(teacher => (
                    <TouchableOpacity
                      key={teacher.id}
                      style={styles.staffCard}
                      onPress={() => router.push(`/admin/staff/${teacher.id}`)}
                    >
                      {teacher.profilePhoto ? (
                        <Image source={{ uri: teacher.profilePhoto }} style={styles.staffPhoto} />
                      ) : (
                        <View style={styles.staffPhotoPlaceholder}>
                          <Text style={styles.staffInitial}>
                            {teacher.fullName.charAt(0).toUpperCase()}
                          </Text>
                        </View>
                      )}
                      <View style={styles.staffInfo}>
                        <Text style={styles.staffName}>{teacher.fullName}</Text>
                        {teacher.clusterRole && (
                          <Text style={styles.clusterRole}>
                            {getClusterRoleName(teacher.clusterRole)}
                          </Text>
                        )}
                        {teacher.rank && (
                          <Text style={styles.staffRank}>{getRankName(teacher.rank)}</Text>
                        )}
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setModalVisible(true)}
          testID="add-staff-button"
        >
          <Text style={styles.addButtonText}>+ Add Staff</Text>
        </TouchableOpacity>
      </View>

      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
          style={{ flex: 1 }}
        >
          <SafeAreaView style={styles.modalContainer} edges={['top', 'bottom']}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create Staff Account</Text>
              <TouchableOpacity
                onPress={() => {
                  setModalVisible(false);
                  resetForm();
                }}
                style={styles.closeButton}
              >
                <X size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView 
              style={styles.modalContent}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ paddingBottom: 40 }}
            >
            <View style={styles.photoSection}>
              <TouchableOpacity style={styles.photoButton} onPress={handlePickImage}>
                {profilePhoto ? (
                  <Image source={{ uri: profilePhoto }} style={styles.photoPreview} />
                ) : (
                  <>
                    <Camera size={32} color={colors.textLight} />
                    <Text style={styles.photoButtonText}>Add Photo</Text>
                    <Text style={styles.photoButtonHint}>(Optional)</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Full Name <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={styles.input}
                value={fullName}
                onChangeText={setFullName}
                placeholder="Enter full name"
                placeholderTextColor={colors.textLight}
                autoCapitalize="words"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Staff ID <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={styles.input}
                value={staffId}
                onChangeText={setStaffId}
                placeholder="Enter staff ID"
                placeholderTextColor={colors.textLight}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                School Email <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={styles.input}
                value={schoolEmail}
                onChangeText={setSchoolEmail}
                placeholder="Enter school email"
                placeholderTextColor={colors.textLight}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Password <Text style={styles.required}>*</Text>
              </Text>
              <PasswordInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="Enter password"
                placeholderTextColor={colors.textLight}
                autoCapitalize="none"
                iconColor={colors.textLight}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Position <Text style={styles.required}>*</Text>
              </Text>
              <TouchableOpacity
                style={styles.pickerButton}
                onPress={() => setShowPositionPicker(true)}
              >
                <Text style={styles.pickerButtonText}>{getPositionName(position)}</Text>
                <ChevronDown size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {position === 'teacher' && (
              <>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>
                    Specialization <Text style={styles.required}>*</Text>
                  </Text>
                  <TouchableOpacity
                    style={styles.pickerButton}
                    onPress={() => setShowSpecializationPicker(true)}
                  >
                    <Text style={styles.pickerButtonText}>
                      {getSpecializationName(specialization)}
                    </Text>
                    <ChevronDown size={20} color={colors.textSecondary} />
                  </TouchableOpacity>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Rank</Text>
                  <TouchableOpacity
                    style={styles.pickerButton}
                    onPress={() => setShowRankPicker(true)}
                  >
                    <Text style={styles.pickerButtonText}>{getRankName(rank)}</Text>
                    <ChevronDown size={20} color={colors.textSecondary} />
                  </TouchableOpacity>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Cluster Role (Optional)</Text>
                  <TouchableOpacity
                    style={styles.pickerButton}
                    onPress={() => setShowClusterRolePicker(true)}
                  >
                    <Text style={styles.pickerButtonText}>
                      {clusterRole ? getClusterRoleName(clusterRole) : 'None'}
                    </Text>
                    <ChevronDown size={20} color={colors.textSecondary} />
                  </TouchableOpacity>
                </View>
              </>
            )}

            <View style={styles.permissionsSection}>
              <View style={styles.permissionsHeader}>
                <Shield size={20} color={colors.primary} />
                <Text style={styles.permissionsTitle}>Permissions</Text>
              </View>
              {STAFF_PERMISSIONS.map(perm => (
                <TouchableOpacity
                  key={perm.key}
                  style={styles.permissionItem}
                  onPress={() => togglePermission(perm.key as any)}
                >
                  <View style={styles.permissionInfo}>
                    <Text style={styles.permissionName}>{perm.name}</Text>
                    <Text style={styles.permissionDescription}>{perm.description}</Text>
                  </View>
                  <View style={[styles.checkbox, permissions.includes(perm.key) && styles.checkboxChecked]}>
                    {permissions.includes(perm.key) && <View style={styles.checkboxInner} />}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.createButton, isCreating && styles.createButtonDisabled]}
                onPress={handleCreateStaff}
                disabled={isCreating}
              >
                {isCreating ? (
                  <ActivityIndicator color={colors.surface} />
                ) : (
                  <Text style={styles.createButtonText}>Create Staff</Text>
                )}
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </KeyboardAvoidingView>
      </Modal>

      <Modal
        visible={showPositionPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPositionPicker(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowPositionPicker(false)}
        >
          <View style={styles.pickerModal}>
            <Text style={styles.pickerTitle}>Select Position</Text>
            {STAFF_POSITIONS.map(pos => (
              <TouchableOpacity
                key={pos.key}
                style={[styles.pickerOption, position === pos.key && styles.pickerOptionSelected]}
                onPress={() => {
                  setPosition(pos.key);
                  setShowPositionPicker(false);
                }}
              >
                <Text style={[styles.pickerOptionText, position === pos.key && styles.pickerOptionTextSelected]}>
                  {pos.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal
        visible={showSpecializationPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSpecializationPicker(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowSpecializationPicker(false)}
        >
          <View style={styles.pickerModal}>
            <Text style={styles.pickerTitle}>Select Specialization</Text>
            <ScrollView style={styles.pickerScroll}>
              {SUBJECT_SPECIALIZATIONS.map(spec => (
                <TouchableOpacity
                  key={spec.key}
                  style={[styles.pickerOption, specialization === spec.key && styles.pickerOptionSelected]}
                  onPress={() => {
                    setSpecialization(spec.key);
                    setShowSpecializationPicker(false);
                  }}
                >
                  <Text style={[styles.pickerOptionText, specialization === spec.key && styles.pickerOptionTextSelected]}>
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
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowRankPicker(false)}
        >
          <View style={styles.pickerModal}>
            <Text style={styles.pickerTitle}>Select Rank</Text>
            {TEACHER_RANKS.map(r => (
              <TouchableOpacity
                key={r.key}
                style={[styles.pickerOption, rank === r.key && styles.pickerOptionSelected]}
                onPress={() => {
                  setRank(r.key);
                  setShowRankPicker(false);
                }}
              >
                <Text style={[styles.pickerOptionText, rank === r.key && styles.pickerOptionTextSelected]}>
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
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowClusterRolePicker(false)}
        >
          <View style={styles.pickerModal}>
            <Text style={styles.pickerTitle}>Select Cluster Role</Text>
            <TouchableOpacity
              style={[styles.pickerOption, !clusterRole && styles.pickerOptionSelected]}
              onPress={() => {
                setClusterRole(undefined);
                setShowClusterRolePicker(false);
              }}
            >
              <Text style={[styles.pickerOptionText, !clusterRole && styles.pickerOptionTextSelected]}>
                None
              </Text>
            </TouchableOpacity>
            {CLUSTER_ROLES.map(cr => (
              <TouchableOpacity
                key={cr.key}
                style={[styles.pickerOption, clusterRole === cr.key && styles.pickerOptionSelected]}
                onPress={() => {
                  setClusterRole(cr.key);
                  setShowClusterRolePicker(false);
                }}
              >
                <Text style={[styles.pickerOptionText, clusterRole === cr.key && styles.pickerOptionTextSelected]}>
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
  header: {
    padding: 16,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 12,
    paddingHorizontal: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text,
  },
  content: {
    flex: 1,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 48,
    marginTop: 100,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600' as const,
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  staffList: {
    padding: 16,
  },
  categorySection: {
    marginBottom: 32,
  },
  categoryTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: colors.text,
    marginBottom: 8,
  },
  divider: {
    height: 2,
    backgroundColor: colors.text,
    marginBottom: 16,
  },
  staffCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    gap: 16,
    marginBottom: 12,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  staffPhoto: {
    width: 72,
    height: 72,
    borderRadius: 36,
  },
  staffPhotoPlaceholder: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#90C659',
    alignItems: 'center',
    justifyContent: 'center',
  },
  staffInitial: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: colors.surface,
  },
  staffInfo: {
    flex: 1,
  },
  staffName: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: colors.text,
    marginBottom: 4,
  },
  staffPosition: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  clusterRole: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#2563EB',
    marginBottom: 2,
  },
  staffRank: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  footer: {
    padding: 16,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  addButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  addButtonText: {
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
  closeButton: {
    padding: 4,
  },
  modalContent: {
    flex: 1,
    padding: 24,
  },
  photoSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  photoButton: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed' as const,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  photoPreview: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  photoButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.text,
  },
  photoButtonHint: {
    fontSize: 12,
    color: colors.textLight,
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
  pickerButtonText: {
    fontSize: 16,
    color: colors.text,
  },
  permissionsSection: {
    marginTop: 8,
    marginBottom: 24,
  },
  permissionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  permissionsTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: colors.text,
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
  modalFooter: {
    padding: 16,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  createButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  createButtonDisabled: {
    opacity: 0.6,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: colors.surface,
  },
  modalOverlay: {
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
