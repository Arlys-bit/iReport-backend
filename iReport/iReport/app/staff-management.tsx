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
  Alert,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { X, Search, Users, Plus, ChevronRight, Camera, Shield, ChevronDown } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useStaff } from '@/contexts/StaffContext';
import { StaffMember, StaffPosition, SubjectSpecialization, TeacherRank, ClusterRole, StaffPermission } from '@/types';
import { STAFF_POSITIONS, SUBJECT_SPECIALIZATIONS, TEACHER_RANKS, CLUSTER_ROLES, STAFF_PERMISSIONS } from '@/constants/staff';
import colors from '@/constants/colors';
import * as ImagePicker from 'expo-image-picker';

export default function StaffManagementScreen() {
  const router = useRouter();
  const { users, currentUser } = useAuth();
  const { staff, createStaff, isCreating } = useStaff() as any;
  const [activeTab, setActiveTab] = useState('students' as 'students' | 'teachers');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // State for teacher creation form
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

  // Filter users by role
  const students = useMemo(
    () =>
      users
        .filter((u: any) => u.role === 'student')
        .filter((u: any) =>
          u.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (u.lrn && u.lrn.toLowerCase().includes(searchQuery.toLowerCase()))
        ),
    [users, searchQuery]
  );

  // Group staff by position and specialization
  const groupedStaff = useMemo(() => {
    const groups: {
      administration: StaffMember[];
      teachers: Record<SubjectSpecialization, StaffMember[]>;
    } = {
      administration: [],
      teachers: {} as Record<SubjectSpecialization, StaffMember[]>,
    };

    const filteredStaff = staff.filter((s: any) =>
      s.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.staffId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.schoolEmail.toLowerCase().includes(searchQuery.toLowerCase())
    );

    filteredStaff.forEach((member: any) => {
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
  }, [staff, searchQuery]);

  const displayData = activeTab === 'students' ? students : staff;

  const handleCreateNew = () => {
    setShowCreateModal(true);
  };

  const handleNavigateToCreate = () => {
    setShowCreateModal(false);
    if (activeTab === 'students') {
      router.push('/admin/students');
    } else {
      router.push('/admin/staff');
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
    setShowCreateModal(false);
  };

  const resetForm = () => {
    setFullName('');
    setStaffId('');
    setSchoolEmail('');
    setPassword('');
    setPosition('teacher' as StaffPosition);
    setSpecialization('english' as SubjectSpecialization);
    setRank('regular_teacher' as TeacherRank);
    setClusterRole(undefined);
    setProfilePhoto(undefined);
    setPermissions(['view_all_reports', 'manage_reports'] as StaffPermission[]);
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

  const UserCard: any = ({ user }: { user: any }) => {
    return (
      <TouchableOpacity style={styles.userCard}>
        {user.profilePhoto ? (
          <Image source={{ uri: user.profilePhoto }} style={styles.userPhoto} />
        ) : (
          <View style={styles.userPhotoPlaceholder}>
            <Text style={styles.userInitial}>
              {user.fullName.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{user.fullName}</Text>
          {activeTab === 'students' ? (
            <>
              <Text style={styles.userMeta}>LRN: {user.lrn || 'N/A'}</Text>
              <Text style={styles.userMeta}>
                Grade {user.gradeLevel} - {user.section}
              </Text>
            </>
          ) : (
            <>
              <Text style={styles.userMeta}>{user.email}</Text>
              <Text style={styles.userMeta}>Teacher</Text>
            </>
          )}
        </View>
        <ChevronRight size={20} color={colors.textSecondary} />
      </TouchableOpacity>
    );
  };

  const StaffCard: any = ({ member }: { member: any }) => {
    return (
      <TouchableOpacity 
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
          {member.clusterRole && (
            <Text style={styles.clusterRole}>
              {getClusterRoleName(member.clusterRole)}
            </Text>
          )}
          {member.rank && (
            <Text style={styles.staffRank}>{getRankName(member.rank)}</Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Welcome back,</Text>
          <Text style={styles.title}>Staff Management</Text>
        </View>
        <TouchableOpacity
          style={styles.createButton}
          onPress={handleCreateNew}
        >
          <Plus size={20} color={colors.surface} />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'students' && styles.tabActive,
          ]}
          onPress={() => setActiveTab('students')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'students' && styles.tabTextActive,
            ]}
          >
            Students ({students.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'teachers' && styles.tabActive,
          ]}
          onPress={() => setActiveTab('teachers')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'teachers' && styles.tabTextActive,
            ]}
          >
            Teachers ({staff.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Search size={20} color={colors.textSecondary} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder={`Search ${activeTab}...`}
          placeholderTextColor={colors.textLight}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <X size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {/* List */}
      <ScrollView
        style={styles.listContainer}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === 'students' ? (
          displayData.length === 0 ? (
            <View style={styles.emptyState}>
              <Users size={48} color={colors.textLight} />
              <Text style={styles.emptyTitle}>No students found</Text>
              <Text style={styles.emptyText}>
                {searchQuery.length > 0
                  ? 'Try a different search term'
                  : 'No students to display'}
              </Text>
            </View>
          ) : (
            displayData.map((user: any, index: number) => (
              <View key={index}>
                <UserCard user={user} />
              </View>
            ))
          )
        ) : (
          staff.length === 0 ? (
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
                    <StaffCard key={member.id} member={member} />
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
                      <StaffCard key={teacher.id} member={teacher} />
                    ))}
                  </View>
                );
              })}
            </View>
          )
        )}
      </ScrollView>

      {/* Create Modal */}
      <Modal
        visible={showCreateModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCreateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Create New {activeTab === 'students' ? 'Student' : 'Teacher'}
              </Text>
              <TouchableOpacity
                onPress={() => setShowCreateModal(false)}
              >
                <X size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalText}>
              To create a new {activeTab === 'students' ? 'student' : 'teacher'},
              you'll be taken to the detailed creation form.
            </Text>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.button, styles.buttonSecondary]}
                onPress={() => setShowCreateModal(false)}
              >
                <Text style={styles.buttonTextSecondary}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.buttonPrimary]}
                onPress={handleNavigateToCreate}
              >
                <Text style={styles.buttonTextPrimary}>Continue</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  greeting: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginTop: 4,
  },
  createButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    paddingHorizontal: 20,
    paddingTop: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  tab: {
    flex: 1,
    paddingBottom: 12,
    marginRight: 24,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: colors.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  tabTextActive: {
    color: colors.primary,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginVertical: 16,
    paddingHorizontal: 12,
    height: 44,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
  },
  listContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  userPhoto: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  userPhotoPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  userInitial: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.surface,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  userMeta: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginTop: 16,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  staffList: {
    marginTop: 8,
    marginBottom: 20,
  },
  categorySection: {
    marginBottom: 24,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
    marginLeft: 4,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginBottom: 12,
  },
  staffCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginBottom: 10,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  staffPhoto: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  staffPhotoPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  staffInitial: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.surface,
  },
  staffInfo: {
    flex: 1,
  },
  staffName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  clusterRole: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '600',
    marginBottom: 2,
  },
  staffRank: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 32,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  modalText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPrimary: {
    backgroundColor: colors.primary,
  },
  buttonSecondary: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  buttonTextPrimary: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.surface,
  },
  buttonTextSecondary: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
});
