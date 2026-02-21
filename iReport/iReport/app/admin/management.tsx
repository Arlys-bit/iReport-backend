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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { 
  Search, 
  Users, 
  UserCog, 
  GraduationCap,
  X, 
  Camera, 
  ChevronDown,
  ChevronRight,
  Plus,
  Shield,
  FolderPlus,
  Trash2,
} from 'lucide-react-native';
import { useStudents } from '@/contexts/StudentsContext';
import { useStaff } from '@/contexts/StaffContext';
import { useAuth } from '@/contexts/AuthContext';
import { useSettings } from '@/contexts/SettingsContext';
import { 
  Student, 
  StaffMember, 
  GradeLevel, 
  Section,
  StaffPosition, 
  SubjectSpecialization, 
  TeacherRank, 
  ClusterRole, 
  StaffPermission,
} from '@/types';
import { STAFF_POSITIONS, SUBJECT_SPECIALIZATIONS, TEACHER_RANKS, CLUSTER_ROLES, STAFF_PERMISSIONS } from '@/constants/staff';
import colors from '@/constants/colors';

type TabType = 'teachers' | 'grades';

export default function ManagementPage() {
  const { colors, isDark } = useSettings();
  const { currentUser, checkPermission } = useAuth();
  const { students, gradeLevels, sections, createStudent, createGradeLevel, createSection, deleteGradeLevel, deleteSection, isCreatingStudent } = useStudents();
  const { staff, createStaff, isCreating: isCreatingStaff } = useStaff();

  const [activeTab, setActiveTab] = useState<TabType>('teachers');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [showGradeModal, setShowGradeModal] = useState(false);
  const [showSectionModal, setShowSectionModal] = useState(false);

  const [studentForm, setStudentForm] = useState({
    fullName: '',
    lrn: '',
    gradeLevelId: '',
    sectionId: '',
    email: '',
    password: '',
    confirmPassword: '',
    profilePhoto: undefined as string | undefined,
  });

  const [staffForm, setStaffForm] = useState({
    fullName: '',
    staffId: '',
    schoolEmail: '',
    password: '',
    confirmPassword: '',
    position: 'teacher' as StaffPosition,
    specialization: 'english' as SubjectSpecialization,
    rank: 'regular_teacher' as TeacherRank,
    clusterRole: undefined as ClusterRole | undefined,
    profilePhoto: undefined as string | undefined,
    permissions: ['view_all_reports', 'manage_reports'] as StaffPermission[],
    isTeaching: false,
  });

  const [customPositions, setCustomPositions] = useState<{ key: string; name: string }[]>([]);
  const [customSpecializations, setCustomSpecializations] = useState<{ key: string; name: string }[]>([]);
  const [customRanks, setCustomRanks] = useState<{ key: string; name: string }[]>([]);
  const [showAddCustomModal, setShowAddCustomModal] = useState<'position' | 'specialization' | 'rank' | null>(null);
  const [customItemName, setCustomItemName] = useState('');
  const [showPermissionsPicker, setShowPermissionsPicker] = useState(false);

  const [gradeForm, setGradeForm] = useState({ name: '' });
  const [sectionForm, setSectionForm] = useState({ name: '', gradeLevelId: '', advisorId: '' });

  const [showGradePicker, setShowGradePicker] = useState(false);
  const [showSectionPicker, setShowSectionPicker] = useState(false);
  const [showPositionPicker, setShowPositionPicker] = useState(false);
  const [showSpecializationPicker, setShowSpecializationPicker] = useState(false);
  const [showRankPicker, setShowRankPicker] = useState(false);
  const [expandedSectionId, setExpandedSectionId] = useState<string | null>(null);
  const [showDeleteGradeModal, setShowDeleteGradeModal] = useState(false);
  const [showDeleteSectionModal, setShowDeleteSectionModal] = useState(false);
  const [selectedGradeToDelete, setSelectedGradeToDelete] = useState<string | null>(null);
  const [selectedSectionToDelete, setSelectedSectionToDelete] = useState<string | null>(null);

  const canCreateGradesSections = checkPermission('create_grades_sections');
  const canDeleteGradesSections = checkPermission('create_grades_sections');

  const filteredStaff = useMemo(() => {
    if (!searchQuery.trim()) return staff;
    const query = searchQuery.toLowerCase();
    return staff.filter(s => 
      s.fullName.toLowerCase().includes(query) ||
      s.staffId.toLowerCase().includes(query)
    );
  }, [staff, searchQuery]);

  const groupedStaff = useMemo(() => {
    const groups: {
      principal: StaffMember[];
      vice_principal: StaffMember[];
      guidance: StaffMember[];
      teachers: Record<string, StaffMember[]>;
    } = {
      principal: [],
      vice_principal: [],
      guidance: [],
      teachers: {} as Record<string, StaffMember[]>,
    };

    filteredStaff.forEach(member => {
      if (member.position === 'principal') {
        groups.principal.push(member);
      } else if (member.position === 'vice_principal') {
        groups.vice_principal.push(member);
      } else if (member.position === 'guidance_counselor') {
        groups.guidance.push(member);
      } else if (member.position === 'teacher' && member.specialization) {
        if (!groups.teachers[member.specialization]) {
          groups.teachers[member.specialization] = [];
        }
        groups.teachers[member.specialization].push(member);
      }
    });

    return groups;
  }, [filteredStaff]);

  const availableSections = useMemo(() => {
    return sections.filter(s => s.gradeLevelId === studentForm.gradeLevelId);
  }, [sections, studentForm.gradeLevelId]);

  const handlePickImage = async (type: 'student' | 'staff') => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled) {
      if (type === 'student') {
        setStudentForm(prev => ({ ...prev, profilePhoto: result.assets[0].uri }));
      } else {
        setStaffForm(prev => ({ ...prev, profilePhoto: result.assets[0].uri }));
      }
    }
  };

  const handleCreateStudent = async () => {
    if (!studentForm.fullName.trim() || !studentForm.lrn.trim() || !studentForm.gradeLevelId || 
        !studentForm.sectionId || !studentForm.email.trim() || !studentForm.password.trim()) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }
    
    if (studentForm.password !== studentForm.confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }
    
    if (studentForm.password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    try {
      await createStudent({
        fullName: studentForm.fullName.trim(),
        lrn: studentForm.lrn.trim(),
        gradeLevelId: studentForm.gradeLevelId,
        sectionId: studentForm.sectionId,
        email: studentForm.email.trim(),
        schoolEmail: studentForm.email.trim(),
        password: studentForm.password.trim(),
        profilePhoto: studentForm.profilePhoto,
      });
      
      setStudentForm({
        fullName: '',
        lrn: '',
        gradeLevelId: '',
        sectionId: '',
        email: '',
        password: '',
        confirmPassword: '',
        profilePhoto: undefined,
      });
      setShowStudentModal(false);
      Alert.alert('Success', 'Student created successfully');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to create student');
    }
  };

  const handleCreateStaff = async () => {
    if (!staffForm.fullName.trim() || !staffForm.staffId.trim() || !staffForm.schoolEmail.trim() || !staffForm.password.trim()) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }
    
    if (staffForm.password !== staffForm.confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }
    
    if (staffForm.password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    try {
      await createStaff({
        fullName: staffForm.fullName.trim(),
        staffId: staffForm.staffId.trim(),
        schoolEmail: staffForm.schoolEmail.trim(),
        email: staffForm.schoolEmail.trim(),
        password: staffForm.password.trim(),
        position: staffForm.position,
        specialization: staffForm.position === 'teacher' ? staffForm.specialization : undefined,
        rank: staffForm.position === 'teacher' ? staffForm.rank : undefined,
        clusterRole: staffForm.position === 'teacher' ? staffForm.clusterRole : undefined,
        profilePhoto: staffForm.profilePhoto,
        permissions: staffForm.permissions,
      });
      
      setStaffForm({
        fullName: '',
        staffId: '',
        schoolEmail: '',
        password: '',
        confirmPassword: '',
        position: 'teacher',
        specialization: 'english',
        rank: 'regular_teacher',
        clusterRole: undefined,
        profilePhoto: undefined,
        permissions: ['view_all_reports', 'manage_reports'],
        isTeaching: false,
      });
      setShowStaffModal(false);
      Alert.alert('Success', 'Staff member created successfully');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to create staff');
    }
  };

  const handleCreateGrade = async () => {
    if (!gradeForm.name.trim()) {
      Alert.alert('Error', 'Please enter a grade level name');
      return;
    }

    try {
      await createGradeLevel({ name: gradeForm.name.trim() });
      setGradeForm({ name: '' });
      setShowGradeModal(false);
      Alert.alert('Success', 'Grade level created successfully');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to create grade level');
    }
  };

  const handleCreateSection = async () => {
    if (!sectionForm.name.trim() || !sectionForm.gradeLevelId) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      await createSection({
        name: sectionForm.name.trim(),
        gradeLevelId: sectionForm.gradeLevelId,
        advisorId: sectionForm.advisorId || undefined,
      });
      setSectionForm({ name: '', gradeLevelId: '', advisorId: '' });
      setShowSectionModal(false);
      Alert.alert('Success', 'Section created successfully');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to create section');
    }
  };

  const handleDeleteGrade = async () => {
    if (!selectedGradeToDelete) return;
    
    try {
      await deleteGradeLevel(selectedGradeToDelete);
      setShowDeleteGradeModal(false);
      setSelectedGradeToDelete(null);
      Alert.alert('Success', 'Grade level deleted successfully');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to delete grade level');
    }
  };

  const handleDeleteSection = async () => {
    if (!selectedSectionToDelete) return;
    
    try {
      await deleteSection(selectedSectionToDelete);
      setShowDeleteSectionModal(false);
      setSelectedSectionToDelete(null);
      setExpandedSectionId(null);
      Alert.alert('Success', 'Section deleted successfully');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to delete section');
    }
  };

  const getGradeName = (id: string) => gradeLevels.find(g => g.id === id)?.name || 'Unknown';
  const getSectionName = (id: string) => sections.find(s => s.id === id)?.name || 'Unknown';
  const allPositions = [...STAFF_POSITIONS, ...customPositions];
  const allSpecializations = [...SUBJECT_SPECIALIZATIONS, ...customSpecializations];
  const allRanks = [...TEACHER_RANKS, ...customRanks];

  const getPositionName = (pos: StaffPosition | string) => allPositions.find(p => p.key === pos)?.name || pos;
  const getSpecializationName = (spec: SubjectSpecialization | string) => allSpecializations.find(s => s.key === spec)?.name || spec;
  const getRankName = (r: TeacherRank | string) => allRanks.find(tr => tr.key === r)?.name || r;

  const PERMISSION_PRESETS: Record<StaffPosition, StaffPermission[]> = {
    principal: ['edit_students', 'assign_grades_sections', 'create_grades_sections', 'promote_transfer_students', 'edit_staff_profiles', 'manage_reports', 'access_sensitive_data', 'manage_permissions', 'view_all_reports', 'remove_students'],
    vice_principal: ['edit_students', 'assign_grades_sections', 'create_grades_sections', 'promote_transfer_students', 'edit_staff_profiles', 'manage_reports', 'access_sensitive_data', 'view_all_reports'],
    guidance_counselor: ['view_all_reports', 'manage_reports', 'access_sensitive_data'],
    teacher: ['view_all_reports', 'manage_reports'],
  };

  const handlePositionChange = (pos: StaffPosition) => {
    const presetPermissions = PERMISSION_PRESETS[pos] || ['view_all_reports', 'manage_reports'];
    setStaffForm(prev => ({ 
      ...prev, 
      position: pos, 
      permissions: presetPermissions,
      isTeaching: false,
    }));
  };

  const handleAddCustomItem = () => {
    if (!customItemName.trim()) return;
    const key = customItemName.toLowerCase().replace(/\s+/g, '_');
    if (showAddCustomModal === 'position') {
      setCustomPositions(prev => [...prev, { key, name: customItemName.trim() }]);
    } else if (showAddCustomModal === 'specialization') {
      setCustomSpecializations(prev => [...prev, { key, name: customItemName.trim() }]);
    } else if (showAddCustomModal === 'rank') {
      setCustomRanks(prev => [...prev, { key, name: customItemName.trim() }]);
    }
    setCustomItemName('');
    setShowAddCustomModal(null);
  };

  const handleDeleteCustomItem = (type: 'position' | 'specialization' | 'rank', key: string) => {
    if (type === 'position') {
      setCustomPositions(prev => prev.filter(p => p.key !== key));
    } else if (type === 'specialization') {
      setCustomSpecializations(prev => prev.filter(s => s.key !== key));
    } else if (type === 'rank') {
      setCustomRanks(prev => prev.filter(r => r.key !== key));
    }
  };

  const togglePermission = (permission: StaffPermission) => {
    setStaffForm(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permission)
        ? prev.permissions.filter(p => p !== permission)
        : [...prev.permissions, permission],
    }));
  };

  const renderTeachersTab = () => (
    <ScrollView style={styles.tabContent}>
      {staff.length === 0 ? (
        <View style={styles.emptyState}>
          <UserCog size={48} color={colors.textLight} />
          <Text style={styles.emptyTitle}>No staff members yet</Text>
          <Text style={styles.emptyText}>Add your first staff member to get started</Text>
        </View>
      ) : (
        <>
          {groupedStaff.principal.length > 0 && (
            <View style={styles.staffCategory}>
              <Text style={styles.categoryTitle}>Principal</Text>
              <View style={styles.categoryDivider} />
              <View style={styles.staffGrid}>
                {groupedStaff.principal.map(member => (
                  <TouchableOpacity
                    key={member.id}
                    style={styles.staffGridItem}
                    onPress={() => router.push(`/admin/staff/${member.id}` as any)}
                  >
                    {member.profilePhoto ? (
                      <Image source={{ uri: member.profilePhoto }} style={styles.staffGridPhoto} />
                    ) : (
                      <View style={styles.staffGridPhotoPlaceholder}>
                        <Text style={styles.staffGridInitial}>
                          {member.fullName.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                    )}
                    <Text style={styles.staffGridName}>{member.fullName}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {groupedStaff.vice_principal.length > 0 && (
            <View style={styles.staffCategory}>
              <Text style={styles.categoryTitle}>Vice Principal</Text>
              <View style={styles.categoryDivider} />
              <View style={styles.staffGrid}>
                {groupedStaff.vice_principal.map(member => (
                  <TouchableOpacity
                    key={member.id}
                    style={styles.staffGridItem}
                    onPress={() => router.push(`/admin/staff/${member.id}` as any)}
                  >
                    {member.profilePhoto ? (
                      <Image source={{ uri: member.profilePhoto }} style={styles.staffGridPhoto} />
                    ) : (
                      <View style={styles.staffGridPhotoPlaceholder}>
                        <Text style={styles.staffGridInitial}>
                          {member.fullName.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                    )}
                    <Text style={styles.staffGridName}>{member.fullName}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {groupedStaff.guidance.length > 0 && (
            <View style={styles.staffCategory}>
              <Text style={styles.categoryTitle}>Guidance</Text>
              <View style={styles.categoryDivider} />
              <View style={styles.staffGrid}>
                {groupedStaff.guidance.map(member => (
                  <TouchableOpacity
                    key={member.id}
                    style={styles.staffGridItem}
                    onPress={() => router.push(`/admin/staff/${member.id}` as any)}
                  >
                    {member.profilePhoto ? (
                      <Image source={{ uri: member.profilePhoto }} style={styles.staffGridPhoto} />
                    ) : (
                      <View style={styles.staffGridPhotoPlaceholder}>
                        <Text style={styles.staffGridInitial}>
                          {member.fullName.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                    )}
                    <Text style={styles.staffGridName}>{member.fullName}</Text>
                    {member.assignedGradeLevelIds && member.assignedGradeLevelIds.length > 0 && (
                      <Text style={styles.staffGridSubtitle}>
                        {member.assignedGradeLevelIds.map(id => getGradeName(id)).join(', ')}
                      </Text>
                    )}
                    {member.rank && (
                      <Text style={styles.staffGridRank}>{getRankName(member.rank as any)}</Text>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {Object.entries(groupedStaff.teachers).map(([spec, teachers]) => {
            if (teachers.length === 0) return null;
            return (
              <View key={spec} style={styles.staffCategory}>
                <Text style={styles.categoryTitle}>{getSpecializationName(spec as SubjectSpecialization)}</Text>
                <View style={styles.categoryDivider} />
                <View style={styles.staffGrid}>
                  {teachers.map(member => (
                    <TouchableOpacity
                      key={member.id}
                      style={styles.staffGridItem}
                      onPress={() => router.push(`/admin/staff/${member.id}` as any)}
                    >
                      {member.profilePhoto ? (
                        <Image source={{ uri: member.profilePhoto }} style={styles.staffGridPhoto} />
                      ) : (
                        <View style={styles.staffGridPhotoPlaceholder}>
                          <Text style={styles.staffGridInitial}>
                            {member.fullName.charAt(0).toUpperCase()}
                          </Text>
                        </View>
                      )}
                      <Text style={styles.staffGridName}>{member.fullName}</Text>
                      {member.assignedGradeLevelIds && member.assignedGradeLevelIds.length > 0 && (
                        <Text style={styles.staffGridSubtitle}>
                          {member.assignedGradeLevelIds.map(id => getGradeName(id)).join(', ')}
                        </Text>
                      )}
                      {member.rank && (
                        <Text style={styles.staffGridRank}>{getRankName(member.rank as any)}</Text>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            );
          })}
        </>
      )}
    </ScrollView>
  );

  const renderGradesTab = () => (
    <ScrollView style={styles.tabContent}>
      {gradeLevels.length === 0 ? (
        <View style={styles.emptyState}>
          <FolderPlus size={48} color={colors.textLight} />
          <Text style={styles.emptyTitle}>No grade levels yet</Text>
          <Text style={styles.emptyText}>Create grade levels and sections to organize students</Text>
        </View>
      ) : (
        gradeLevels.map(grade => {
          const gradeSections = sections.filter(s => s.gradeLevelId === grade.id);
          
          return (
            <View key={grade.id} style={styles.gradeCard}>
              <View style={styles.gradeCardHeader}>
                <View style={styles.gradeCardTitleRow}>
                  <Text style={styles.gradeCardTitle}>{grade.name}</Text>
                  {canDeleteGradesSections && (
                    <TouchableOpacity
                      style={styles.deleteGradeButton}
                      onPress={() => {
                        setSelectedGradeToDelete(grade.id);
                        setShowDeleteGradeModal(true);
                      }}
                    >
                      <Trash2 size={16} color={colors.error} />
                    </TouchableOpacity>
                  )}
                </View>
                <Text style={styles.gradeCardCount}>
                  {gradeSections.length} section{gradeSections.length !== 1 ? 's' : ''}
                </Text>
              </View>
              <View style={styles.sectionsListContainer}>
                {gradeSections.map(section => {
                  const sectionStudents = students.filter(s => s.sectionId === section.id);
                  const advisor = staff.find(s => s.id === section.advisorId);
                  const isExpanded = expandedSectionId === section.id;
                  
                  return (
                    <View key={section.id}>
                      <TouchableOpacity 
                        style={[styles.sectionCardClickable, isExpanded && styles.sectionCardExpanded]}
                        onPress={() => setExpandedSectionId(isExpanded ? null : section.id)}
                        activeOpacity={0.7}
                      >
                        <View style={styles.sectionCardLeft}>
                          <View style={[styles.sectionIndicator, isExpanded && styles.sectionIndicatorActive]} />
                          <View style={styles.sectionCardContent}>
                            <Text style={styles.sectionCardTitle}>Section {section.name}</Text>
                            <Text style={styles.sectionCardInfo}>
                              {sectionStudents.length} student{sectionStudents.length !== 1 ? 's' : ''}
                              {advisor ? ` • ${advisor.fullName}` : ''}
                            </Text>
                          </View>
                        </View>
                        <ChevronRight 
                          size={20} 
                          color={isExpanded ? colors.primary : colors.textLight} 
                          style={{ transform: [{ rotate: isExpanded ? '90deg' : '0deg' }] }}
                        />
                      </TouchableOpacity>
                      
                      {isExpanded && (
                        <View style={styles.expandedStudentsList}>
                          {sectionStudents.length === 0 ? (
                            <View style={styles.noStudentsContainer}>
                              <Text style={styles.noStudentsText}>No students in this section</Text>
                            </View>
                          ) : (
                            sectionStudents.map(student => (
                              <TouchableOpacity
                                key={student.id}
                                style={styles.expandedStudentCard}
                                onPress={() => router.push(`/admin/students/${student.id}` as any)}
                              >
                                {student.profilePhoto ? (
                                  <Image source={{ uri: student.profilePhoto }} style={styles.expandedStudentPhoto} />
                                ) : (
                                  <View style={styles.expandedStudentPhotoPlaceholder}>
                                    <Text style={styles.expandedStudentInitial}>
                                      {student.fullName.charAt(0).toUpperCase()}
                                    </Text>
                                  </View>
                                )}
                                <View style={styles.expandedStudentInfo}>
                                  <Text style={styles.expandedStudentName}>{student.fullName}</Text>
                                  <Text style={styles.expandedStudentLrn}>LRN: {student.lrn}</Text>
                                </View>
                                <ChevronRight size={16} color={colors.textLight} />
                              </TouchableOpacity>
                            ))
                          )}
                          <TouchableOpacity
                            style={styles.addStudentToSectionButton}
                            onPress={() => {
                              setStudentForm(prev => ({
                                ...prev,
                                gradeLevelId: grade.id,
                                sectionId: section.id,
                              }));
                              setShowStudentModal(true);
                            }}
                          >
                            <Plus size={16} color={colors.primary} />
                            <Text style={styles.addStudentToSectionText}>Add Student</Text>
                          </TouchableOpacity>
                          {canDeleteGradesSections && (
                            <TouchableOpacity
                              style={styles.deleteSectionButton}
                              onPress={() => {
                                setSelectedSectionToDelete(section.id);
                                setShowDeleteSectionModal(true);
                              }}
                            >
                              <Trash2 size={16} color={colors.error} />
                              <Text style={styles.deleteSectionButtonText}>Delete Section</Text>
                            </TouchableOpacity>
                          )}
                        </View>
                      )}
                    </View>
                  );
                })}
                {canCreateGradesSections && (
                  <TouchableOpacity
                    style={styles.addSectionButton}
                    onPress={() => {
                      setSectionForm({ ...sectionForm, gradeLevelId: grade.id });
                      setShowSectionModal(true);
                    }}
                  >
                    <Plus size={16} color={colors.primary} />
                    <Text style={styles.addSectionButtonText}>Add Section</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          );
        })
      )}
    </ScrollView>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
      <View style={[styles.header, { backgroundColor: colors.surface }]}>
        <View style={styles.searchContainer}>
          <Search size={20} color={colors.text} />
          <TextInput
            style={[styles.searchInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search..."
            placeholderTextColor={colors.textSecondary}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <X size={20} color={colors.textLight} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'teachers' && styles.tabActive]}
          onPress={() => setActiveTab('teachers')}
        >
          <UserCog size={20} color={activeTab === 'teachers' ? colors.primary : colors.textSecondary} />
          <Text style={[styles.tabText, activeTab === 'teachers' && styles.tabTextActive]}>Staff</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'grades' && styles.tabActive]}
          onPress={() => setActiveTab('grades')}
        >
          <FolderPlus size={20} color={activeTab === 'grades' ? colors.primary : colors.textSecondary} />
          <Text style={[styles.tabText, activeTab === 'grades' && styles.tabTextActive]}>Grades</Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'teachers' && renderTeachersTab()}
      {activeTab === 'grades' && renderGradesTab()}

      <View style={styles.footer}>
        {activeTab === 'teachers' && (
          <TouchableOpacity style={styles.addButton} onPress={() => setShowStaffModal(true)}>
            <Plus size={20} color={colors.surface} />
            <Text style={styles.addButtonText}>Add Staff</Text>
          </TouchableOpacity>
        )}
        {activeTab === 'grades' && canCreateGradesSections && (
          <TouchableOpacity style={styles.addButton} onPress={() => setShowGradeModal(true)}>
            <Plus size={20} color={colors.surface} />
            <Text style={styles.addButtonText}>Add Grade Level</Text>
          </TouchableOpacity>
        )}
      </View>

      <Modal visible={showStudentModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
          <View style={[styles.modalHeader, { backgroundColor: colors.surface }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Create Student</Text>
            <TouchableOpacity onPress={() => setShowStudentModal(false)}>
              <X size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
          <ScrollView style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <View style={styles.photoSection}>
              <TouchableOpacity style={styles.photoButton} onPress={() => handlePickImage('student')}>
                {studentForm.profilePhoto ? (
                  <Image source={{ uri: studentForm.profilePhoto }} style={styles.photoPreview} />
                ) : (
                  <>
                    <Camera size={32} color={colors.textLight} />
                    <Text style={styles.photoButtonText}>Add Photo</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Full Name <Text style={styles.required}>*</Text></Text>
              <TextInput
                style={[styles.input, { color: colors.text, backgroundColor: colors.surface, borderColor: colors.border }]}
                value={studentForm.fullName}
                onChangeText={text => setStudentForm(prev => ({ ...prev, fullName: text }))}
                placeholder="Enter full name"
                placeholderTextColor={colors.textSecondary}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>LRN <Text style={styles.required}>*</Text></Text>
              <TextInput
                style={[styles.input, { color: colors.text, backgroundColor: colors.surface, borderColor: colors.border }]}
                value={studentForm.lrn}
                onChangeText={text => setStudentForm(prev => ({ ...prev, lrn: text }))}
                placeholder="Enter LRN"
                placeholderTextColor={colors.textSecondary}
                keyboardType="number-pad"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Grade Level <Text style={styles.required}>*</Text></Text>
              <TouchableOpacity style={[styles.pickerButton, { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={() => setShowGradePicker(true)}>
                <Text style={[styles.pickerButtonText, { color: colors.text }]}>
                  {studentForm.gradeLevelId ? getGradeName(studentForm.gradeLevelId) : 'Select Grade Level'}
                </Text>
                <ChevronDown size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Section <Text style={styles.required}>*</Text></Text>
              <TouchableOpacity 
                style={[styles.pickerButton, { backgroundColor: colors.surface, borderColor: colors.border }, !studentForm.gradeLevelId && styles.pickerButtonDisabled]} 
                onPress={() => studentForm.gradeLevelId && setShowSectionPicker(true)}
                disabled={!studentForm.gradeLevelId}
              >
                <Text style={[styles.pickerButtonText, { color: colors.text }]}>
                  {studentForm.sectionId ? getSectionName(studentForm.sectionId) : 'Select Section'}
                </Text>
                <ChevronDown size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>School Email <Text style={styles.required}>*</Text></Text>
              <TextInput
                style={[styles.input, { color: colors.text, backgroundColor: colors.surface, borderColor: colors.border }]}
                value={studentForm.email}
                onChangeText={text => setStudentForm(prev => ({ ...prev, email: text }))}
                placeholder="Enter school email"
                placeholderTextColor={colors.textSecondary}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Password <Text style={styles.required}>*</Text></Text>
              <TextInput
                style={[styles.input, { color: colors.text, backgroundColor: colors.surface, borderColor: colors.border }]}
                value={studentForm.password}
                onChangeText={text => setStudentForm(prev => ({ ...prev, password: text }))}
                placeholder="Enter password"
                placeholderTextColor={colors.textSecondary}
                secureTextEntry
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Confirm Password <Text style={styles.required}>*</Text></Text>
              <TextInput
                style={[styles.input, { color: colors.text, backgroundColor: colors.surface, borderColor: colors.border }]}
                value={studentForm.confirmPassword}
                onChangeText={text => setStudentForm(prev => ({ ...prev, confirmPassword: text }))}
                placeholder="Confirm password"
                placeholderTextColor={colors.textSecondary}
                secureTextEntry
              />
            </View>
          </ScrollView>
          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={[styles.submitButton, isCreatingStudent && styles.submitButtonDisabled]}
              onPress={handleCreateStudent}
              disabled={isCreatingStudent}
            >
              {isCreatingStudent ? (
                <ActivityIndicator color={colors.surface} />
              ) : (
                <Text style={styles.submitButtonText}>Create Student</Text>
              )}
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>

      <Modal visible={showStaffModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
          <View style={[styles.modalHeader, { backgroundColor: colors.surface }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Create Staff Member</Text>
            <TouchableOpacity onPress={() => setShowStaffModal(false)}>
              <X size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
          <ScrollView style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <View style={styles.photoSection}>
              <TouchableOpacity style={styles.photoButton} onPress={() => handlePickImage('staff')}>
                {staffForm.profilePhoto ? (
                  <Image source={{ uri: staffForm.profilePhoto }} style={styles.photoPreview} />
                ) : (
                  <>
                    <Camera size={32} color={colors.textLight} />
                    <Text style={styles.photoButtonText}>Add Photo</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Full Name <Text style={styles.required}>*</Text></Text>
              <TextInput
                style={[styles.input, { color: colors.text, backgroundColor: colors.surface, borderColor: colors.border }]}
                value={staffForm.fullName}
                onChangeText={text => setStaffForm(prev => ({ ...prev, fullName: text }))}
                placeholder="Enter full name"
                placeholderTextColor={colors.textSecondary}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Staff ID <Text style={styles.required}>*</Text></Text>
              <TextInput
                style={[styles.input, { color: colors.text, backgroundColor: colors.surface, borderColor: colors.border }]}
                value={staffForm.staffId}
                onChangeText={text => setStaffForm(prev => ({ ...prev, staffId: text }))}
                placeholder="Enter staff ID"
                placeholderTextColor={colors.textSecondary}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>School Email <Text style={styles.required}>*</Text></Text>
              <TextInput
                style={[styles.input, { color: colors.text, backgroundColor: colors.surface, borderColor: colors.border }]}
                value={staffForm.schoolEmail}
                onChangeText={text => setStaffForm(prev => ({ ...prev, schoolEmail: text }))}
                placeholder="Enter school email"
                placeholderTextColor={colors.textSecondary}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Password <Text style={styles.required}>*</Text></Text>
              <TextInput
                style={[styles.input, { color: colors.text, backgroundColor: colors.surface, borderColor: colors.border }]}
                value={staffForm.password}
                onChangeText={text => setStaffForm(prev => ({ ...prev, password: text }))}
                placeholder="Enter password"
                placeholderTextColor={colors.textSecondary}
                secureTextEntry
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Confirm Password <Text style={styles.required}>*</Text></Text>
              <TextInput
                style={[styles.input, { color: colors.text, backgroundColor: colors.surface, borderColor: colors.border }]}
                value={staffForm.confirmPassword}
                onChangeText={text => setStaffForm(prev => ({ ...prev, confirmPassword: text }))}
                placeholder="Confirm password"
                placeholderTextColor={colors.textSecondary}
                secureTextEntry
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Position <Text style={styles.required}>*</Text></Text>
              <TouchableOpacity style={[styles.pickerButton, { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={() => setShowPositionPicker(true)}>
                <Text style={[styles.pickerButtonText, { color: colors.text }]}>{getPositionName(staffForm.position)}</Text>
                <ChevronDown size={20} color={colors.textSecondary} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.addCustomButton} onPress={() => setShowAddCustomModal('position')}>
                <Plus size={14} color={colors.primary} />
                <Text style={styles.addCustomButtonText}>Add Custom Position</Text>
              </TouchableOpacity>
            </View>

            {staffForm.position === 'guidance_counselor' && (
              <TouchableOpacity 
                style={styles.checkboxRow} 
                onPress={() => setStaffForm(prev => ({ ...prev, isTeaching: !prev.isTeaching }))}
              >
                <View style={[styles.checkbox, staffForm.isTeaching && styles.checkboxChecked]}>
                  {staffForm.isTeaching && <View style={styles.checkboxInner} />}
                </View>
                <Text style={styles.checkboxLabel}>Also Teaching</Text>
              </TouchableOpacity>
            )}

            {(staffForm.position === 'teacher' || (staffForm.position === 'guidance_counselor' && staffForm.isTeaching)) && (
              <>
                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: colors.text }]}>Specialization <Text style={styles.required}>*</Text></Text>
                  <TouchableOpacity style={[styles.pickerButton, { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={() => setShowSpecializationPicker(true)}>
                    <Text style={[styles.pickerButtonText, { color: colors.text }]}>{getSpecializationName(staffForm.specialization)}</Text>
                    <ChevronDown size={20} color={colors.textSecondary} />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.addCustomButton} onPress={() => setShowAddCustomModal('specialization')}>
                    <Plus size={14} color={colors.primary} />
                    <Text style={styles.addCustomButtonText}>Add Custom Specialization</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: colors.text }]}>Rank</Text>
                  <TouchableOpacity style={[styles.pickerButton, { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={() => setShowRankPicker(true)}>
                    <Text style={[styles.pickerButtonText, { color: colors.text }]}>{getRankName(staffForm.rank)}</Text>
                    <ChevronDown size={20} color={colors.textSecondary} />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.addCustomButton} onPress={() => setShowAddCustomModal('rank')}>
                    <Plus size={14} color={colors.primary} />
                    <Text style={styles.addCustomButtonText}>Add Custom Rank</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Permissions</Text>
              <TouchableOpacity style={[styles.pickerButton, { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={() => setShowPermissionsPicker(true)}>
                <Text style={[styles.pickerButtonText, { color: colors.text }]}>
                  {staffForm.permissions.length} permission{staffForm.permissions.length !== 1 ? 's' : ''} selected
                </Text>
                <ChevronDown size={20} color={colors.textSecondary} />
              </TouchableOpacity>
              <View style={styles.permissionTags}>
                {staffForm.permissions.slice(0, 3).map(p => (
                  <View key={p} style={styles.permissionTag}>
                    <Text style={styles.permissionTagText}>
                      {STAFF_PERMISSIONS.find(sp => sp.key === p)?.name || p}
                    </Text>
                  </View>
                ))}
                {staffForm.permissions.length > 3 && (
                  <View style={styles.permissionTag}>
                    <Text style={styles.permissionTagText}>+{staffForm.permissions.length - 3} more</Text>
                  </View>
                )}
              </View>
            </View>
          </ScrollView>
          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={[styles.submitButton, isCreatingStaff && styles.submitButtonDisabled]}
              onPress={handleCreateStaff}
              disabled={isCreatingStaff}
            >
              {isCreatingStaff ? (
                <ActivityIndicator color={colors.surface} />
              ) : (
                <Text style={styles.submitButtonText}>Create Staff</Text>
              )}
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>

      <Modal visible={showGradeModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
          <View style={[styles.modalHeader, { backgroundColor: colors.surface }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Create Grade Level</Text>
            <TouchableOpacity onPress={() => setShowGradeModal(false)}>
              <X size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Grade Level Name <Text style={styles.required}>*</Text></Text>
              <TextInput
                style={[styles.input, { color: colors.text, backgroundColor: colors.surface, borderColor: colors.border }]}
                value={gradeForm.name}
                onChangeText={text => setGradeForm({ name: text })}
                placeholder="e.g., Grade 7, Year 1"
                placeholderTextColor={colors.textSecondary}
              />
            </View>
          </View>
          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.submitButton} onPress={handleCreateGrade}>
              <Text style={styles.submitButtonText}>Create Grade Level</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>

      <Modal visible={showSectionModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
          <View style={[styles.modalHeader, { backgroundColor: colors.surface }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Create Section</Text>
            <TouchableOpacity onPress={() => setShowSectionModal(false)}>
              <X size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Section Name <Text style={styles.required}>*</Text></Text>
              <TextInput
                style={[styles.input, { color: colors.text, backgroundColor: colors.surface, borderColor: colors.border }]}
                value={sectionForm.name}
                onChangeText={text => setSectionForm(prev => ({ ...prev, name: text }))}
                placeholder="e.g., A, B, C"
                placeholderTextColor={colors.textSecondary}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Grade Level <Text style={styles.required}>*</Text></Text>
              <TouchableOpacity style={[styles.pickerButton, { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={() => setShowGradePicker(true)}>
                <Text style={[styles.pickerButtonText, { color: colors.text }]}>
                  {sectionForm.gradeLevelId ? getGradeName(sectionForm.gradeLevelId) : 'Select Grade Level'}
                </Text>
                <ChevronDown size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.submitButton} onPress={handleCreateSection}>
              <Text style={styles.submitButtonText}>Create Section</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>

      <Modal visible={showGradePicker} transparent animationType="fade">
        <TouchableOpacity style={[styles.pickerOverlay, { backgroundColor: 'rgba(0, 0, 0, 0.5)' }]} activeOpacity={1} onPress={() => setShowGradePicker(false)}>
          <View style={[styles.pickerModal, { backgroundColor: colors.surface }]}>
            <Text style={[styles.pickerTitle, { color: colors.text }]}>Select Grade Level</Text>
            <ScrollView style={[styles.pickerScroll, { backgroundColor: colors.surface }]}>
              {gradeLevels.map(grade => (
                <TouchableOpacity
                  key={grade.id}
                  style={[styles.pickerOption, studentForm.gradeLevelId === grade.id && styles.pickerOptionSelected]}
                  onPress={() => {
                    if (showSectionModal) {
                      setSectionForm(prev => ({ ...prev, gradeLevelId: grade.id }));
                    } else {
                      setStudentForm(prev => ({ ...prev, gradeLevelId: grade.id, sectionId: '' }));
                    }
                    setShowGradePicker(false);
                  }}
                >
                  <Text style={[styles.pickerOptionText, { color: colors.text }, studentForm.gradeLevelId === grade.id && styles.pickerOptionTextSelected]}>
                    {grade.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal visible={showSectionPicker} transparent animationType="fade">
        <TouchableOpacity style={[styles.pickerOverlay, { backgroundColor: 'rgba(0, 0, 0, 0.5)' }]} activeOpacity={1} onPress={() => setShowSectionPicker(false)}>
          <View style={[styles.pickerModal, { backgroundColor: colors.surface }]}>
            <Text style={[styles.pickerTitle, { color: colors.text }]}>Select Section</Text>
            <ScrollView style={[styles.pickerScroll, { backgroundColor: colors.surface }]}>
              {availableSections.map(section => (
                <TouchableOpacity
                  key={section.id}
                  style={[styles.pickerOption, studentForm.sectionId === section.id && styles.pickerOptionSelected]}
                  onPress={() => {
                    setStudentForm(prev => ({ ...prev, sectionId: section.id }));
                    setShowSectionPicker(false);
                  }}
                >
                  <Text style={[styles.pickerOptionText, { color: colors.text }, studentForm.sectionId === section.id && styles.pickerOptionTextSelected]}>
                    Section {section.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal visible={showPositionPicker} transparent animationType="fade">
        <TouchableOpacity style={[styles.pickerOverlay, { backgroundColor: 'rgba(0, 0, 0, 0.5)' }]} activeOpacity={1} onPress={() => setShowPositionPicker(false)}>
          <View style={[styles.pickerModal, { backgroundColor: colors.surface }]}>
            <Text style={[styles.pickerTitle, { color: colors.text }]}>Select Position</Text>
            <ScrollView style={[styles.pickerScroll, { backgroundColor: colors.surface }]}>
              {allPositions.map(pos => (
                <View key={pos.key} style={styles.pickerOptionRow}>
                  <TouchableOpacity
                    style={[styles.pickerOption, styles.pickerOptionFlex, staffForm.position === pos.key && styles.pickerOptionSelected]}
                    onPress={() => {
                      handlePositionChange(pos.key as StaffPosition);
                      setShowPositionPicker(false);
                    }}
                  >
                    <Text style={[styles.pickerOptionText, { color: colors.text }, staffForm.position === pos.key && styles.pickerOptionTextSelected]}>
                      {pos.name}
                    </Text>
                  </TouchableOpacity>
                  {customPositions.some(cp => cp.key === pos.key) && (
                    <TouchableOpacity
                      style={styles.deleteCustomButton}
                      onPress={() => handleDeleteCustomItem('position', pos.key)}
                    >
                      <Trash2 size={16} color={colors.error} />
                    </TouchableOpacity>
                  )}
                </View>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal visible={showSpecializationPicker} transparent animationType="fade">
        <TouchableOpacity style={[styles.pickerOverlay, { backgroundColor: 'rgba(0, 0, 0, 0.5)' }]} activeOpacity={1} onPress={() => setShowSpecializationPicker(false)}>
          <View style={[styles.pickerModal, { backgroundColor: colors.surface }]}>
            <Text style={[styles.pickerTitle, { color: colors.text }]}>Select Specialization</Text>
            <ScrollView style={[styles.pickerScroll, { backgroundColor: colors.surface }]}>
              {allSpecializations.map(spec => (
                <View key={spec.key} style={styles.pickerOptionRow}>
                  <TouchableOpacity
                    style={[styles.pickerOption, styles.pickerOptionFlex, staffForm.specialization === spec.key && styles.pickerOptionSelected]}
                    onPress={() => {
                      setStaffForm(prev => ({ ...prev, specialization: spec.key as SubjectSpecialization }));
                      setShowSpecializationPicker(false);
                    }}
                  >
                    <Text style={[styles.pickerOptionText, { color: colors.text }, staffForm.specialization === spec.key && styles.pickerOptionTextSelected]}>
                      {spec.name}
                    </Text>
                  </TouchableOpacity>
                  {customSpecializations.some(cs => cs.key === spec.key) && (
                    <TouchableOpacity
                      style={styles.deleteCustomButton}
                      onPress={() => handleDeleteCustomItem('specialization', spec.key)}
                    >
                      <Trash2 size={16} color={colors.error} />
                    </TouchableOpacity>
                  )}
                </View>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal visible={showRankPicker} transparent animationType="fade">
        <TouchableOpacity style={[styles.pickerOverlay, { backgroundColor: 'rgba(0, 0, 0, 0.5)' }]} activeOpacity={1} onPress={() => setShowRankPicker(false)}>
          <View style={[styles.pickerModal, { backgroundColor: colors.surface }]}>
            <Text style={[styles.pickerTitle, { color: colors.text }]}>Select Rank</Text>
            <ScrollView style={[styles.pickerScroll, { backgroundColor: colors.surface }]}>
              {allRanks.map(rank => (
                <View key={rank.key} style={styles.pickerOptionRow}>
                  <TouchableOpacity
                    style={[styles.pickerOption, styles.pickerOptionFlex, staffForm.rank === rank.key && styles.pickerOptionSelected]}
                    onPress={() => {
                      setStaffForm(prev => ({ ...prev, rank: rank.key as TeacherRank }));
                      setShowRankPicker(false);
                    }}
                  >
                    <Text style={[styles.pickerOptionText, { color: colors.text }, staffForm.rank === rank.key && styles.pickerOptionTextSelected]}>
                      {rank.name}
                    </Text>
                  </TouchableOpacity>
                  {customRanks.some(cr => cr.key === rank.key) && (
                    <TouchableOpacity
                      style={styles.deleteCustomButton}
                      onPress={() => handleDeleteCustomItem('rank', rank.key)}
                    >
                      <Trash2 size={16} color={colors.error} />
                    </TouchableOpacity>
                  )}
                </View>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal visible={showPermissionsPicker} transparent animationType="fade">
        <TouchableOpacity style={[styles.pickerOverlay, { backgroundColor: 'rgba(0, 0, 0, 0.5)' }]} activeOpacity={1} onPress={() => setShowPermissionsPicker(false)}>
          <View style={[styles.pickerModal, { backgroundColor: colors.surface }]}>
            <Text style={[styles.pickerTitle, { color: colors.text }]}>Select Permissions</Text>
            <ScrollView style={[styles.pickerScroll, { backgroundColor: colors.surface }]}>
              {STAFF_PERMISSIONS.map(perm => (
                <TouchableOpacity
                  key={perm.key}
                  style={[styles.pickerOption, staffForm.permissions.includes(perm.key) && styles.pickerOptionSelected]}
                  onPress={() => togglePermission(perm.key)}
                >
                  <View style={styles.permissionOptionContent}>
                    <View style={[styles.permCheckbox, staffForm.permissions.includes(perm.key) && styles.permCheckboxChecked]}>
                      {staffForm.permissions.includes(perm.key) && <View style={styles.permCheckboxInner} />}
                    </View>
                    <View style={styles.permissionTextContainer}>
                      <Text style={[styles.pickerOptionText, { color: colors.text }, staffForm.permissions.includes(perm.key) && styles.pickerOptionTextSelected]}>
                        {perm.name}
                      </Text>
                      <Text style={[styles.permissionDescription, { color: colors.textSecondary }]}>{perm.description}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal visible={showAddCustomModal !== null} transparent animationType="fade">
        <View style={[styles.pickerOverlay, { backgroundColor: 'rgba(0, 0, 0, 0.5)' }]}>
          <View style={[styles.pickerModal, { backgroundColor: colors.surface }]}>
            <Text style={[styles.pickerTitle, { color: colors.text }]}>
              Add Custom {showAddCustomModal === 'position' ? 'Position' : showAddCustomModal === 'specialization' ? 'Specialization' : 'Rank'}
            </Text>
            <TextInput
              style={[styles.customInput, { color: colors.text, backgroundColor: colors.background, borderColor: colors.border }]}
              value={customItemName}
              onChangeText={setCustomItemName}
              placeholder={`Enter ${showAddCustomModal} name`}
              placeholderTextColor={colors.textSecondary}
              autoFocus
            />
            <View style={styles.customModalButtons}>
              <TouchableOpacity
                style={styles.customModalCancelButton}
                onPress={() => {
                  setShowAddCustomModal(null);
                  setCustomItemName('');
                }}
              >
                <Text style={styles.customModalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.customModalAddButton} onPress={handleAddCustomItem}>
                <Text style={styles.customModalAddText}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={showDeleteGradeModal} transparent animationType="fade">
        <View style={[styles.deleteModalOverlay, { backgroundColor: 'rgba(0, 0, 0, 0.5)' }]}>
          <View style={[styles.deleteModal, { backgroundColor: colors.surface }]}>
            <Text style={[styles.deleteModalTitle, { color: colors.text }]}>Delete Grade Level?</Text>
            <Text style={[styles.deleteModalText, { color: colors.textSecondary }]}>
              Are you sure you want to delete this grade level? This action cannot be undone.
            </Text>
            <View style={styles.deleteModalButtons}>
              <TouchableOpacity
                style={styles.deleteModalCancelButton}
                onPress={() => {
                  setShowDeleteGradeModal(false);
                  setSelectedGradeToDelete(null);
                }}
              >
                <Text style={styles.deleteModalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.deleteModalConfirmButton}
                onPress={handleDeleteGrade}
              >
                <Text style={styles.deleteModalConfirmText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={showDeleteSectionModal} transparent animationType="fade">
        <View style={[styles.deleteModalOverlay, { backgroundColor: 'rgba(0, 0, 0, 0.5)' }]}>
          <View style={[styles.deleteModal, { backgroundColor: colors.surface }]}>
            <Text style={[styles.deleteModalTitle, { color: colors.text }]}>Delete Section?</Text>
            <Text style={[styles.deleteModalText, { color: colors.textSecondary }]}>
              Are you sure you want to delete this section? This action cannot be undone.
            </Text>
            <View style={styles.deleteModalButtons}>
              <TouchableOpacity
                style={styles.deleteModalCancelButton}
                onPress={() => {
                  setShowDeleteSectionModal(false);
                  setSelectedSectionToDelete(null);
                }}
              >
                <Text style={styles.deleteModalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.deleteModalConfirmButton}
                onPress={handleDeleteSection}
              >
                <Text style={styles.deleteModalConfirmText}>Delete</Text>
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
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 8,
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: colors.textSecondary,
  },
  tabTextActive: {
    color: colors.primary,
    fontWeight: '600' as const,
  },
  tabContent: {
    flex: 1,
    padding: 16,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 48,
    marginTop: 50,
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
  gradeSection: {
    marginBottom: 24,
  },
  gradeSectionTitle: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: colors.text,
    marginBottom: 12,
  },
  sectionGroup: {
    marginBottom: 16,
  },
  sectionGroupTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.textSecondary,
    marginBottom: 8,
    marginLeft: 4,
  },
  personCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    gap: 14,
    marginBottom: 8,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  personPhoto: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  personPhotoPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  personInitial: {
    fontSize: 20,
    fontWeight: '600' as const,
    color: colors.surface,
  },
  personInfo: {
    flex: 1,
  },
  personName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.text,
    marginBottom: 2,
  },
  personSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  staffCategory: {
    marginBottom: 28,
  },
  categoryTitle: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: colors.text,
    marginBottom: 8,
  },
  categoryDivider: {
    height: 2,
    backgroundColor: colors.text,
    marginBottom: 16,
  },
  staffGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  staffGridItem: {
    width: 90,
    alignItems: 'center',
  },
  staffGridPhoto: {
    width: 72,
    height: 72,
    borderRadius: 36,
    marginBottom: 8,
  },
  staffGridPhotoPlaceholder: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#90C659',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  staffGridInitial: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: colors.surface,
  },
  staffGridName: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: colors.text,
    textAlign: 'center',
  },
  staffGridSubtitle: {
    fontSize: 11,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 2,
  },
  staffGridRank: {
    fontSize: 10,
    color: colors.textLight,
    textAlign: 'center',
    marginTop: 2,
  },
  gradeCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  gradeCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  gradeCardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  gradeCardTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: colors.text,
  },
  deleteGradeButton: {
    padding: 4,
  },
  gradeCardCount: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  sectionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  sectionsListContainer: {
    gap: 8,
  },
  sectionCardClickable: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  sectionCardExpanded: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '08',
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  sectionCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  sectionIndicator: {
    width: 4,
    height: 36,
    borderRadius: 2,
    backgroundColor: colors.border,
  },
  sectionIndicatorActive: {
    backgroundColor: colors.primary,
  },
  sectionCardContent: {
    flex: 1,
  },
  sectionCard: {
    backgroundColor: colors.background,
    borderRadius: 10,
    padding: 12,
    minWidth: 100,
  },
  sectionCardTitle: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: colors.text,
    marginBottom: 2,
  },
  sectionCardInfo: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  sectionCardAdvisor: {
    fontSize: 11,
    color: colors.textLight,
    marginTop: 2,
  },
  expandedStudentsList: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: colors.primary,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    paddingVertical: 8,
    marginBottom: 4,
  },
  expandedStudentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    gap: 12,
  },
  expandedStudentPhoto: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  expandedStudentPhotoPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  expandedStudentInitial: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.surface,
  },
  expandedStudentInfo: {
    flex: 1,
  },
  expandedStudentName: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.text,
  },
  expandedStudentLrn: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 1,
  },
  noStudentsContainer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  noStudentsText: {
    fontSize: 14,
    color: colors.textLight,
    fontStyle: 'italic' as const,
  },
  addStudentToSectionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginHorizontal: 12,
    marginTop: 8,
    marginBottom: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primary,
    borderStyle: 'dashed' as const,
    gap: 6,
  },
  addStudentToSectionText: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: colors.primary,
  },
  deleteSectionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginHorizontal: 12,
    marginBottom: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.error,
    gap: 6,
  },
  deleteSectionButtonText: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: colors.error,
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
  addSectionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.primary,
    borderStyle: 'dashed' as const,
    gap: 4,
  },
  addSectionButtonText: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: colors.primary,
  },
  footer: {
    padding: 16,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    gap: 8,
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
  modalContent: {
    flex: 1,
    padding: 24,
  },
  photoSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  photoButton: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed' as const,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  photoPreview: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  photoButtonText: {
    fontSize: 12,
    color: colors.textLight,
  },
  inputGroup: {
    marginBottom: 18,
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
  pickerButtonDisabled: {
    opacity: 0.5,
  },
  pickerButtonText: {
    fontSize: 16,
    color: colors.text,
  },
  modalFooter: {
    padding: 16,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  submitButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
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
  pickerOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pickerOptionFlex: {
    flex: 1,
  },
  deleteCustomButton: {
    padding: 10,
  },
  addCustomButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
  },
  addCustomButtonText: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '500' as const,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 18,
    paddingVertical: 4,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  checkboxInner: {
    width: 10,
    height: 10,
    borderRadius: 3,
    backgroundColor: colors.surface,
  },
  checkboxLabel: {
    fontSize: 15,
    color: colors.text,
    fontWeight: '500' as const,
  },
  permissionTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  permissionTag: {
    backgroundColor: colors.primary + '15',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  permissionTagText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '500' as const,
  },
  permissionOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  permCheckbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  permCheckboxChecked: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  permCheckboxInner: {
    width: 8,
    height: 8,
    borderRadius: 2,
    backgroundColor: colors.surface,
  },
  permissionTextContainer: {
    flex: 1,
  },
  permissionDescription: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  customInput: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text,
    marginBottom: 16,
  },
  customModalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  customModalCancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: colors.background,
    alignItems: 'center',
  },
  customModalCancelText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: colors.text,
  },
  customModalAddButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: colors.primary,
    alignItems: 'center',
  },
});
