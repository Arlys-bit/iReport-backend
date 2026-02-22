import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Calendar, AlertTriangle } from 'lucide-react-native';
import { useReports } from '@/contexts/ReportContext';
import colors from '@/constants/colors';

export default function ReportsScreen() {
  const router = useRouter();
  const { reports, loading } = useReports();

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (reports.length === 0) {
    return (
      <View style={styles.center}>
        <AlertTriangle size={48} color={colors.textLight} />
        <Text style={styles.emptyText}>No reports submitted yet</Text>
      </View>
    );
  }

  const renderReportItem = ({ item }: any) => (
    <TouchableOpacity
      style={styles.reportCard}
      onPress={() => router.push(`/student/reports/${item.id}`)}
    >
      <View style={styles.reportHeader}>
        <Text style={styles.reportTitle} numberOfLines={2}>
          {item.description || 'Incident Report'}
        </Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
      </View>
      <View style={styles.reportFooter}>
        <Calendar size={14} color={colors.textSecondary} />
        <Text style={styles.reportDate}>
          {new Date(item.dateTime).toLocaleDateString()}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={reports}
        renderItem={renderReportItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        scrollEnabled={true}
      />
    </View>
  );
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'under_review':
      return '#FEF3C7';
    case 'accepted':
      return '#D1FAE5';
    case 'declined':
      return '#FEE2E2';
    default:
      return '#F1F5F9';
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 16,
    color: colors.textLight,
  },
  listContent: {
    padding: 16,
  },
  reportCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  reportTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.text,
    textTransform: 'capitalize',
  },
  reportFooter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reportDate: {
    marginLeft: 6,
    fontSize: 12,
    color: colors.textSecondary,
  },
});
