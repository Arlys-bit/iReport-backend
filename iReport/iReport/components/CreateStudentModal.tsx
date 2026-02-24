import React, { useState } from 'react';
import { Modal, View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import colors from '@/constants/colors';
import { useAuth } from '@/contexts/AuthContext';
import PasswordInput from '@/components/PasswordInput';

interface Props {
  visible: boolean;
  onClose: () => void;
}

export default function CreateStudentModal({ visible, onClose }: Props) {
  const { createStudent, isCreatingStudent } = useAuth();

  const [fullName, setFullName] = useState('');
  const [lrn, setLrn] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [profilePhoto, setProfilePhoto] = useState('');
  const [error, setError] = useState(null as string | null);

  const reset = () => {
    setFullName('');
    setLrn('');
    setEmail('');
    setPassword('');
    setProfilePhoto('');
    setError(null);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const validate = () => {
    if (!fullName.trim()) return 'Full name is required';
    if (!lrn.trim()) return 'LRN is required';
    if (!email.trim()) return 'School email is required';
    if (!password.trim() || password.length < 6) return 'Password is required (min 6 chars)';
    return null;
  };

  const handleSubmit = () => {
    console.log('📌 handleSubmit clicked');
    const validationError = validate();
    console.log('📌 validationError:', validationError);
    if (validationError) {
      console.log('📌 Setting error:', validationError);
      setError(validationError);
      return;
    }

    setError(null);

    console.log('📌 Calling createStudent with:', { 
      fullName: fullName.trim(), 
      lrn: lrn.trim(), 
      email: email.trim().toLowerCase(), 
      password 
    });

    // Call createStudent and use onSuccess/onError callbacks
    // createStudent comes from useAuth and is a mutation.mutate
    createStudent(
      { fullName: fullName.trim(), lrn: lrn.trim(), email: email.trim().toLowerCase(), password, profilePhoto: profilePhoto.trim() || undefined },
      {
        onSuccess: () => {
          console.log('📌 Student created successfully');
          reset();
          onClose();
        },
        onError: (e: any) => {
          console.log('📌 Error creating student:', e?.message);
          setError(e?.message || 'Failed to create student');
        },
      }
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.wrapper}>
        <View style={styles.sheet}>
          <View style={styles.headerRow}>
            <Text style={styles.headerTitle}>Create Student Account</Text>
            <TouchableOpacity onPress={handleClose} testID="create-student-close">
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
            <View style={styles.photoPlaceholder}>
              <Text style={styles.photoText}>Add Photo
                <Text style={styles.photoSub}>(Optional)</Text>
              </Text>
            </View>

            <Text style={styles.label}>Full Name *</Text>
            <TextInput value={fullName} onChangeText={setFullName} placeholder="Enter student's full name" style={styles.input} testID="student-fullname" />

            <Text style={styles.label}>Learner Reference Number (LRN) *</Text>
            <TextInput value={lrn} onChangeText={setLrn} placeholder="Enter LRN" style={styles.input} testID="student-lrn" />

            <Text style={styles.label}>School Email *</Text>
            <TextInput value={email} onChangeText={setEmail} placeholder="Enter school email" autoCapitalize="none" keyboardType="email-address" style={styles.input} testID="student-email" />

            <Text style={styles.label}>Password *</Text>
            <PasswordInput value={password} onChangeText={setPassword} placeholder="Enter password" style={styles.input} testID="student-password" iconColor={colors.textLight} />

            <View style={styles.hintBox}>
              <Text style={styles.hintText}>Students will use their school email and password to log in. Profile photos help prevent prank reports.</Text>
            </View>

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} testID="create-student-submit">
              {isCreatingStudent ? <ActivityIndicator color={colors.surface} /> : <Text style={styles.submitText}>Create Student</Text>}
            </TouchableOpacity>

          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1, justifyContent: 'flex-end' },
  sheet: { backgroundColor: colors.surface, borderTopLeftRadius: 14, borderTopRightRadius: 14, padding: 18, maxHeight: '85%' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
  closeText: { fontSize: 20, color: colors.textSecondary },
  form: { paddingBottom: 36 },
  photoPlaceholder: { width: 96, height: 96, borderRadius: 48, borderWidth: 1, borderStyle: 'dashed', borderColor: colors.border, alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginBottom: 18 },
  photoText: { color: colors.text, textAlign: 'center' },
  photoSub: { color: colors.textSecondary, fontSize: 12, display: 'block' as any },
  label: { fontSize: 14, color: colors.text, marginBottom: 6 },
  input: { backgroundColor: '#FAFBFF', borderRadius: 8, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: colors.border },
  hintBox: { backgroundColor: '#F4F8FF', padding: 12, borderRadius: 8, marginBottom: 12 },
  hintText: { color: colors.textSecondary },
  submitButton: { backgroundColor: colors.primary, padding: 14, borderRadius: 10, alignItems: 'center', marginTop: 6 },
  submitText: { color: colors.surface, fontWeight: '700' },
  error: { color: colors.error, marginTop: 6 }
});