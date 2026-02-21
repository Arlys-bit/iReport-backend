import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Alert, ScrollView, useColorScheme } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useSettings } from '@/contexts/SettingsContext';
import { Moon, Sun } from 'lucide-react-native';

export default function SettingsScreen() {
  const router = useRouter();
  const { logout } = useAuth();
  const { isDark, colors, theme, setTheme, t } = useSettings();
  const systemColorScheme = useColorScheme();

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          onPress: () => {},
          style: 'cancel',
        },
        {
          text: 'Logout',
          onPress: () => {
            logout();
            router.replace('/login');
          },
          style: 'destructive',
        },
      ],
      { cancelable: false }
    );
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
});
