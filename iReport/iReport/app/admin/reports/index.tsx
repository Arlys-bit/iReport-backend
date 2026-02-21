import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Search, X, Filter, Clock, CheckCircle, XCircle } from 'lucide-react-native';
import { useStudents } from '@/contexts/StudentsContext';
import { IncidentReport, ReportStatus } from '@/types';
import { INCIDENT_TYPES } from '@/constants/school';
import colors from '@/constants/colors';
import { useReports } from '@/contexts/ReportContext';

type FilterStatus = 'all' | ReportStatus;

export default function ReportsIndex() {
  const { reports } = useReports();
  const { gradeLevels, sections } = useStudents();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');

  const filteredReports = useMemo(() => {
    let result = [...reports];

    if (filterStatus !== 'all') {
      result = result.filter(r => r.status === filterStatus);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(r =>
        r.victimName.toLowerCase().includes(query) ||
        r.reporterName.toLowerCase().includes(query) ||
        r.incidentType.toLowerCase().includes(query)
      );
    }

    return result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [reports, filterStatus, searchQuery]);

  const statusCounts = useMemo(() => ({
    all: reports.length,
    under_review: reports.filter(r => r.status === 'under_review').length,
    accepted: reports.filter(r => r.status === 'accepted').length,
    declined: reports.filter(r => r.status === 'declined').length,
  }), [reports]);

  const getStatusColor = (status: ReportStatus) => {
    switch (status) {
      case 'under_review': return '#F59E0B';
      case 'accepted': return '#10B981';
      case 'declined': return '#EF4444';
      default: return '#64748B';
    }
  };

  const getIncidentInfo = (type: string) => {
    return INCIDENT_TYPES.find(t => t.value === type) || { label: type, color: '#64748B' };
  };

  const getGradeName = (gradeId: string) => gradeLevels.find(g => g.id === gradeId)?.name || '';
  const getSectionName = (sectionId: string) => sections.find(s => s.id === sectionId)?.name || '';

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.header}>
        <View style={styles.searchContainer}>
          <Search size={20} color={colors.textLight} />
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search reports..."
            placeholderTextColor={colors.textLight}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <X size={20} color={colors.textLight} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView 
        horizontal 
        style={styles.filtersContainer} 
        contentContainerStyle={styles.filtersContent}
        showsHorizontalScrollIndicator={false}
      >
        <TouchableOpacity
          style={[styles.filterChip, filterStatus === 'all' && styles.filterChipActive]}
          onPress={() => setFilterStatus('all')}
        >
          <Text style={[styles.filterChipText, filterStatus === 'all' && styles.filterChipTextActive]}>
            All ({statusCounts.all})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterChip, filterStatus === 'under_review' && styles.filterChipActive]}
          onPress={() => setFilterStatus('under_review')}
        >
          <Clock size={14} color={filterStatus === 'under_review' ? colors.surface : '#F59E0B'} />
          <Text style={[styles.filterChipText, filterStatus === 'under_review' && styles.filterChipTextActive]}>
            Pending ({statusCounts.under_review})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterChip, filterStatus === 'accepted' && styles.filterChipActive]}
          onPress={() => setFilterStatus('accepted')}
        >
          <CheckCircle size={14} color={filterStatus === 'accepted' ? colors.surface : '#10B981'} />
          <Text style={[styles.filterChipText, filterStatus === 'accepted' && styles.filterChipTextActive]}>
            Accepted ({statusCounts.accepted})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterChip, filterStatus === 'declined' && styles.filterChipActive]}
          onPress={() => setFilterStatus('declined')}
        >
          <XCircle size={14} color={filterStatus === 'declined' ? colors.surface : '#EF4444'} />
          <Text style={[styles.filterChipText, filterStatus === 'declined' && styles.filterChipTextActive]}>
            Declined ({statusCounts.declined})
          </Text>
        </TouchableOpacity>
      </ScrollView>

      <ScrollView style={styles.content}>
        {filteredReports.length === 0 ? (
          <View style={styles.emptyState}>
            <Filter size={48} color={colors.textLight} />
            <Text style={styles.emptyTitle}>No reports found</Text>
            <Text style={styles.emptyText}>
              {searchQuery ? 'Try a different search term' : 'No reports match the selected filter'}
            </Text>
          </View>
        ) : (
          filteredReports.map((report: IncidentReport) => {
            const incidentInfo = getIncidentInfo(report.incidentType);
            
            return (
              <TouchableOpacity
                key={report.id}
                style={styles.reportCard}
                onPress={() => router.push(`/admin/reports/${report.id}` as any)}
              >
                <View style={styles.reportHeader}>
                  <View style={[styles.typeBadge, { backgroundColor: incidentInfo.color + '20' }]}>
                    <Text style={[styles.typeBadgeText, { color: incidentInfo.color }]}>
                      {incidentInfo.label}
                    </Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(report.status) + '20' }]}>
                    <Text style={[styles.statusBadgeText, { color: getStatusColor(report.status) }]}>
                      {(report.status || 'unknown').replace(/_/g, ' ')}
                    </Text>
                  </View>
                </View>

                <View style={styles.reportBody}>
                  {!report.isAnonymous && report.reporterPhoto ? (
                    <Image source={{ uri: report.reporterPhoto }} style={styles.reporterPhoto} />
                  ) : (
                    <View style={[styles.reporterPhoto, styles.reporterPhotoPlaceholder]}>
                      <Text style={styles.reporterInitial}>
                        {report.isAnonymous ? '?' : report.reporterName.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                  )}
                  <View style={styles.reportInfo}>
                    <Text style={styles.victimName}>Victim: {report.victimName}</Text>
                    <Text style={styles.reporterName}>
                      {report.isAnonymous ? 'Anonymous Reporter' : `Reporter: ${report.reporterName}`}
                    </Text>
                    <Text style={styles.reportLocation}>
                      Building {report.location.building} • {report.location.floor} Floor
                    </Text>
                    <Text style={styles.reportDate}>
                      {new Date(report.createdAt).toLocaleDateString()} at {new Date(report.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  </View>
                </View>

                {report.priority === 'urgent' && (
                  <View style={styles.urgentBanner}>
                    <Text style={styles.urgentText}>URGENT</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    padding: 16,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 12,
    paddingHorizontal: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text,
  },
  filtersContainer: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  filtersContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.background,
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: colors.text,
  },
  filterChipTextActive: {
    color: colors.surface,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 48,
    marginTop: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  reportCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
    position: 'relative',
    overflow: 'hidden',
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  typeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: '600' as const,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '600' as const,
    textTransform: 'capitalize' as const,
  },
  reportBody: {
    flexDirection: 'row',
  },
  reporterPhoto: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  reporterPhotoPlaceholder: {
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reporterInitial: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: colors.surface,
  },
  reportInfo: {
    flex: 1,
    marginLeft: 12,
  },
  victimName: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: colors.text,
    marginBottom: 2,
  },
  reporterName: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  reportLocation: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  reportDate: {
    fontSize: 11,
    color: colors.textLight,
    marginTop: 4,
  },
  urgentBanner: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#EF4444',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderBottomLeftRadius: 8,
  },
  urgentText: {
    fontSize: 10,
    fontWeight: '700' as const,
    color: colors.surface,
  },
});
