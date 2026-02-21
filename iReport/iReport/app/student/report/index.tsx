import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Switch,
  Image,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Calendar } from 'react-native-calendars';
import { ArrowRight, Camera, X, CheckSquare, Square } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useReports } from '@/contexts/ReportContext';
import importedColors from '@/constants/colors';

const defaultColors = {
  primary: '#3B82F6',
  background: '#F8FAFC',
  surface: '#FFFFFF',
  text: '#1E293B',
  textSecondary: '#64748B',
  textLight: '#94A3B8',
  border: '#E2E8F0',
  borderLight: '#F1F5F9',
  error: '#EF4444',
  anonymous: '#8B5CF6',
};

const colors = importedColors || defaultColors;

export default function StudentReportScreen() {
  const router = useRouter();
  const { currentUser, logout } = useAuth();
  const { createReport, isCreatingReport } = useReports();

  const [reportingForSelf, setReportingForSelf] = useState(true);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [victimName, setVictimName] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('1:00');
  const [selectedPeriod, setSelectedPeriod] = useState('AM');
  const [showCalendar, setShowCalendar] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [cantRememberDateTime, setCantRememberDateTime] = useState(false);
  const [photoEvidence, setPhotoEvidence] = useState(undefined as string | undefined);

  const handleLogout = () => {
    router.back();
  };

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.7,
    });

    if (!result.canceled) {
      setPhotoEvidence(result.assets[0].uri);
    }
  };

  const handleDateSelect = (day: any) => {
    setSelectedDate(day.dateString);
    setShowCalendar(false);
  };

  const handleTimeSelect = (hours: string, minutes: string) => {
    setSelectedTime(`${hours}:${minutes}`);
    setShowTimePicker(false);
  };

  const handleSubmitReport = () => {
    if (!victimName.trim()) {
      Alert.alert('Required Field', 'Please enter the name of the student being bullied.');
      return;
    }

    if (!location.trim()) {
      Alert.alert('Required Field', 'Please enter the location of the incident.');
      return;
    }

    if (!cantRememberDateTime) {
      if (!selectedDate.trim()) {
        Alert.alert('Required Field', 'Please select the date of the incident.');
        return;
      }

      if (!selectedTime.trim() || selectedTime === '1:' || selectedTime === ':') {
        Alert.alert('Required Field', 'Please enter the time of the incident.');
        return;
      }
    }

    if (!currentUser) return;

    createReport({
      reporterId: currentUser.id,
      reporterName: currentUser.fullName,
      reporterLRN: currentUser.lrn || '',
      reporterPhoto: currentUser.profilePhoto,
      isAnonymous,
      victimName: victimName.trim(),
      location: location.trim(),
      description: description.trim(),
      dateTime: cantRememberDateTime ? undefined : selectedDate + (selectedTime && selectedTime.includes(':') ? ` ${selectedTime} ${selectedPeriod}` : ''),
      cantRememberDateTime,
      photoEvidence,
      reportingForSelf,
    });

    Alert.alert(
      'Report Submitted',
      'Your incident report has been submitted successfully. Thank you for making our school safer.',
      [
        {
          text: 'OK',
          onPress: () => {
            setVictimName('');
            setLocation('');
            setDescription('');
            setSelectedDate('');
            setSelectedTime('1:00');
            setSelectedPeriod('AM');
            setCantRememberDateTime(false);
            setPhotoEvidence(undefined);
            setReportingForSelf(true);
            setIsAnonymous(false);
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Welcome,</Text>
          <Text style={styles.name}>{currentUser?.fullName}</Text>
        </View>
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          testID="logout-button"
        >
          <ArrowRight size={20} color={colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.titleSection}>
          <Text style={styles.title}>Report an Incident</Text>
          <Text style={styles.subtitle}>
            Your report helps keep our school safe. All information is handled with care.
          </Text>
        </View>

        <View style={styles.form}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Who is this report for?</Text>
            <View style={styles.radioGroup}>
              <TouchableOpacity
                style={styles.radioOption}
                onPress={() => setReportingForSelf(true)}
              >
                {reportingForSelf ? (
                  <CheckSquare size={24} color={colors.primary} />
                ) : (
                  <Square size={24} color={colors.textLight} />
                )}
                <Text style={styles.radioLabel}>Reporting for myself</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.radioOption}
                onPress={() => setReportingForSelf(false)}
              >
                {!reportingForSelf ? (
                  <CheckSquare size={24} color={colors.primary} />
                ) : (
                  <Square size={24} color={colors.textLight} />
                )}
                <Text style={styles.radioLabel}>Reporting for someone else</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.switchRow}>
              <View style={styles.switchInfo}>
                <Text style={styles.switchLabel}>Submit Anonymously</Text>
                <Text style={styles.switchHint}>
                  Your identity will be hidden from public view
                </Text>
              </View>
              <Switch
                value={isAnonymous}
                onValueChange={setIsAnonymous}
                trackColor={{ false: colors.border, true: colors.anonymous }}
                thumbColor={colors.surface}
                testID="anonymous-switch"
              />
            </View>
            {isAnonymous && (
              <View style={styles.anonymousNote}>
                <Text style={styles.anonymousNoteText}>
                  Note: Your account information will still be attached internally for verification.
                </Text>
              </View>
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Name of Student Being Bullied <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              value={victimName}
              onChangeText={setVictimName}
              placeholder={reportingForSelf ? 'Enter your name' : "Enter student's name"}
              placeholderTextColor={colors.textLight}
              autoCapitalize="words"
              testID="victim-name-input"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Location of Incident <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              value={location}
              onChangeText={setLocation}
              placeholder="e.g., Classroom 101, Cafeteria, Hallway"
              placeholderTextColor={colors.textLight}
              autoCapitalize="words"
              testID="location-input"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Incident Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Describe what happened (optional)"
              placeholderTextColor={colors.textLight}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              testID="description-input"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Date & Time</Text>
            <TouchableOpacity
              style={styles.checkboxRow}
              onPress={() => setCantRememberDateTime(!cantRememberDateTime)}
            >
              {cantRememberDateTime ? (
                <CheckSquare size={20} color={colors.primary} />
              ) : (
                <Square size={20} color={colors.textLight} />
              )}
              <Text style={styles.checkboxLabel}>I can&apos;t remember</Text>
            </TouchableOpacity>

            <View style={styles.dateTimeRow}>
              <View style={styles.dateTimeContainer}>
                <Text style={styles.dateTimeLabel}>Date</Text>
                <TouchableOpacity
                  style={[styles.input, styles.dateButton]}
                  onPress={() => setShowCalendar(true)}
                >
                  <Text style={styles.dateDisplayText}>
                    {selectedDate ? selectedDate : 'Select date'}
                  </Text>
                </TouchableOpacity>
              </View>

              {!cantRememberDateTime && (
                <View style={styles.dateTimeContainer}>
                  <Text style={styles.dateTimeLabel}>Time</Text>
                    <TouchableOpacity
                      style={[styles.input, styles.timeButton]}
                      onPress={() => setShowTimePicker(true)}
                    >
                      <Text style={styles.timeDisplayText}>
                        {(selectedTime && String(selectedTime).length > 0) ? `${selectedTime} ${selectedPeriod}` : '1:00 AM'}
                      </Text>
                    </TouchableOpacity>
                </View>
              )}
            </View>

            <Modal
              visible={showCalendar}
              transparent
              animationType="fade"
              onRequestClose={() => setShowCalendar(false)}
            >
              <View style={styles.calendarOverlay}>
                <View style={styles.calendarContainer}>
                  <View style={styles.calendarHeader}>
                    <Text style={styles.calendarTitle}>Select Date</Text>
                    <TouchableOpacity onPress={() => setShowCalendar(false)}>
                      <X size={24} color={colors.text} />
                    </TouchableOpacity>
                  </View>
                  <Calendar
                    onDayPress={handleDateSelect}
                    markedDates={selectedDate ? { [selectedDate]: { selected: true, selectedColor: colors.primary } } : {}}
                    theme={{
                      backgroundColor: colors.surface,
                      calendarBackground: colors.surface,
                      textSectionTitleColor: colors.text,
                      selectedDayBackgroundColor: colors.primary,
                      selectedDayTextColor: colors.surface,
                      todayTextColor: colors.primary,
                      dayTextColor: colors.text,
                      textDisabledColor: colors.textLight,
                      dotColor: colors.primary,
                      selectedDotColor: colors.surface,
                      monthTextColor: colors.text,
                      arrowColor: colors.primary,
                    }}
                  />
                </View>
              </View>
            </Modal>

            <Modal
              visible={showTimePicker}
              transparent
              animationType="slide"
              onRequestClose={() => setShowTimePicker(false)}
            >
              <View style={styles.timePickerOverlay}>
                <View style={styles.timePickerContainer}>
                  <View style={styles.timePickerHeader}>
                    <Text style={styles.timePickerTitle}>Select Time</Text>
                    <TouchableOpacity onPress={() => setShowTimePicker(false)}>
                      <X size={24} color={colors.text} />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.timeInputRow}>
                    <View style={styles.timeInputGroup}>
                      <Text style={styles.timeInputLabel}>Hours</Text>
                      <TextInput
                        style={styles.timeInput}
                        placeholder="1"
                        placeholderTextColor={colors.textLight}
                        keyboardType="number-pad"
                        maxLength={2}
                        value={String((selectedTime || '1:00').split(':')[0] || '')}
                        onChangeText={(hours) => {
                          const currentTime = selectedTime || '1:00';
                          const timeParts = currentTime.split(':');
                          const mins = (timeParts && timeParts[1]) || '00';
                          if (hours === '') {
                            setSelectedTime(`:${mins}`);
                          } else if (/^\d+$/.test(hours)) {
                            const numHours = parseInt(hours);
                            if (numHours >= 1 && numHours <= 12) {
                              setSelectedTime(`${numHours}:${mins}`);
                            }
                          }
                        }}
                      />
                    </View>

                    <Text style={styles.timeSeparator}>:</Text>

                    <View style={styles.timeInputGroup}>
                      <Text style={styles.timeInputLabel}>Minutes</Text>
                      <TextInput
                        style={styles.timeInput}
                        placeholder="0"
                        placeholderTextColor={colors.textLight}
                        keyboardType="number-pad"
                        maxLength={2}
                        value={String(((selectedTime || '1:00').split(':')[1] || '').replace(/^0/, '') || '')}
                        onChangeText={(minutes) => {
                          const currentTime = selectedTime || '1:00';
                          const timeParts = currentTime.split(':');
                          const hours = (timeParts && timeParts[0]) || '1';
                          if (minutes === '') {
                            setSelectedTime(`${hours}:`);
                          } else if (/^\d+$/.test(minutes)) {
                            const numMinutes = parseInt(minutes);
                            if (numMinutes >= 0 && numMinutes <= 59) {
                              const paddedMinutes = minutes.length === 1 ? `0${minutes}` : minutes;
                              setSelectedTime(`${hours}:${paddedMinutes}`);
                            }
                          }
                        }}
                      />
                    </View>

                    <View style={styles.periodButtonsGroup}>
                      <Text style={styles.periodLabel}>Period</Text>
                      <View style={styles.periodButtons}>
                        <TouchableOpacity
                          style={[
                            styles.periodButton,
                            selectedPeriod === 'AM' && styles.periodButtonActive,
                          ]}
                          onPress={() => setSelectedPeriod('AM')}
                        >
                          <Text
                            style={[
                              styles.periodButtonText,
                              selectedPeriod === 'AM' && styles.periodButtonTextActive,
                            ]}
                          >
                            AM
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[
                            styles.periodButton,
                            selectedPeriod === 'PM' && styles.periodButtonActive,
                          ]}
                          onPress={() => setSelectedPeriod('PM')}
                        >
                          <Text
                            style={[
                              styles.periodButtonText,
                              selectedPeriod === 'PM' && styles.periodButtonTextActive,
                            ]}
                          >
                            PM
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>

                  <TouchableOpacity
                    style={styles.timePickerButton}
                    onPress={() => setShowTimePicker(false)}
                  >
                    <Text style={styles.timePickerButtonText}>Done</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Modal>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Photo or Video Evidence (Optional)</Text>
            {photoEvidence ? (
              <View style={styles.evidenceContainer}>
                <Image source={{ uri: photoEvidence }} style={styles.evidenceImage} />
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => setPhotoEvidence(undefined)}
                >
                  <X size={20} color={colors.surface} />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.uploadButton}
                onPress={handlePickImage}
                testID="upload-evidence-button"
              >
                <Camera size={24} color={colors.primary} />
                <Text style={styles.uploadButtonText}>Add Photo Evidence</Text>
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity
            style={[styles.submitButton, isCreatingReport && styles.submitButtonDisabled]}
            onPress={handleSubmitReport}
            disabled={isCreatingReport}
            testID="submit-report-button"
          >
            {isCreatingReport ? (
              <ActivityIndicator color={colors.surface} />
            ) : (
              <Text style={styles.submitButtonText}>Submit Report</Text>
            )}
          </TouchableOpacity>

          <View style={styles.safetyNote}>
            <Text style={styles.safetyNoteText}>
              Your safety matters. This report will be reviewed by school staff who are here to help.
            </Text>
          </View>
        </View>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  greeting: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  name: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: colors.text,
    marginTop: 2,
  },
  logoutButton: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  titleSection: {
    padding: 24,
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  form: {
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.text,
    marginBottom: 12,
  },
  radioGroup: {
    gap: 12,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  radioLabel: {
    fontSize: 16,
    color: colors.text,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  switchInfo: {
    flex: 1,
    marginRight: 12,
  },
  switchLabel: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.text,
    marginBottom: 4,
  },
  switchHint: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  anonymousNote: {
    backgroundColor: '#F5F3FF',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  anonymousNoteText: {
    fontSize: 13,
    color: colors.anonymous,
    lineHeight: 18,
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
  required: {
    color: colors.error,
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
  textArea: {
    minHeight: 100,
    paddingTop: 14,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  checkboxLabel: {
    fontSize: 14,
    color: colors.text,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed' as const,
    borderRadius: 12,
    paddingVertical: 20,
  },
  uploadButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.primary,
  },
  evidenceContainer: {
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
  },
  evidenceImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
  },
  removeButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: colors.error,
    borderRadius: 20,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: colors.surface,
  },
  safetyNote: {
    backgroundColor: '#DBEAFE',
    padding: 16,
    borderRadius: 12,
    marginTop: 24,
  },
  safetyNoteText: {
    fontSize: 14,
    color: '#1E40AF',
    lineHeight: 20,
    textAlign: 'center',
  },
  dateButton: {
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  dateDisplayText: {
    fontSize: 16,
    color: colors.text,
  },
  dateTimeRow: {
    flexDirection: 'row',
    gap: 12,
  },
  dateTimeContainer: {
    flex: 1,
  },
  dateTimeLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: colors.textSecondary,
    marginBottom: 6,
  },
  timeButton: {
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  timeDisplayText: {
    fontSize: 16,
    color: colors.text,
  },
  timePickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  timePickerContainer: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  timePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  timePickerTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: colors.text,
  },
  timeInputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 24,
  },
  timeInputGroup: {
    alignItems: 'center',
  },
  timeInputLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  timeInput: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 24,
    fontWeight: '600' as const,
    color: colors.text,
    width: 70,
    textAlign: 'center',
  },
  timeSeparator: {
    fontSize: 24,
    fontWeight: '600' as const,
    color: colors.text,
    marginBottom: 10,
  },
  periodButtonsGroup: {
    alignItems: 'center',
    marginLeft: 8,
  },
  periodLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  periodButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  periodButton: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minWidth: 50,
    alignItems: 'center',
  },
  periodButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  periodButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.text,
  },
  periodButtonTextActive: {
    color: colors.surface,
  },
  timePickerButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  timePickerButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: colors.surface,
  },
  calendarOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  calendarContainer: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    width: '90%',
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  calendarTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: colors.text,
  },
});
