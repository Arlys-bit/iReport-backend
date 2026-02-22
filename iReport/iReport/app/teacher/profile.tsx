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
  Users,
  ShieldCheck,
  KeyRound,
} from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useSettings } from '@/contexts/SettingsContext';
import { useStaff } from '@/contexts/StaffContext';
import { StaffMember } from '@/types';
import { STAFF_POSITIONS, STAFF_PERMISSIONS } from '@/constants/staff';

const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'fil', name: 'Filipino' },
] as const;

export default function TeacherProfile() {
  const { currentUser, logout } = useAuth();
  const { isDark, setTheme, language, setLanguage, colors } = useSettings();
  const { staff, updatePermissions, changePassword, changePasswordMutation } = useStaff();

  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [showManageStaffModal, setShowManageStaffModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);

  // Change own password
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Manage other staff
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
  const [staffNewPassword, setStaffNewPassword] = useState('');
  const [staffConfirmPassword, setStaffConfirmPassword] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);

  // Find the current user in the staff list, fall back to currentUser if not found
  const staffMember = (staff.find(s => s.id === currentUser?.id) || currentUser) as StaffMember;
  const canManageStaffAccounts = staffMember?.permissions?.includes('manage_staff_accounts') || false;

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

  const handleChangeOwnPassword = async () => {
    if (!currentPassword || !newPassword.trim() || !confirmPassword.trim()) {
      Alert.alert('Error', 'Please fill in all password fields');
      return;
    }

    if (currentPassword !== staffMember.password) {
      Alert.alert('Error', 'Current password is incorrect');
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
      if (currentUser) {
        await changePassword({
          staffId: currentUser.id,
          newPassword: newPassword.trim(),
          adminId: currentUser.id,
          adminName: currentUser.fullName,
        });
        // Update the local staffMember reference so the next password change works
        staffMember.password = newPassword;
        
        Alert.alert('Success', 'Your password has been updated');
        setShowChangePasswordModal(false);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update password');
    }
  };

  const handleOpenPasswordModal = (staffMemberToUpdate: StaffMember) => {
    if (!canManageStaffAccounts) {
      Alert.alert('Permission Denied', 'You do not have permission to manage staff accounts');
      return;
    }
    setSelectedStaff(staffMemberToUpdate);
    setStaffNewPassword('');
    setStaffConfirmPassword('');
    setShowPasswordModal(true);
  };

  const handleChangeStaffPassword = async () => {
    if (!selectedStaff) return;

    if (!staffNewPassword.trim() || !staffConfirmPassword.trim()) {
      Alert.alert('Error', 'Please fill in all password fields');
      return;
    }

    if (staffNewPassword !== staffConfirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (staffNewPassword.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    try {
      if (currentUser) {
        await changePassword({
          staffId: selectedStaff.id,
          newPassword: staffNewPassword.trim(),
          adminId: currentUser.id,
          adminName: currentUser.fullName,
        });
        Alert.alert('Success', `Password updated for ${selectedStaff.fullName}`);
        setShowPasswordModal(false);
        setSelectedStaff(null);
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update password');
    }
  };

  const handleOpenPermissionsModal = (staffMemberToUpdate: StaffMember) => {
    if (!canManageStaffAccounts) {
      Alert.alert('Permission Denied', 'You do not have permission to manage staff accounts');
      return;
    }
    setSelectedStaff(staffMemberToUpdate);
    setSelectedPermissions(staffMemberToUpdate.permissions || []);
    setShowPermissionsModal(true);
  };

  const handleUpdatePermissions = async () => {
    if (!selectedStaff) return;

    try {
      if (currentUser) {
        await updatePermissions({
          staffId: selectedStaff.id,
          permissions: selectedPermissions as any,
          adminId: currentUser.id,
          adminName: currentUser.fullName,
        });
        Alert.alert('Success', `Permissions updated for ${selectedStaff.fullName}`);
        setShowPermissionsModal(false);
        setSelectedStaff(null);
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update permissions');
    }
  };

  const togglePermission = (permission: string) => {
    setSelectedPermissions(prev =>
      prev.includes(permission)
        ? prev.filter(p => p !== permission)
        : [...prev, permission]
    );
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
      marginVertical: 12,
      marginHorizontal: 16,
      borderRadius: 16,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '700' as const,
      color: colors.text,
      marginBottom: 16,
    },
    infoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
      paddingBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderLight,
    },
    infoIcon: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: colors.primary + '15',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    infoContent: {
      flex: 1,
    },
    infoLabel: {
      fontSize: 12,
      color: colors.textSecondary,
      marginBottom: 2,
    },
    infoValue: {
      fontSize: 15,
      fontWeight: '600' as const,
      color: colors.text,
    },
    settingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 14,
      paddingHorizontal: 12,
      borderRadius: 12,
      backgroundColor: colors.background,
      marginBottom: 8,
    },
    settingLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    settingIcon: {
      width: 36,
      height: 36,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
      backgroundColor: colors.primary + '15',
    },
    settingLabel: {
      fontSize: 15,
      fontWeight: '600' as const,
      color: colors.text,
    },
    settingValue: {
      fontSize: 13,
      color: colors.textLight,
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
    disabledButton: {
      backgroundColor: colors.textLight,
      opacity: 0.5,
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
            {staffMember.profilePhoto ? (
              <Image source={{ uri: staffMember.profilePhoto }} style={dynamicStyles.profilePhoto} />
            ) : (
              <View style={dynamicStyles.profilePhotoPlaceholder}>
                <Text style={dynamicStyles.profileInitial}>
                  {staffMember.fullName.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
          </View>
          <Text style={dynamicStyles.name}>{staffMember.fullName}</Text>
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
              <Text style={dynamicStyles.infoValue}>{staffMember.staffId}</Text>
            </View>
          </View>

          <View style={dynamicStyles.infoRow}>
            <View style={dynamicStyles.infoIcon}>
              <Mail size={20} color={colors.primary} />
            </View>
            <View style={dynamicStyles.infoContent}>
              <Text style={dynamicStyles.infoLabel}>School Email</Text>
              <Text style={dynamicStyles.infoValue}>{staffMember.schoolEmail}</Text>
            </View>
          </View>

          <View style={dynamicStyles.infoRow}>
            <View style={dynamicStyles.infoIcon}>
              <Briefcase size={20} color={colors.primary} />
            </View>
            <View style={dynamicStyles.infoContent}>
              <Text style={dynamicStyles.infoLabel}>Position</Text>
              <Text style={dynamicStyles.infoValue}>{getPositionName(staffMember.position)}</Text>
            </View>
          </View>
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

          <TouchableOpacity style={dynamicStyles.settingRow} onPress={() => setShowChangePasswordModal(true)}>
            <View style={dynamicStyles.settingLeft}>
              <View style={dynamicStyles.settingIcon}>
                <KeyRound size={20} color={colors.primary} />
              </View>
              <Text style={dynamicStyles.settingLabel}>Change Password</Text>
            </View>
            <ChevronRight size={20} color={colors.textLight} />
          </TouchableOpacity>
        </View>

        {canManageStaffAccounts && staff.length > 0 && (
          <View style={dynamicStyles.section}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <Users size={20} color={colors.primary} />
              <Text style={dynamicStyles.sectionTitle}>Manage Staff</Text>
            </View>

            {staff.map((member) => (
              <View
                key={member.id}
                style={{
                  backgroundColor: colors.background,
                  borderRadius: 12,
                  padding: 12,
                  marginBottom: 10,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, fontWeight: '600' as const, color: colors.text }}>
                    {member.fullName}
                  </Text>
                  <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 4 }}>
                    {STAFF_POSITIONS.find(p => p.key === member.position)?.name || member.position}
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <TouchableOpacity
                    style={{
                      backgroundColor: colors.primary + '15',
                      padding: 8,
                      borderRadius: 8,
                    }}
                    onPress={() => handleOpenPasswordModal(member)}
                  >
                    <Lock size={18} color={colors.primary} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={{
                      backgroundColor: colors.primary + '15',
                      padding: 8,
                      borderRadius: 8,
                    }}
                    onPress={() => handleOpenPermissionsModal(member)}
                  >
                    <ShieldCheck size={18} color={colors.primary} />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        <TouchableOpacity style={dynamicStyles.logoutButton} onPress={handleLogout}>
          <LogOut size={20} color={colors.error} />
          <Text style={dynamicStyles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>

        <View style={{ height: 32 }} />
      </ScrollView>

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

      <Modal visible={showChangePasswordModal} transparent animationType="fade">
        <View style={dynamicStyles.logoutModalOverlay}>
          <View style={dynamicStyles.logoutModalContent}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={dynamicStyles.logoutModalTitle}>Change Password</Text>
              <TouchableOpacity onPress={() => setShowChangePasswordModal(false)}>
                <X size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            <TextInput
              style={{
                backgroundColor: colors.background,
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 8,
                paddingHorizontal: 12,
                paddingVertical: 10,
                fontSize: 14,
                color: colors.text,
                marginBottom: 12,
              }}
              placeholder="Current Password"
              placeholderTextColor={colors.textSecondary}
              value={currentPassword}
              onChangeText={setCurrentPassword}
              secureTextEntry
            />
            <TextInput
              style={{
                backgroundColor: colors.background,
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 8,
                paddingHorizontal: 12,
                paddingVertical: 10,
                fontSize: 14,
                color: colors.text,
                marginBottom: 12,
              }}
              placeholder="New Password"
              placeholderTextColor={colors.textSecondary}
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry
            />
            <TextInput
              style={{
                backgroundColor: colors.background,
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 8,
                paddingHorizontal: 12,
                paddingVertical: 10,
                fontSize: 14,
                color: colors.text,
                marginBottom: 20,
              }}
              placeholder="Confirm Password"
              placeholderTextColor={colors.textSecondary}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
            />
            <View style={dynamicStyles.logoutModalButtons}>
              <TouchableOpacity
                style={[dynamicStyles.logoutModalButton, dynamicStyles.cancelButton]}
                onPress={() => setShowChangePasswordModal(false)}
              >
                <Text style={dynamicStyles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  dynamicStyles.logoutModalButton, 
                  { backgroundColor: colors.primary },
                  changePasswordMutation?.isPending && dynamicStyles.disabledButton
                ]}
                onPress={handleChangeOwnPassword}
                disabled={changePasswordMutation?.isPending}
              >
                {changePasswordMutation?.isPending ? (
                  <ActivityIndicator color={colors.surface} />
                ) : (
                  <Text style={{ fontWeight: '600' as const, color: colors.surface }}>Update</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={showPasswordModal} transparent animationType="fade">
        <View style={dynamicStyles.logoutModalOverlay}>
          <View style={dynamicStyles.logoutModalContent}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={dynamicStyles.logoutModalTitle}>Change Password</Text>
              <TouchableOpacity onPress={() => setShowPasswordModal(false)}>
                <X size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            <Text style={{ fontSize: 13, color: colors.textSecondary, marginBottom: 12 }}>
              {selectedStaff?.fullName}
            </Text>
            <TextInput
              style={{
                backgroundColor: colors.background,
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 8,
                paddingHorizontal: 12,
                paddingVertical: 10,
                fontSize: 14,
                color: colors.text,
                marginBottom: 12,
              }}
              placeholder="New Password"
              placeholderTextColor={colors.textSecondary}
              value={staffNewPassword}
              onChangeText={setStaffNewPassword}
              secureTextEntry
            />
            <TextInput
              style={{
                backgroundColor: colors.background,
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 8,
                paddingHorizontal: 12,
                paddingVertical: 10,
                fontSize: 14,
                color: colors.text,
                marginBottom: 20,
              }}
              placeholder="Confirm Password"
              placeholderTextColor={colors.textSecondary}
              value={staffConfirmPassword}
              onChangeText={setStaffConfirmPassword}
              secureTextEntry
            />
            <View style={dynamicStyles.logoutModalButtons}>
              <TouchableOpacity
                style={[dynamicStyles.logoutModalButton, dynamicStyles.cancelButton]}
                onPress={() => setShowPasswordModal(false)}
              >
                <Text style={dynamicStyles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[dynamicStyles.logoutModalButton, { backgroundColor: colors.primary }]}
                onPress={handleChangeStaffPassword}
              >
                <Text style={{ fontWeight: '600' as const, color: colors.surface }}>Update</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={showPermissionsModal} transparent animationType="fade">
        <View style={dynamicStyles.logoutModalOverlay}>
          <View style={[dynamicStyles.logoutModalContent, { maxHeight: '80%' }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={dynamicStyles.logoutModalTitle}>Manage Permissions</Text>
              <TouchableOpacity onPress={() => setShowPermissionsModal(false)}>
                <X size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            <Text style={{ fontSize: 13, color: colors.textSecondary, marginBottom: 16 }}>
              {selectedStaff?.fullName}
            </Text>
            <ScrollView style={{ maxHeight: 300, marginBottom: 16 }}>
              {STAFF_PERMISSIONS.map((perm) => (
                <TouchableOpacity
                  key={perm.key}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingVertical: 12,
                    borderBottomWidth: 1,
                    borderBottomColor: colors.borderLight,
                  }}
                  onPress={() => togglePermission(perm.key)}
                >
                  <View
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: 4,
                      borderWidth: 2,
                      borderColor: selectedPermissions.includes(perm.key) ? colors.primary : colors.border,
                      backgroundColor: selectedPermissions.includes(perm.key) ? colors.primary : 'transparent',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: 12,
                    }}
                  >
                    {selectedPermissions.includes(perm.key) && (
                      <View style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: colors.surface }} />
                    )}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 14, fontWeight: '500' as const, color: colors.text }}>
                      {perm.name}
                    </Text>
                    <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>
                      {perm.description}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <View style={dynamicStyles.logoutModalButtons}>
              <TouchableOpacity
                style={[dynamicStyles.logoutModalButton, dynamicStyles.cancelButton]}
                onPress={() => setShowPermissionsModal(false)}
              >
                <Text style={dynamicStyles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[dynamicStyles.logoutModalButton, { backgroundColor: colors.primary }]}
                onPress={handleUpdatePermissions}
              >
                <Text style={{ fontWeight: '600' as const, color: colors.surface }}>Save</Text>
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
