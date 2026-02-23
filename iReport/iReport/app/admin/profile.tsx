import React, { useState } from 'react';
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
  Switch,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { 
  User, 
  Mail, 
  IdCard, 
  Briefcase,
  Camera, 
  Lock, 
  Moon, 
  Globe, 
  LogOut,
  ChevronRight,
  X,
} from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useStaff } from '@/contexts/StaffContext';
import { useSettings } from '@/contexts/SettingsContext';
import { StaffMember } from '@/types';
import { STAFF_POSITIONS } from '@/constants/staff';

const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'fil', name: 'Filipino' },
] as const;

export default function AdminProfile() {
  const { currentUser, updateCurrentUser, logout } = useAuth();
  const { staff, updateStaff, changePassword, changePasswordMutation } = useStaff();
  const { isDark, setTheme, language, setLanguage, colors } = useSettings();

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Find the current user in the staff list, fall back to currentUser if not found
  const staffMember = (staff.find(s => s.id === currentUser?.id) || currentUser) as StaffMember;

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled) {
      try {
        updateStaff({
          id: staffMember.id,
          updates: { profilePhoto: result.assets[0].uri },
          adminId: staffMember.id,
          adminName: staffMember.fullName,
        });
        await updateCurrentUser({ profilePhoto: result.assets[0].uri });
        Alert.alert('Success', 'Profile photo updated');
      } catch (error: any) {
        Alert.alert('Error', error.message || 'Failed to update photo');
      }
    }
  };

  const handleRemovePhoto = () => {
    Alert.alert(
      'Remove Photo',
      'Are you sure you want to remove your profile photo?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              updateStaff({
                id: staffMember.id,
                updates: { profilePhoto: undefined },
                adminId: staffMember.id,
                adminName: staffMember.fullName,
              });
              await updateCurrentUser({ profilePhoto: undefined });
              Alert.alert('Success', 'Profile photo removed');
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to remove photo');
            }
          },
        },
      ]
    );
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (currentPassword !== staffMember.password) {
      Alert.alert('Error', 'Current password is incorrect');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'New passwords do not match');
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
        adminId: staffMember.id,
        adminName: staffMember.fullName,
      });
      
      // Update both current user and local reference
      await updateCurrentUser({ password: newPassword });
      // Update the local staffMember reference so the next password change works
      staffMember.password = newPassword;
      
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowPasswordModal(false);
      Alert.alert('Success', 'Password changed successfully');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to change password');
      console.error('Password change error:', error);
    }
  };

  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = async () => {
    setShowLogoutModal(false);
    try {
      await logout();
      router.replace('/login');
    } catch (err) {
      console.error('Error during logout:', err);
    }
  };

  const getPositionName = (position: string) => {
    return STAFF_POSITIONS.find(p => p.key === position)?.name || position;
  };

  const getLanguageName = (code: string) => {
    return LANGUAGES.find(l => l.code === code)?.name || 'English';
  };

  if (!staffMember) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <Text style={{ fontSize: 18, color: '#1a1a1a' }}>Profile not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const dynamicStyles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      flex: 1,
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
      backgroundColor: '#90C659',
      alignItems: 'center',
      justifyContent: 'center',
    },
    profileInitial: {
      fontSize: 40,
      fontWeight: '700' as const,
      color: colors.surface,
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
      borderWidth: 2,
      borderColor: colors.surface,
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
    settingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderLight,
    },
    settingLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    settingIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.background,
      alignItems: 'center',
      justifyContent: 'center',
    },
    settingLabel: {
      fontSize: 16,
      color: colors.text,
      fontWeight: '500' as const,
    },
    settingValue: {
      fontSize: 13,
      color: colors.textSecondary,
      marginTop: 2,
    },
    logoutButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: colors.surface,
      marginTop: 12,
      padding: 16,
      borderRadius: 12,
      marginHorizontal: 16,
    },
    logoutButtonText: {
      fontSize: 16,
      fontWeight: '600' as const,
      color: colors.error,
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
      marginTop: 8,
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
    logoutModalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 24,
    },
    logoutModalContent: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 24,
      width: '100%',
      maxWidth: 400,
    },
    logoutModalTitle: {
      fontSize: 18,
      fontWeight: '700' as const,
      color: colors.text,
      marginBottom: 12,
    },
    logoutModalMessage: {
      fontSize: 14,
      color: colors.textSecondary,
      marginBottom: 24,
    },
    logoutModalButtons: {
      flexDirection: 'row',
      gap: 12,
      justifyContent: 'flex-end',
    },
    logoutModalButton: {
      paddingVertical: 10,
      paddingHorizontal: 16,
      borderRadius: 8,
      minWidth: 100,
      alignItems: 'center',
    },
    cancelButton: {
      backgroundColor: colors.border,
    },
    cancelButtonText: {
      color: colors.text,
      fontWeight: '600' as const,
    },
    logoutConfirmButton: {
      backgroundColor: colors.error,
    },
    logoutConfirmButtonText: {
      color: colors.surface,
      fontWeight: '600' as const,
    },
  });

  return (
    <SafeAreaView style={dynamicStyles.container} edges={['bottom']}>
      <ScrollView style={dynamicStyles.content}>
        <View style={dynamicStyles.headerSection}>
          <View style={dynamicStyles.photoContainer}>
            <TouchableOpacity onPress={handlePickImage}>
              {staffMember.profilePhoto ? (
                <Image source={{ uri: staffMember.profilePhoto }} style={dynamicStyles.profilePhoto} />
              ) : (
                <View style={dynamicStyles.profilePhotoPlaceholder}>
                  <Text style={dynamicStyles.profileInitial}>
                    {(staffMember.fullName || staffMember.email || '?').charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
              <View style={dynamicStyles.editPhotoOverlay}>
                <Camera size={16} color={colors.surface} />
              </View>
            </TouchableOpacity>
            {staffMember.profilePhoto && (
              <TouchableOpacity style={dynamicStyles.removePhotoButton} onPress={handleRemovePhoto}>
                <X size={14} color={colors.surface} />
              </TouchableOpacity>
            )}
          </View>
          <Text style={dynamicStyles.name}>{staffMember.fullName || staffMember.email || 'User'}</Text>
          <Text style={dynamicStyles.subtitle}>{getPositionName(staffMember.position)}</Text>
        </View>

        <View style={dynamicStyles.section}>
          <Text style={dynamicStyles.sectionTitle}>Staff Information</Text>

          <View style={dynamicStyles.infoRow}>
            <View style={dynamicStyles.infoIcon}>
              <IdCard size={20} color={colors.primary} />
            </View>
            <View style={dynamicStyles.infoContent}>
              <Text style={dynamicStyles.infoLabel}>Staff ID</Text>
              <Text style={dynamicStyles.infoValue}>{staffMember?.staffId || staffMember?.id || 'N/A'}</Text>
            </View>
          </View>

          <View style={dynamicStyles.infoRow}>
            <View style={dynamicStyles.infoIcon}>
              <Mail size={20} color={colors.primary} />
            </View>
            <View style={dynamicStyles.infoContent}>
              <Text style={dynamicStyles.infoLabel}>School Email</Text>
              <Text style={dynamicStyles.infoValue}>{staffMember?.schoolEmail || staffMember?.email || 'N/A'}</Text>
            </View>
          </View>

          <View style={dynamicStyles.infoRow}>
            <View style={dynamicStyles.infoIcon}>
              <Briefcase size={20} color={colors.primary} />
            </View>
            <View style={dynamicStyles.infoContent}>
              <Text style={dynamicStyles.infoLabel}>Position</Text>
              <Text style={dynamicStyles.infoValue}>{staffMember?.position ? getPositionName(staffMember.position) : 'N/A'}</Text>
            </View>
          </View>
        </View>

        <View style={dynamicStyles.section}>
          <Text style={dynamicStyles.sectionTitle}>Account Settings</Text>

          <TouchableOpacity style={dynamicStyles.settingRow} onPress={() => setShowPasswordModal(true)}>
            <View style={dynamicStyles.settingLeft}>
              <View style={dynamicStyles.settingIcon}>
                <Lock size={20} color={colors.primary} />
              </View>
              <Text style={dynamicStyles.settingLabel}>Change Password</Text>
            </View>
            <ChevronRight size={20} color={colors.textLight} />
          </TouchableOpacity>
        </View>

        <View style={dynamicStyles.section}>
          <Text style={dynamicStyles.sectionTitle}>Preferences</Text>

          <View style={dynamicStyles.settingRow}>
            <View style={dynamicStyles.settingLeft}>
              <View style={dynamicStyles.settingIcon}>
                <Moon size={20} color={colors.primary} />
              </View>
              <Text style={dynamicStyles.settingLabel}>Dark Mode</Text>
            </View>
            <Switch
              value={isDark}
              onValueChange={(value) => setTheme(value ? 'dark' : 'light')}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={colors.surface}
            />
          </View>

          <TouchableOpacity style={dynamicStyles.settingRow} onPress={() => setShowLanguageModal(true)}>
            <View style={dynamicStyles.settingLeft}>
              <View style={dynamicStyles.settingIcon}>
                <Globe size={20} color={colors.primary} />
              </View>
              <View>
                <Text style={dynamicStyles.settingLabel}>Language</Text>
                <Text style={dynamicStyles.settingValue}>{getLanguageName(language)}</Text>
              </View>
            </View>
            <ChevronRight size={20} color={colors.textLight} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={dynamicStyles.logoutButton} onPress={handleLogout}>
          <LogOut size={20} color={colors.error} />
          <Text style={dynamicStyles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>

        <View style={{ height: 32 }} />
      </ScrollView>

      <Modal visible={showPasswordModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={dynamicStyles.modalContainer} edges={['top', 'bottom']}>
          <View style={dynamicStyles.modalHeader}>
            <Text style={dynamicStyles.modalTitle}>Change Password</Text>
            <TouchableOpacity onPress={() => setShowPasswordModal(false)}>
              <X size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
          <View style={dynamicStyles.modalContent}>
            <View style={dynamicStyles.inputGroup}>
              <Text style={dynamicStyles.label}>Current Password</Text>
              <TextInput
                style={dynamicStyles.input}
                value={currentPassword}
                onChangeText={setCurrentPassword}
                placeholder="Enter current password"
                placeholderTextColor={colors.textLight}
                secureTextEntry
              />
            </View>
            <View style={dynamicStyles.inputGroup}>
              <Text style={dynamicStyles.label}>New Password</Text>
              <TextInput
                style={dynamicStyles.input}
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="Enter new password"
                placeholderTextColor={colors.textLight}
                secureTextEntry
              />
            </View>
            <View style={dynamicStyles.inputGroup}>
              <Text style={dynamicStyles.label}>Confirm New Password</Text>
              <TextInput
                style={dynamicStyles.input}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Confirm new password"
                placeholderTextColor={colors.textLight}
                secureTextEntry
              />
            </View>
            <TouchableOpacity 
              style={[dynamicStyles.modalButton, changePasswordMutation?.isPending && dynamicStyles.disabledButton]} 
              onPress={handleChangePassword}
              disabled={changePasswordMutation?.isPending}
            >
              {changePasswordMutation?.isPending ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={dynamicStyles.modalButtonText}>Change Password</Text>
              )}
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>

      <Modal visible={showLanguageModal} transparent animationType="fade">
        <TouchableOpacity 
          style={dynamicStyles.pickerOverlay} 
          activeOpacity={1} 
          onPress={() => setShowLanguageModal(false)}
        >
          <View style={dynamicStyles.pickerModal}>
            <Text style={dynamicStyles.pickerTitle}>Select Language</Text>
            {LANGUAGES.map(lang => (
              <TouchableOpacity
                key={lang.code}
                style={[
                  dynamicStyles.pickerOption,
                  language === lang.code && dynamicStyles.pickerOptionSelected,
                ]}
                onPress={() => {
                  setLanguage(lang.code as 'en' | 'fil' | 'ceb');
                  setShowLanguageModal(false);
                }}
              >
                <Text
                  style={[
                    dynamicStyles.pickerOptionText,
                    language === lang.code && dynamicStyles.pickerOptionTextSelected,
                  ]}
                >
                  {lang.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal visible={showLogoutModal} transparent animationType="fade">
        <View style={dynamicStyles.logoutModalOverlay}>
          <View style={dynamicStyles.logoutModalContent}>
            <Text style={dynamicStyles.logoutModalTitle}>Logout</Text>
            <Text style={dynamicStyles.logoutModalMessage}>Are you sure you want to logout?</Text>
            <View style={dynamicStyles.logoutModalButtons}>
              <TouchableOpacity
                style={[dynamicStyles.logoutModalButton, dynamicStyles.cancelButton]}
                onPress={() => setShowLogoutModal(false)}
              >
                <Text style={dynamicStyles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[dynamicStyles.logoutModalButton, dynamicStyles.logoutConfirmButton]}
                onPress={confirmLogout}
              >
                <Text style={dynamicStyles.logoutConfirmButtonText}>Logout</Text>
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
  },
});
