import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import colors from '@/constants/colors';

export default function AdminLogs() {
  const router = useRouter();
  const { currentUser, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      if (!currentUser) {
        router.replace('/login');
      } else if (currentUser.role !== 'teacher') {
        router.replace('/report');
      }
    }
  }, [currentUser, isLoading, router]);

  // Sample logs data
  const logs = [
    {
      id: '1',
      action: 'Report Submitted',
      user: 'John Doe',
      timestamp: new Date().toISOString(),
      description: 'Student submitted incident report',
    },
    {
      id: '2',
      action: 'Login',
      user: 'Teacher Admin',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      description: 'Teacher logged in',
    },
    {
      id: '3',
      action: 'Report Reviewed',
      user: 'Teacher Admin',
      timestamp: new Date(Date.now() - 7200000).toISOString(),
      description: 'Teacher reviewed incident report',
    },
  ];

  const renderLogItem = ({ item }: { item: any }) => (
    <View style={styles.logCard}>
      <View style={styles.logHeader}>
        <Text style={styles.logAction}>{item.action}</Text>
        <Text style={styles.logTime}>
          {new Date(item.timestamp).toLocaleTimeString()}
        </Text>
      </View>
      <Text style={styles.logUser}>{item.user}</Text>
      <Text style={styles.logDescription}>{item.description}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Activity Logs</Text>
      </View>

      {logs.length === 0 ? (
        <View style={styles.emptyArea}>
          <Text style={styles.emptyText}>No logs yet</Text>
        </View>
      ) : (
        <FlatList
          data={logs}
          renderItem={renderLogItem}
          keyExtractor={(log: any) => log.id}
          contentContainerStyle={styles.listContent}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    padding: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  logCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  logAction: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  logTime: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  logUser: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: 4,
  },
  logDescription: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  emptyArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: colors.textSecondary,
  },
});
