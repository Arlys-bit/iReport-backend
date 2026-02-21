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
import { X, Camera, User, ChevronDown, Search } from 'lucide-react-native';
import { useStudents } from '@/contexts/StudentsContext';
import { Student } from '@/types';
import colors from '@/constants/colors';

export default function ManageStudents() {
  const { students, gradeLevels, sections, createStudent, isCreatingStudent } = useStudents();
  const [modalVisible, setModalVisible] = useState(false);
  
  const [fullName, setFullName] = useState('');
  const [lrn, setLrn] = useState('');
  const [gradeLevelId, setGradeLevelId] = useState('');
  const [sectionId, setSectionId] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [profilePhoto, setProfilePhoto] = useState<string | undefined>();
  const [showGradePicker, setShowGradePicker] = useState(false);
  const [showSectionPicker, setShowSectionPicker] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredStudents = useMemo(() => {
    if (!searchQuery.trim()) return students;
    
    const query = searchQuery.toLowerCase().trim();
    return students.filter((student: Student) =>
      student.fullName.toLowerCase().includes(query) ||
      student.lrn.includes(query)
    );
  }, [students, searchQuery]);

  const groupedStudents = useMemo(() => {
    const grouped: Record<string, Record<string, Student[]>> = {};
    
    filteredStudents.forEach((student: Student) => {
      if (!grouped[student.gradeLevelId]) {
        grouped[student.gradeLevelId] = {};
      }
      if (!grouped[student.gradeLevelId][student.sectionId]) {
        grouped[student.gradeLevelId][student.sectionId] = [];
      }
      grouped[student.gradeLevelId][student.sectionId].push(student);
    });
    
    return grouped;
  }, [filteredStudents]);

  const availableSections = useMemo(() => {
    return sections.filter(s => s.gradeLevelId === gradeLevelId);
  }, [sections, gradeLevelId]);

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

  const handleCreateStudent = async () => {
    if (!fullName.trim() || !lrn.trim() || !gradeLevelId || !sectionId || !email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      await createStudent({
        fullName: fullName.trim(),
        lrn: lrn.trim(),
        gradeLevelId,
        sectionId,
        email: email.trim(),
        schoolEmail: email.trim(),
        password: password.trim(),
        profilePhoto,
      });

      setFullName('');
      setLrn('');
      setGradeLevelId('');
      setSectionId('');
      setEmail('');
      setPassword('');
      setProfilePhoto(undefined);
      setModalVisible(false);
      Alert.alert('Success', 'Student created successfully');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to create student');
    }
  };

  const getGradeName = (gradeId: string) => gradeLevels.find(g => g.id === gradeId)?.name || 'Unknown';
  const getSectionName = (secId: string) => sections.find(s => s.id === secId)?.name || 'Unknown';

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Search size={20} color={colors.textLight} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name or LRN"
            placeholderTextColor={colors.textLight}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <X size={20} color={colors.textLight} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView style={styles.content}>
        {filteredStudents.length === 0 && searchQuery.trim() ? (
          <View style={styles.emptyState}>
            <Search size={48} color={colors.textLight} />
            <Text style={styles.emptyTitle}>No students found</Text>
            <Text style={styles.emptyText}>Try searching with a different name or LRN</Text>
          </View>
        ) : students.length === 0 ? (
          <View style={styles.emptyState}>
            <User size={48} color={colors.textLight} />
            <Text style={styles.emptyTitle}>No students yet</Text>
            <Text style={styles.emptyText}>Create your first student account to get started</Text>
          </View>
        ) : (
          <View style={styles.studentsList}>
            {gradeLevels.map((grade) => {
              const gradeStudents = groupedStudents[grade.id];
              if (!gradeStudents) return null;
              
              const sectionKeys = Object.keys(gradeStudents).sort();
              
              return (
                <View key={grade.id} style={styles.gradeGroup}>
                  <Text style={styles.gradeTitle}>{grade.name}</Text>
                  {sectionKeys.map((secId) => {
                    const sectionStudents = gradeStudents[secId];
                    const section = sections.find(s => s.id === secId);
                    
                    return (
                      <View key={secId} style={styles.sectionGroup}>
                        <Text style={styles.sectionTitle}>Section {section?.name || 'Unknown'}</Text>
                        {sectionStudents.map((student: Student) => (
                          <TouchableOpacity
                            key={student.id}
                            style={styles.studentCard}
                            onPress={() => router.push(`/admin/students/${student.id}` as any)}
                          >
                            {student.profilePhoto ? (
                              <Image source={{ uri: student.profilePhoto }} style={styles.studentPhoto} />
                            ) : (
                              <View style={styles.studentPhotoPlaceholder}>
                                <Text style={styles.studentInitial}>
                                  {student.fullName.charAt(0).toUpperCase()}
                                </Text>
                              </View>
                            )}
                            <View style={styles.studentInfo}>
                              <Text style={styles.studentName}>{student.fullName}</Text>
                              <Text style={styles.studentLrn}>LRN: {student.lrn}</Text>
                            </View>
                          </TouchableOpacity>
                        ))}
                      </View>
                    );
                  })}
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.addButton} onPress={() => setModalVisible(true)}>
          <Text style={styles.addButtonText}>+ Add Student</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer} edges={['top', 'bottom']}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Create Student Account</Text>
            <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeButton}>
              <X size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
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
              <Text style={styles.label}>Full Name <Text style={styles.required}>*</Text></Text>
              <TextInput
                style={styles.input}
                value={fullName}
                onChangeText={setFullName}
                placeholder="Enter student's full name"
                placeholderTextColor={colors.textLight}
                autoCapitalize="words"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>LRN <Text style={styles.required}>*</Text></Text>
              <TextInput
                style={styles.input}
                value={lrn}
                onChangeText={setLrn}
                placeholder="Enter LRN"
                placeholderTextColor={colors.textLight}
                keyboardType="number-pad"
              />
            </View>

            <View style={styles.inputRow}>
              <View style={styles.inputColumn}>
                <Text style={styles.label}>Grade Level <Text style={styles.required}>*</Text></Text>
                <TouchableOpacity style={styles.pickerButton} onPress={() => setShowGradePicker(true)}>
                  <Text style={styles.pickerButtonText}>
                    {gradeLevelId ? getGradeName(gradeLevelId) : 'Select'}
                  </Text>
                  <ChevronDown size={20} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>

              <View style={styles.inputColumn}>
                <Text style={styles.label}>Section <Text style={styles.required}>*</Text></Text>
                <TouchableOpacity
                  style={[styles.pickerButton, !gradeLevelId && styles.pickerButtonDisabled]}
                  onPress={() => gradeLevelId && setShowSectionPicker(true)}
                  disabled={!gradeLevelId}
                >
                  <Text style={styles.pickerButtonText}>
                    {sectionId ? getSectionName(sectionId) : 'Select'}
                  </Text>
                  <ChevronDown size={20} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>School Email <Text style={styles.required}>*</Text></Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="Enter school email"
                placeholderTextColor={colors.textLight}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password <Text style={styles.required}>*</Text></Text>
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="Enter password"
                placeholderTextColor={colors.textLight}
                secureTextEntry
                autoCapitalize="none"
              />
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={[styles.createButton, isCreatingStudent && styles.createButtonDisabled]}
              onPress={handleCreateStudent}
              disabled={isCreatingStudent}
            >
              {isCreatingStudent ? (
                <ActivityIndicator color={colors.surface} />
              ) : (
                <Text style={styles.createButtonText}>Create Student</Text>
              )}
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>

      <Modal visible={showGradePicker} transparent animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowGradePicker(false)}>
          <View style={styles.pickerModal}>
            <Text style={styles.pickerTitle}>Select Grade Level</Text>
            {gradeLevels.map((g) => (
              <TouchableOpacity
                key={g.id}
                style={[styles.pickerOption, gradeLevelId === g.id && styles.pickerOptionSelected]}
                onPress={() => {
                  setGradeLevelId(g.id);
                  setSectionId('');
                  setShowGradePicker(false);
                }}
              >
                <Text style={[styles.pickerOptionText, gradeLevelId === g.id && styles.pickerOptionTextSelected]}>
                  {g.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal visible={showSectionPicker} transparent animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowSectionPicker(false)}>
          <View style={styles.pickerModal}>
            <Text style={styles.pickerTitle}>Select Section</Text>
            {availableSections.map((s) => (
              <TouchableOpacity
                key={s.id}
                style={[styles.pickerOption, sectionId === s.id && styles.pickerOptionSelected]}
                onPress={() => {
                  setSectionId(s.id);
                  setShowSectionPicker(false);
                }}
              >
                <Text style={[styles.pickerOptionText, sectionId === s.id && styles.pickerOptionTextSelected]}>
                  Section {s.name}
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
  searchContainer: {
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
  },
  content: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
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
  studentsList: {
    padding: 16,
    gap: 12,
  },
  studentCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    gap: 16,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 8,
  },
  studentPhoto: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  studentPhotoPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  studentInitial: {
    fontSize: 24,
    fontWeight: '600' as const,
    color: colors.surface,
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.text,
    marginBottom: 4,
  },
  studentLrn: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  footer: {
    padding: 16,
    paddingBottom: 16,
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
  gradeGroup: {
    marginBottom: 24,
  },
  gradeTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: colors.text,
    marginBottom: 12,
    paddingHorizontal: 0,
  },
  sectionGroup: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.textSecondary,
    marginBottom: 8,
    paddingHorizontal: 0,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  inputColumn: {
    flex: 1,
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
});
