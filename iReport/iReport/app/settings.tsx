import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Alert, ScrollView, useColorScheme, Modal } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useSettings } from '@/contexts/SettingsContext';
import { Moon, Sun } from 'lucide-react-native';

export default function SettingsScreen() {
  const router = useRouter();
  const { logout } = useAuth();
  const { isDark, colors, theme, setTheme, t } = useSettings();
  const systemColorScheme = useColorScheme();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

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

  const toggleDarkMode = () => {
    const newTheme: 'light' | 'dark' | 'system' = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ 
        title: 'Settings',
        headerBackTitle: 'Back'
      }} />
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Appearance</Text>
          
          <View style={[styles.settingItem, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.settingLeft}>
              <View style={[styles.settingIcon, { backgroundColor: isDark ? colors.primary : colors.secondary }]}>
                {isDark ? (
                  <Moon size={20} color={colors.surface} />
                ) : (
                  <Sun size={20} color={colors.surface} />
                )}
              </View>
              <View>
                <Text style={[styles.settingLabel, { color: colors.text }]}>Dark Mode</Text>
                <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                  {theme === 'system' ? 'System' : (isDark ? 'Enabled' : 'Disabled')}
                </Text>
              </View>
            </View>
            <TouchableOpacity 
              style={[
                styles.toggleButton, 
                { 
                  backgroundColor: isDark ? colors.primary : colors.border,
                  borderColor: isDark ? colors.primary : colors.border
                }
              ]}
              onPress={toggleDarkMode}
            >
              <View 
                style={[
                  styles.toggleCircle,
                  {
                    transform: [{ translateX: isDark ? 20 : 0 }],
                    backgroundColor: colors.surface
                  }
                ]}
              />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Account</Text>
          
          <View style={[styles.settingItem, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.settingLeft}>
              <TouchableOpacity 
                style={[styles.settingIcon, { backgroundColor: colors.error }]}
                onPress={handleLogout}
              >
                <Text style={{ fontSize: 18 }}>🚪</Text>
              </TouchableOpacity>
              <View style={{ flex: 1 }}>
                <Text style={[styles.settingLabel, { color: colors.text }]}>Logout</Text>
                <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                  Sign out from your account
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={handleLogout}>
              <Text style={[styles.actionText, { color: colors.error }]}>Sign Out</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <Modal visible={showLogoutModal} transparent animationType="fade">
        <View style={[styles.logoutModalOverlay, { backgroundColor: 'rgba(0, 0, 0, 0.5)' }]}>
          <View style={[styles.logoutModalContent, { backgroundColor: colors.surface }]}>
            <Text style={[styles.logoutModalTitle, { color: colors.text }]}>Logout</Text>
            <Text style={[styles.logoutModalMessage, { color: colors.textSecondary }]}>Are you sure you want to logout?</Text>
            <View style={styles.logoutModalButtons}>
              <TouchableOpacity
                style={[styles.logoutModalButton, { backgroundColor: colors.border }]}
                onPress={() => setShowLogoutModal(false)}
              >
                <Text style={[styles.cancelButtonText, { color: colors.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.logoutModalButton, { backgroundColor: colors.error }]}
                onPress={confirmLogout}
              >
                <Text style={[styles.logoutConfirmButtonText, { color: colors.surface }]}>Logout</Text>
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
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
    marginLeft: 4,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  settingIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 13,
    fontWeight: '400',
  },
  toggleButton: {
    width: 54,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.5,
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  toggleCircle: {
    width: 28,
    height: 28,
    borderRadius: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
  },
  logoutModalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  logoutModalContent: {
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  logoutModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  logoutModalMessage: {
    fontSize: 14,
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
  cancelButtonText: {
    fontWeight: '600',
  },
  logoutConfirmButtonText: {
    fontWeight: '600',
  },
});
