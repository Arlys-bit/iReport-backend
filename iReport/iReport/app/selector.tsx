import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Platform,
  Image,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { Shield, User, Users, BookOpen, MessageCircle, Settings, Book, HelpCircle, Lightbulb, Siren, PhoneCall as PhoneCallIcon } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useSettings } from '@/contexts/SettingsContext';

export default function SelectorScreen() {
  const router = useRouter();
  const { currentUser } = useAuth();
  const { colors } = useSettings();
  const hasChecked = useRef(false);

  useEffect(() => {
    // If no logged-in user, send to login — disallow guest dashboard
    if (!hasChecked.current) {
      hasChecked.current = true;
      if (!currentUser) {
        setTimeout(() => {
          router.replace('/login');
        }, 100);
      }
    }
  }, [currentUser, router]);
  const getFriendlyRole = (role?: string) => {
    if (!role) return 'Guest';
    const r = role.toLowerCase();
    if (r === 'concilor' || r === 'councilor' || r === 'counselor') return 'Counselor';
    if (r === 'teacher') return 'Teacher';
    if (r === 'student') return 'Student';
    if (r === 'principal') return 'Principal';
    return role.charAt(0).toUpperCase() + role.slice(1);
  };

  const getFirstName = (fullName?: string) => {
    if (!fullName) return '';
    return fullName.split(' ')[0];
  };

  const roleLabel = getFriendlyRole(currentUser?.role);
  const firstName = getFirstName(currentUser?.fullName);
  const welcomeLabel = firstName ? `Welcome ${roleLabel} ${firstName}` : `Welcome ${roleLabel}`;

  const currentRole = (currentUser?.role || '').toLowerCase();

  // Only show grid items relevant to the logged-in user's role
  const getGridItems = () => {
    if (['teacher', 'councilor', 'counselor', 'principal', 'admin'].includes(currentRole)) {
      return [
        {
          id: '1',
          title: 'Reports Dashboard',
          icon: Shield,
          description: 'View and manage bullying reports',
          onPress: () => router.push('/admin'),
          isActive: true,
        },
        { id: '2', 
          title : 'Active Bullying',
          icon: Siren,
          description: 'View live bullying reports',
          onPress: () => router.push('/admin/map'),
          isActive: true,
        },
        { id: '3',
            title: 'Emergency Hotline',
            icon: PhoneCallIcon,
            description: 'Contact emergency support',
            onPress: () => router.push('/hotline'),
            isActive: true,
         },
         { 
            id: '4',
            title: 'Student & Teacher Management',
            icon: Users,
            description: 'Manage teacher and student profiles',
            onPress: () => router.push('/admin/management'),
            isActive: true,
         },
         {
            id: '5',
            title: 'Guides',
            icon: Book,
            description: 'Guides and resources',
            onPress: () => router.push('/guides'),
            isActive: true, 
        },
        { 
            id: '6',
            title: 'Profile Settings',
            icon: User,
            description: 'Configure application settings',
            onPress: () => router.push('/admin/profile'),
            isActive: true,
        },
      ];
    }
    
    // Student role
    return [
      {
        id: '1',
        title: 'File A Report',
        icon: BookOpen,
        description: 'Report an incident you experienced or witnessed',
        onPress: () => router.push('/student'),
        isActive: true,
      },
      { id: '2', 
          title : 'Active Incidents',
          icon: Siren,
          description: 'Report a live incident',
          onPress: () => router.push('/student/live-report'),
          isActive: true,
      },
      { 
            id: '3',
            title: 'Ask Bot',
            icon: Lightbulb,
            description: 'Ask the IWitness Bot for help',
            onPress: () => router.push('/bot'),
            isActive: true,
      },
      {  
          id: '4',
            title: 'Emergency Hotline',
            icon: PhoneCallIcon,
            description: 'Contact emergency support',
            onPress: () => router.push('/hotline'),
            isActive: true,
      },
      {
        id: '5',
        title: 'Guides',
        icon: BookOpen,
        description: 'Guides and resources',
        onPress: () => router.push('/guides'),
        isActive: true,
      },
      { 
        id: '6',
        title: 'Profile Settings',
        icon: User,
        description: 'Update your profile and preferences settings',
        onPress: () => router.push('/student/profile'),
        isActive: true,
      },
    ];
  };

  const gridItems = getGridItems();

  return (
    <>
      <Stack.Screen 
        options={{
          headerShown: false,
          gestureEnabled: Platform.OS !== 'web',
        }}
      />
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Header */}
          <View style={styles.header}>
            <Image 
              source={require('@/assets/iReport Icon.png')} 
              style={styles.headerImage}
            />
            <Text style={[styles.title, { color: colors.text }]}>IWitness</Text>
            <Text style={[styles.subtitle, { color: colors.textLight }]}>Digital Bullying Tracking System</Text>
            <Text style={[styles.welcomeRole, { color: colors.textSecondary }]}>{welcomeLabel}</Text>
          </View>

          {/* Grid Container */}
          <View style={styles.gridContainer}>
            {gridItems.map((item) => {
              if (!item.isActive) {
                return (
                  <View
                    key={item.id}
                    style={[styles.gridItem, styles.emptyGridItem, { borderColor: colors.border, backgroundColor: colors.background }]}
                  />
                );
              }

              const Icon = item.icon;
              return (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.gridItem, { backgroundColor: colors.surface, borderColor: colors.border }]}
                  onPress={item.onPress}
                  activeOpacity={0.8}
                >
                  <Icon size={40} color={colors.primary} strokeWidth={1.5} />
                  <Text style={[styles.gridTitle, { color: colors.text }]}>{item.title}</Text>
                  <Text style={[styles.gridDescription, { color: colors.textLight }]}>{item.description}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  header: {
    alignItems: 'center',
    marginBottom: 16,
  },
  headerImage: {
    width: 64,
    height: 64,
    resizeMode: 'contain',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginTop: 8,
  },
  subtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  welcomeRole: {
    fontSize: 15,
    marginTop: 6,
    fontWeight: '600',
  },
  selectionText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 0,
  },
  gridContainer: {
    flex: 1,
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'space-between',
  },
  gridItem: {
    width: '48%',
    aspectRatio: 1,
    borderRadius: 12,
    borderWidth: 2,
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  emptyGridItem: {
    borderStyle: 'dashed',
    opacity: 0.5,
  },
  gridTitle: {
    fontSize: 13,
    fontWeight: '700',
    marginTop: 8,
    textAlign: 'center',
  },
  gridDescription: {
    fontSize: 10,
    marginTop: 2,
    textAlign: 'center',
  },
});
