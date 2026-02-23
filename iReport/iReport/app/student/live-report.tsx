import React, { useState, useMemo } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, TextInput, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { Stack, router } from 'expo-router';
import { AlertTriangle, MapPin, Shield, Users, MessageSquare, Zap, ChevronDown } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useLiveReports } from '@/contexts/LiveReportsContext';
import { useBuildings } from '@/contexts/BuildingsContext';
import { Student } from '@/types';

const INCIDENT_TYPES = [
  { id: 'fighting', label: 'Fighting', icon: Shield },
  { id: 'group_conflict', label: 'Group Conflict', icon: Users },
  { id: 'verbal_threats', label: 'Verbal Threats', icon: MessageSquare },
  { id: 'physical_assault', label: 'Physical Assault', icon: Zap },
  { id: 'emergency', label: 'Emergency', icon: AlertTriangle },
  { id: 'other', label: 'Other', icon: MapPin },
];

export default function StudentLiveReportScreen() {
  const { currentUser } = useAuth();
  const liveReports = useLiveReports();
  const createIncident = liveReports?.createIncident;
  const isCreating = liveReports?.isCreating ?? false;
  const { activeBuildings, getFloorsForBuilding } = useBuildings();

  const student = currentUser as Student | null;

  const [selectedBuilding, setSelectedBuilding] = useState('');
  const [selectedFloor, setSelectedFloor] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [description, setDescription] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  const [showBuildingPicker, setShowBuildingPicker] = useState(false);
  const [showFloorPicker, setShowFloorPicker] = useState(false);

  const selectedBuildingData = useMemo(() => {
    return activeBuildings.find(b => b.id === selectedBuilding);
  }, [activeBuildings, selectedBuilding]);

  const availableFloors = useMemo(() => {
    if (!selectedBuilding) return [];
    return getFloorsForBuilding(selectedBuilding);
  }, [selectedBuilding, getFloorsForBuilding]);



  const handleBuildingSelect = (buildingId: string) => {
    setSelectedBuilding(buildingId);
    setSelectedFloor('');
    setSelectedSection('');
    setShowBuildingPicker(false);
  };

  const handleSuccessClose = () => {
    setShowSuccess(false);
    Alert.alert(
      'Alert Sent!',
      'Your live incident report has been sent to all available staff members. Help is on the way.',
      [{ text: 'OK', onPress: () => router.back() }]
    );
  };

  const handleSubmit = async () => {
    console.log('🔴 Submit button pressed');
    console.log('Student:', student);
    console.log('createIncident function:', createIncident);
    
    if (!student) {
      console.log('❌ No student');
      Alert.alert('Error', 'You must be logged in as a student');
      return;
    }

    if (!selectedBuilding || !selectedFloor) {
      console.log('❌ Building or floor not selected');
      Alert.alert('Required', 'Please select building and floor');
      return;
    }

    if (!selectedType) {
      console.log('❌ Incident type not selected');
      Alert.alert('Required', 'Please select incident type');
      return;
    }

    if (!description.trim() || description.trim().length < 5) {
      console.log('❌ Description too short');
      Alert.alert('Required', 'Please provide a brief description (at least 5 characters)');
      return;
    }

    if (!createIncident) {
      console.log('❌ createIncident function not available');
      Alert.alert('Error', 'Unable to create incident. Please try again.');
      return;
    }

    try {
      console.log('📝 Creating incident...');
      await createIncident({
        reporterId: student.id,
        reporterName: student.fullName,
        reporterGradeLevelId: student.gradeLevelId,
        reporterSectionId: student.sectionId,
        buildingId: selectedBuilding,
        buildingName: selectedBuildingData?.name || selectedBuilding,
        floor: selectedFloor,
        room: selectedSection || 'N/A',
        incidentType: selectedType,
        description: description.trim(),
      });

      console.log('✅ Incident created successfully');
      setShowSuccess(true);
    } catch (error) {
      console.log('❌ Error creating live incident:', error);
      Alert.alert('Error', 'Failed to send alert. Please try again.');
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: 'Live Incident Report',
          headerStyle: { backgroundColor: '#DC2626' },
          headerTintColor: '#FFFFFF',
        }} 
      />

      <View style={styles.warningBanner}>
        <AlertTriangle size={24} color="#FFFFFF" />
        <View style={styles.warningText}>
          <Text style={styles.warningTitle}>Emergency Alert System</Text>
          <Text style={styles.warningSubtitle}>Report incidents happening RIGHT NOW</Text>
        </View>
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Where is it happening?</Text>

          <View style={styles.pickerContainer}>
            <Text style={styles.label}>Building *</Text>
            <TouchableOpacity
              style={styles.pickerButton}
              onPress={() => {
                setShowBuildingPicker(!showBuildingPicker);
                setShowFloorPicker(false);
              }}
            >
              <Text style={[styles.pickerText, !selectedBuilding && styles.placeholderText]}>
                {selectedBuildingData?.name || 'Select Building'}
              </Text>
              <ChevronDown size={20} color="#6B7280" />
            </TouchableOpacity>
            {showBuildingPicker && (
              <View style={styles.dropdownMenu}>
                {activeBuildings.map(building => (
                  <TouchableOpacity
                    key={building.id}
                    style={[
                      styles.dropdownItem,
                      selectedBuilding === building.id && styles.dropdownItemSelected
                    ]}
                    onPress={() => handleBuildingSelect(building.id)}
                  >
                    <View style={[styles.buildingDot, { backgroundColor: building.color }]} />
                    <Text style={styles.dropdownText}>{building.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          <View style={styles.rowContainer}>
            <View style={[styles.pickerContainer, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.label}>Floor *</Text>
              <TouchableOpacity
                style={[styles.pickerButton, !selectedBuilding && styles.pickerDisabled]}
                onPress={() => {
                  if (!selectedBuilding) return;
                  setShowFloorPicker(!showFloorPicker);
                  setShowBuildingPicker(false);
                }}
                disabled={!selectedBuilding}
              >
                <Text style={[styles.pickerText, !selectedFloor && styles.placeholderText]}>
                  {selectedFloor || 'Select'}
                </Text>
                <ChevronDown size={20} color="#6B7280" />
              </TouchableOpacity>
              {showFloorPicker && (
                <View style={styles.dropdownMenu}>
                  {availableFloors.map(floor => (
                    <TouchableOpacity
                      key={floor}
                      style={[
                        styles.dropdownItem,
                        selectedFloor === floor && styles.dropdownItemSelected
                      ]}
                      onPress={() => {
                        setSelectedFloor(floor);
                        setShowFloorPicker(false);
                      }}
                    >
                      <Text style={styles.dropdownText}>{floor} Floor</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            <View style={[styles.pickerContainer, { flex: 1 }]}>
              <Text style={styles.label}>Section</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter section (optional)"
                placeholderTextColor="#9CA3AF"
                value={selectedSection}
                onChangeText={setSelectedSection}
                editable={!!selectedFloor}
              />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>What is happening?</Text>
          <View style={styles.incidentGrid}>
            {INCIDENT_TYPES.map(type => {
              const Icon = type.icon;
              const isSelected = selectedType === type.id;
              return (
                <TouchableOpacity
                  key={type.id}
                  style={[
                    styles.incidentChip,
                    isSelected && styles.incidentChipSelected,
                  ]}
                  onPress={() => setSelectedType(type.id)}
                >
                  <Icon size={24} color={isSelected ? '#FFFFFF' : '#6B7280'} />
                  <Text style={[
                    styles.incidentLabel,
                    isSelected && styles.incidentLabelSelected,
                  ]}>
                    {type.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Brief Description *</Text>
          <TextInput
            style={styles.textarea}
            placeholder="Describe what's happening (e.g., 'Two students fighting near the stairs')"
            placeholderTextColor="#9CA3AF"
            multiline
            numberOfLines={3}
            value={description}
            onChangeText={setDescription}
            maxLength={200}
            textAlignVertical="top"
          />
          <Text style={styles.charCount}>{description.length}/200</Text>
        </View>

        <TouchableOpacity
          style={[styles.submitButton, isCreating && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={isCreating}
        >
          <AlertTriangle size={20} color="#FFFFFF" />
          <Text style={styles.submitButtonText}>
            {isCreating ? 'Sending Alert...' : 'SEND EMERGENCY ALERT'}
          </Text>
        </TouchableOpacity>

        <Text style={styles.disclaimer}>
          This alert will be immediately sent to all teachers, the principal, and guidance counselors. 
          Only use for real emergencies happening right now.
        </Text>
      </ScrollView>
      </KeyboardAvoidingView>

      {showSuccess && (
        <View style={styles.successOverlay}>
          <View style={styles.successBox}>
            <Text style={styles.successEmoji}>✓</Text>
            <Text style={styles.successTitle}>Alert Sent!</Text>
            <Text style={styles.successMessage}>Your live incident report has been sent to all available staff members. Help is on the way.</Text>
            <TouchableOpacity
              style={styles.successButton}
              onPress={handleSuccessClose}
            >
              <Text style={styles.successButtonText}>Got It</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FEF2F2',
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DC2626',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  warningText: {
    flex: 1,
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: 'bold' as const,
    color: '#FFFFFF',
  },
  warningSubtitle: {
    fontSize: 12,
    color: '#FEE2E2',
    marginTop: 2,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#111827',
    marginBottom: 12,
  },
  pickerContainer: {
    marginBottom: 12,
    zIndex: 10,
  },
  label: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#374151',
    marginBottom: 6,
  },
  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  pickerDisabled: {
    opacity: 0.5,
  },
  pickerText: {
    fontSize: 15,
    color: '#111827',
    fontWeight: '500' as const,
  },
  placeholderText: {
    color: '#9CA3AF',
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    fontSize: 15,
    color: '#111827',
  },
  rowContainer: {
    flexDirection: 'row',
    zIndex: 5,
  },
  dropdownMenu: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginTop: 4,
    maxHeight: 200,
    zIndex: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    gap: 10,
  },
  dropdownItemSelected: {
    backgroundColor: '#FEF2F2',
  },
  dropdownText: {
    fontSize: 15,
    color: '#374151',
  },
  buildingDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  incidentGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  incidentChip: {
    width: '48%',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    gap: 8,
  },
  incidentChipSelected: {
    backgroundColor: '#DC2626',
    borderColor: '#DC2626',
  },
  incidentLabel: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#374151',
    textAlign: 'center',
  },
  incidentLabelSelected: {
    color: '#FFFFFF',
  },
  textarea: {
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#111827',
    minHeight: 80,
  },
  charCount: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 6,
    textAlign: 'right',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#DC2626',
    borderRadius: 12,
    paddingVertical: 18,
    gap: 10,
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold' as const,
    letterSpacing: 0.5,
  },
  disclaimer: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
    lineHeight: 18,
    paddingHorizontal: 16,
  },
  successOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  successBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingVertical: 40,
    paddingHorizontal: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  successEmoji: {
    fontSize: 60,
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#111827',
    marginBottom: 8,
  },
  successMessage: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 16,
  },
  successButton: {
    backgroundColor: '#DC2626',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 24,
    minWidth: 120,
  },
  successButtonText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#FFFFFF',
    textAlign: 'center',
  },
});
