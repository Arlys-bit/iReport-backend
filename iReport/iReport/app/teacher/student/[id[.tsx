import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Mail, IdCard, GraduationCap, User, AlertTriangle } from 'lucide-react-native';
import { useStudents } from '@/contexts/StudentsContext';
import { useReports } from '@/contexts/ReportContext';
import { ViolationRecord } from '@/types';
import colors from '@/constants/colors';

export default function TeacherStudentProfile() {
  const { id } = useLocalSearchParams();
  const { students, gradeLevels, sections } = useStudents();
  const { reports } = useReports();

  const student = useMemo(() => students.find(s => s.id === id), [students, id]);

  const studentReports = useMemo(() => {
    return reports.filter(r => r.reporterId === id);
  }, [reports, id]);

  const currentGrade = useMemo(() => gradeLevels.find(g => g.id === student?.gradeLevelId), [gradeLevels, student]);
  const currentSection = useMemo(() => sections.find(s => s.id === student?.sectionId), [sections, student]);

  if (!student) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Student not found</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView style={styles.content}>
        <View style={styles.headerSection}>
          {student.profilePhoto ? (
            <Image source={{ uri: student.profilePhoto }} style={styles.profilePhoto} />
          ) : (
            <View style={styles.profilePhotoPlaceholder}>
              <User size={48} color={colors.surface} />
            </View>
          )}
          <Text style={styles.name}>{student.fullName}</Text>
          <Text style={styles.subtitle}>{currentGrade?.name} - Section {currentSection?.name}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Student Information</Text>

          <View style={styles.infoRow}>
            <View style={styles.infoIcon}>
              <IdCard size={20} color={colors.primary} />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>LRN</Text>
              <Text style={styles.infoValue}>{student.lrn}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoIcon}>
              <Mail size={20} color={colors.primary} />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>School Email</Text>
              <Text style={styles.infoValue}>{student.schoolEmail || student.email}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoIcon}>
              <GraduationCap size={20} color={colors.primary} />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Grade & Section</Text>
              <Text style={styles.infoValue}>{currentGrade?.name} - Section {currentSection?.name}</Text>
            </View>
          </View>
        </View>

        {student.violationHistory && student.violationHistory.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <AlertTriangle size={20} color={colors.warning} />
              <Text style={styles.sectionTitle}>Violation History</Text>
            </View>
            {student.violationHistory.map((violation: ViolationRecord, index: number) => (
              <View key={violation.id || index} style={styles.violationCard}>
                <Text style={styles.violationType}>{violation.type.replace(/_/g, ' ').toUpperCase()}</Text>
                <Text style={styles.violationDescription}>{violation.description}</Text>
                <Text style={styles.violationDate}>{new Date(violation.date).toLocaleDateString()}</Text>
              </View>
            ))}
          </View>
        )}

        {studentReports.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Reports Submitted ({studentReports.length})</Text>
            {studentReports.map(report => (
              <View key={report.id} style={styles.reportItem}>
                <View style={[styles.typeBadge, { backgroundColor: getTypeColor(report.incidentType) + '20' }]}>
                  <Text style={[styles.typeBadgeText, { color: getTypeColor(report.incidentType) }]}>
                    {report.incidentType.replace(/_/g, ' ')}
                  </Text>
                </View>
                <Text style={styles.reportVictim}>Victim: {report.victimName}</Text>
                <Text style={styles.reportDate}>{new Date(report.createdAt).toLocaleDateString()}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={styles.infoBox}>
          <Text style={styles.infoBoxTitle}>Teacher View</Text>
          <Text style={styles.infoBoxText}>
            You can view student information for students in your assigned sections. 
            For editing student records, please contact the guidance office or admin.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function getTypeColor(type: string): string {
  switch (type) {
    case 'bullying':
    case 'physical_assault':
    case 'fighting':
      return '#EF4444';
    case 'harassment':
    case 'verbal_abuse':
      return '#F97316';
    case 'cyberbullying':
      return '#8B5CF6';
    default:
      return '#64748B';
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  errorText: {
    fontSize: 18,
    color: colors.text,
    marginBottom: 16,
  },
  backButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: colors.surface,
    fontSize: 16,
    fontWeight: '600' as const,
  },
  headerSection: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  profilePhoto: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 16,
  },
  profilePhotoPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
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
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
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
  violationCard: {
    backgroundColor: '#FEF3C7',
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
  },
  violationType: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#92400E',
    marginBottom: 4,
  },
  violationDescription: {
    fontSize: 14,
    color: '#78350F',
    marginBottom: 4,
  },
  violationDate: {
    fontSize: 12,
    color: '#A16207',
  },
  reportItem: {
    backgroundColor: colors.background,
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
  },
  typeBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 8,
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: '600' as const,
    textTransform: 'capitalize' as const,
  },
  reportVictim: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '500' as const,
    marginBottom: 4,
  },
  reportDate: {
    fontSize: 12,
    color: colors.textLight,
  },
  infoBox: {
    margin: 16,
    padding: 16,
    backgroundColor: '#DBEAFE',
    borderRadius: 12,
    marginBottom: 32,
  },
  infoBoxTitle: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#1E40AF',
    marginBottom: 6,
  },
  infoBoxText: {
    fontSize: 14,
    color: '#1E40AF',
    lineHeight: 20,
  },
});
