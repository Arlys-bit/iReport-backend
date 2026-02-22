import { useEffect, useRef } from 'react';
import { useRouter } from 'expo-router';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useSettings } from '@/contexts/SettingsContext';

export default function Index() {
  const router = useRouter();
  const { currentUser, isLoading } = useAuth();
  const { colors } = useSettings();
  const hasNavigated = useRef(false);

  useEffect(() => {
    if (!isLoading && !hasNavigated.current) {
      hasNavigated.current = true;
      
      // Add small delay to ensure router is ready
      const timer = setTimeout(() => {
        if (currentUser) {
          switch (currentUser.role) {
            case 'admin':
            case 'principal':
            case 'guidance':
              router.replace('/admin');
              break;
            case 'teacher':
              router.replace('/teacher');
              break;
            case 'student':
              router.replace('/student');
              break;
            default:
              router.replace('/login');
          }
        } else {
          router.replace('/login');
        }
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [currentUser, isLoading, router]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
