import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Dimensions, Modal, TextInput, Alert, Animated } from 'react-native';
import { Stack, router } from 'expo-router';
import { useReports } from '@/contexts/ReportsContext';
import { useAuth } from '@/contexts/AuthContext';
import { useBuildings, DynamicBuilding } from '@/contexts/BuildingsContext';
import { useLiveReports } from '@/contexts/LiveReportsContext';
import { useSettings } from '@/contexts/SettingsContext';
import { useState, useMemo, useEffect, useRef } from 'react';
import { MapPin, Plus, X, Edit2, Trash2, Building, ChevronDown, Check, AlertTriangle, Radio } from 'lucide-react-native';
import type { ReportStatus, StaffMember, LiveIncident } from '@/types';
import { canManageBuildings } from '@/types';

const { width } = Dimensions.get('window');

interface NewBuildingForm {
  name: string;
  floors: number;
  color: string;
}

function PulsingDot({ color, size = 14 }: { color: string; size?: number }) {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.8,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(opacityAnim, {
            toValue: 0,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnim, {
            toValue: 0.8,
            duration: 800,
            useNativeDriver: true,
          }),
        ]),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [pulseAnim, opacityAnim]);

  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      <Animated.View
        style={{
          position: 'absolute',
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
          transform: [{ scale: pulseAnim }],
          opacity: opacityAnim,
        }}
      />
      <View
        style={{
          width: size * 0.6,
          height: size * 0.6,
          borderRadius: size * 0.3,
          backgroundColor: color,
          borderWidth: 2,
          borderColor: '#FFFFFF',
        }}
      />
    </View>
  );
}

export default function MapScreen() {
  const { colors, isDark } = useSettings();
  const { reports } = useReports();
  const { currentUser } = useAuth();
  const buildingsCtx = useBuildings();
  const buildings = buildingsCtx?.buildings ?? [];
  const activeBuildings = buildingsCtx?.activeBuildings ?? [];
  const addBuilding = buildingsCtx?.addBuilding;
  const updateBuilding = buildingsCtx?.updateBuilding;
  const deleteBuilding = buildingsCtx?.deleteBuilding;
  const isAdding = buildingsCtx?.isAdding ?? false;
  const availableColors = buildingsCtx?.availableColors ?? [];
  const getFloorLabel = buildingsCtx?.getFloorLabel ?? ((n: number) => `${n}`);

  const liveReports = useLiveReports();
  const activeIncidents = liveReports?.activeIncidents ?? [];
  const getIncidentsByLocation = liveReports?.getIncidentsByLocation ?? (() => []);
  
  const [selectedReport, setSelectedReport] = useState<string | null>(null);
  const [selectedLiveIncident, setSelectedLiveIncident] = useState<LiveIncident | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingBuilding, setEditingBuilding] = useState<DynamicBuilding | null>(null);
  const [showColorPicker, setShowColorPicker] = useState(false);
  
  const [newBuilding, setNewBuilding] = useState<NewBuildingForm>({
    name: '',
    floors: 2,
    color: '#3B82F6',
  });

  const staffUser = currentUser as StaffMember | null;
  const canManage = canManageBuildings(staffUser);

  const buildingWidth = useMemo(() => {
    const availableWidth = width - 64 - 24;
    return Math.floor((availableWidth - 12) / 2);
  }, []);

  const activeReports = useMemo(() => 
    reports.filter(r => r.status === 'under_review' || r.status === 'accepted'),
    [reports]
  );

  const getReportColor = (status: ReportStatus) => {
    switch (status) {
      case 'under_review': return '#DC2626';
      case 'accepted': return '#F59E0B';
      case 'declined': return '#6B7280';
      default: return '#10B981';
    }
  };

  const getReportsForLocation = (buildingId: string, floor: string) => {
    return activeReports.filter(r => 
      r.location.building === buildingId && r.location.floor === floor
    );
  };

  const getLiveIncidentsForLocation = (buildingId: string, floor: string) => {
    return getIncidentsByLocation(buildingId, floor);
  };

  const handleAddBuilding = () => {
    if (!newBuilding.name.trim()) {
      Alert.alert('Error', 'Please enter a building name');
      return;
    }
    
    console.log('Adding new building:', newBuilding);
    
    addBuilding({
      name: newBuilding.name.trim(),
      floors: newBuilding.floors,
      color: newBuilding.color,
      isActive: true,
    });
    
    setNewBuilding({ name: '', floors: 2, color: '#3B82F6' });
    setShowAddModal(false);
  };

  const handleEditBuilding = () => {
    if (!editingBuilding) return;
    
    console.log('Updating building:', editingBuilding);
    
    updateBuilding({
      id: editingBuilding.id,
      updates: {
        name: editingBuilding.name,
        floors: editingBuilding.floors,
        color: editingBuilding.color,
        isActive: editingBuilding.isActive,
      }
    });
    
    setEditingBuilding(null);
    setShowEditModal(false);
  };

  const handleDeleteBuilding = (building: DynamicBuilding) => {
    Alert.alert(
      'Delete Building',
      `Are you sure you want to delete "${building.name}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => {
            console.log('Deleting building:', building.id);
            deleteBuilding(building.id);
          }
        }
      ]
    );
  };

  const openEditModal = (building: DynamicBuilding) => {
    setEditingBuilding({ ...building });
    setShowEditModal(true);
  };

  const renderColorPicker = (selectedColor: string, onSelect: (color: string) => void) => (
    <View style={styles.colorPickerContainer}>
      <Text style={styles.inputLabel}>Building Color</Text>
      <TouchableOpacity 
        style={[styles.colorPreview, { backgroundColor: selectedColor }]}
        onPress={() => setShowColorPicker(!showColorPicker)}
      >
        <Text style={styles.colorPreviewText}>Tap to change</Text>
        <ChevronDown size={16} color="#FFFFFF" />
      </TouchableOpacity>
      
      {showColorPicker && (
        <View style={styles.colorGrid}>
          {availableColors.map((color) => (
            <TouchableOpacity
              key={color}
              style={[
                styles.colorOption,
                { backgroundColor: color },
                selectedColor === color && styles.colorOptionSelected
              ]}
              onPress={() => {
                onSelect(color);
                setShowColorPicker(false);
              }}
            >
              {selectedColor === color && <Check size={16} color="#FFFFFF" />}
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );

  const renderFloorSelector = (floors: number, onSelect: (floors: number) => void) => (
    <View style={styles.floorSelectorContainer}>
      <Text style={styles.inputLabel}>Number of Floors</Text>
      <View style={styles.floorButtons}>
        {[1, 2, 3, 4, 5, 6].map((num) => (
          <TouchableOpacity
            key={num}
            style={[
              styles.floorButton,
              floors === num && styles.floorButtonSelected
            ]}
            onPress={() => onSelect(num)}
          >
            <Text style={[
              styles.floorButtonText,
              floors === num && styles.floorButtonTextSelected
            ]}>
              {num}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ title: 'School Map', headerShown: true }} />
      
      {activeIncidents.length > 0 && (
        <TouchableOpacity 
          style={styles.liveAlertBanner}
          onPress={() => router.push('/admin/live')}
        >
          <View style={styles.liveAlertIcon}>
            <Radio size={18} color="#FFFFFF" />
          </View>
          <View style={styles.liveAlertContent}>
            <Text style={styles.liveAlertTitle}>
              {activeIncidents.length} Live Incident{activeIncidents.length > 1 ? 's' : ''}
            </Text>
            <Text style={styles.liveAlertSubtitle}>Tap to view and respond</Text>
          </View>
          <AlertTriangle size={20} color="#FFFFFF" />
        </TouchableOpacity>
      )}

      <View style={[styles.legend, { backgroundColor: colors.surface }]}>
        <View style={styles.legendItem}>
          <PulsingDot color="#DC2626" size={12} />
          <Text style={[styles.legendText, { color: colors.text }]}>Live Alert</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#F59E0B' }]} />
          <Text style={[styles.legendText, { color: colors.text }]}>Report</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#10B981' }]} />
          <Text style={[styles.legendText, { color: colors.text }]}>Resolved</Text>
        </View>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        {canManage && (
          <View style={[styles.managementBar, { backgroundColor: colors.surface }]}>
            <View style={styles.managementInfo}>
              <Building size={18} color="#6366F1" />
              <Text style={[styles.managementText, { color: colors.text }]}>
                {buildings.length} Building{buildings.length !== 1 ? 's' : ''}
              </Text>
            </View>
            <TouchableOpacity 
              style={styles.addButton}
              onPress={() => setShowAddModal(true)}
            >
              <Plus size={18} color="#FFFFFF" />
              <Text style={styles.addButtonText}>Add Building</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.mapContainer}>
          <Text style={[styles.mapTitle, { color: colors.text }]}>School Campus Map</Text>
          <Text style={[styles.mapSubtitle, { color: colors.textSecondary }]}>Tap on alerts to view details</Text>

          <View style={styles.buildingsGrid}>
            {activeBuildings.map((building) => (
              <View
                key={building.id}
                style={[styles.buildingWrapper, { width: buildingWidth }]}
              >
                <View style={[styles.building, { borderColor: building.color }]}>
                  <View style={[styles.buildingHeader, { backgroundColor: building.color }]}>
                    <Text style={styles.buildingLabel} numberOfLines={1}>
                      {building.name}
                    </Text>
                    {canManage && (
                      <View style={styles.buildingActions}>
                        <TouchableOpacity 
                          style={styles.buildingActionBtn}
                          onPress={() => openEditModal(building)}
                        >
                          <Edit2 size={12} color="#FFFFFF" />
                        </TouchableOpacity>
                        <TouchableOpacity 
                          style={styles.buildingActionBtn}
                          onPress={() => handleDeleteBuilding(building)}
                        >
                          <Trash2 size={12} color="#FFFFFF" />
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                  
                  {Array.from({ length: building.floors }, (_, i) => {
                    const floorNumber = building.floors - i;
                    const floorLabel = getFloorLabel(floorNumber);
                    const floorReports = getReportsForLocation(building.id, floorLabel);
                    const floorLiveIncidents = getLiveIncidentsForLocation(building.id, floorLabel);
                    
                    return (
                      <View key={i} style={styles.floor}>
                        <Text style={styles.floorLabel}>{floorLabel}</Text>
                        
                        {(floorReports.length > 0 || floorLiveIncidents.length > 0) && (
                          <View style={styles.alertsRow}>
                            {floorLiveIncidents.map((incident) => (
                              <TouchableOpacity
                                key={incident.id}
                                style={styles.liveAlertDotInline}
                                onPress={() => setSelectedLiveIncident(incident)}
                              >
                                <PulsingDot color="#DC2626" size={12} />
                              </TouchableOpacity>
                            ))}
                            {floorReports.map((report) => (
                              <TouchableOpacity
                                key={report.id}
                                style={[
                                  styles.alertDotInline,
                                  { backgroundColor: getReportColor(report.status) }
                                ]}
                                onPress={() => setSelectedReport(report.id)}
                              >
                                {report.priority === 'urgent' && <View style={styles.pulse} />}
                              </TouchableOpacity>
                            ))}
                          </View>
                        )}
                      </View>
                    );
                  })}
                </View>
              </View>
            ))}
            
            {activeBuildings.length === 0 && (
              <View style={styles.emptyMapState}>
                <Building size={48} color="#D1D5DB" />
                <Text style={styles.emptyMapText}>No buildings added yet</Text>
                {canManage && (
                  <TouchableOpacity 
                    style={styles.emptyAddButton}
                    onPress={() => setShowAddModal(true)}
                  >
                    <Plus size={16} color="#6366F1" />
                    <Text style={styles.emptyAddButtonText}>Add First Building</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        </View>

        {activeIncidents.length > 0 && (
          <View style={styles.reportsSection}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>🔴 Live Incidents ({activeIncidents.length})</Text>
              <TouchableOpacity 
                style={styles.viewAllBtn}
                onPress={() => router.push('/admin/live')}
              >
                <Text style={styles.viewAllBtnText}>View All</Text>
              </TouchableOpacity>
            </View>
            
            {activeIncidents.slice(0, 3).map(incident => (
              <TouchableOpacity
                key={incident.id}
                style={[
                  styles.reportCard,
                  styles.liveIncidentCard,
                  { backgroundColor: colors.surface },
                  selectedLiveIncident?.id === incident.id && styles.reportCardSelected
                ]}
                onPress={() => setSelectedLiveIncident(incident)}
              >
                <View style={styles.reportHeader}>
                  <View style={styles.liveIndicator}>
                    <PulsingDot color="#DC2626" size={14} />
                  </View>
                  <Text style={[styles.reportLocation, { color: colors.text }]}>
                    {incident.buildingName} • {incident.floor} Floor {incident.room !== 'N/A' ? `• Room ${incident.room}` : ''}
                  </Text>
                </View>

                <View style={styles.liveTag}>
                  <Radio size={12} color="#DC2626" />
                  <Text style={styles.liveTagText}>LIVE</Text>
                </View>

                <Text style={[styles.reportType, { color: colors.text }]}>{incident.incidentType.replace('_', ' ')}</Text>
                <Text style={[styles.reportDescription, { color: colors.textSecondary }]} numberOfLines={2}>
                  {incident.description}
                </Text>
                
                <View style={styles.reportMeta}>
                  <View style={[
                    styles.respondersBadge,
                    { backgroundColor: incident.responders.length > 0 ? '#DCFCE7' : '#FEE2E2' }
                  ]}>
                    <Text style={[
                      styles.respondersBadgeText,
                      { color: incident.responders.length > 0 ? '#166534' : '#DC2626' }
                    ]}>
                      {incident.responders.length > 0 
                        ? `${incident.responders.length} Responding` 
                        : 'No Response'}
                    </Text>
                  </View>
                  <Text style={[styles.reportTime, { color: colors.textSecondary }]}>
                    {new Date(incident.createdAt).toLocaleTimeString()}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={styles.reportsSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Reports ({activeReports.length})</Text>
          
          {activeReports.map(report => (
            <TouchableOpacity
              key={report.id}
              style={[
                styles.reportCard,
                { backgroundColor: colors.surface },
                selectedReport === report.id && styles.reportCardSelected
              ]}
              onPress={() => setSelectedReport(report.id)}
            >
              <View style={styles.reportHeader}>
                <View style={[styles.locationPin, { backgroundColor: getReportColor(report.status) }]}>
                  <MapPin size={14} color="#FFFFFF" />
                </View>
                <Text style={[styles.reportLocation, { color: colors.text }]}>
                  Building {report.location.building} • {report.location.floor} Floor • {report.location.room}
                </Text>
              </View>

              {report.priority === 'urgent' && (
                <View style={styles.urgentTag}>
                  <Text style={styles.urgentTagText}>🚨 URGENT</Text>
                </View>
              )}

              <Text style={[styles.reportType, { color: colors.text }]}>{report.incidentType}</Text>
              <Text style={[styles.reportDescription, { color: colors.textSecondary }]} numberOfLines={2}>
                {report.description}
              </Text>
              
              <View style={styles.reportMeta}>
                <Text style={[styles.reportStudent, { color: colors.textSecondary }]}>
                  {report.victimName}
                </Text>
                <Text style={[styles.reportTime, { color: colors.textSecondary }]}>
                  {new Date(report.createdAt).toLocaleTimeString()}
                </Text>
              </View>
            </TouchableOpacity>
          ))}

          {activeReports.length === 0 && activeIncidents.length === 0 && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>✓</Text>
              <Text style={[styles.emptyTitle, { color: colors.text }]}>All Clear</Text>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No active incidents at this time</Text>
            </View>
          )}
        </View>

        <Modal
          visible={selectedLiveIncident !== null}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setSelectedLiveIncident(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              {selectedLiveIncident && (
                <>
                  <View style={styles.modalHeader}>
                    <View style={styles.liveModalIndicator}>
                      <Radio size={16} color="#DC2626" />
                      <Text style={styles.liveModalLabel}>LIVE INCIDENT</Text>
                    </View>
                    <TouchableOpacity onPress={() => setSelectedLiveIncident(null)}>
                      <X size={24} color="#6B7280" />
                    </TouchableOpacity>
                  </View>

                  <ScrollView style={styles.modalBody}>
                    <View style={styles.liveDetailSection}>
                      <Text style={styles.liveDetailLabel}>Location</Text>
                      <View style={styles.liveLocationBox}>
                        <MapPin size={20} color="#DC2626" />
                        <View>
                          <Text style={styles.liveLocationPrimary}>
                            {selectedLiveIncident.buildingName}
                          </Text>
                          <Text style={styles.liveLocationSecondary}>
                            {selectedLiveIncident.floor} Floor {selectedLiveIncident.room !== 'N/A' ? `• Room ${selectedLiveIncident.room}` : ''}
                          </Text>
                        </View>
                      </View>
                    </View>

                    <View style={styles.liveDetailSection}>
                      <Text style={styles.liveDetailLabel}>Incident Type</Text>
                      <View style={styles.liveTypeBox}>
                        <Text style={styles.liveTypeText}>
                          {selectedLiveIncident.incidentType.replace('_', ' ').toUpperCase()}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.liveDetailSection}>
                      <Text style={styles.liveDetailLabel}>Description</Text>
                      <Text style={styles.liveDescriptionText}>
                        {selectedLiveIncident.description}
                      </Text>
                    </View>

                    <View style={styles.liveDetailSection}>
                      <Text style={styles.liveDetailLabel}>Reported By</Text>
                      <Text style={styles.liveReporterText}>
                        {selectedLiveIncident.reporterName}
                      </Text>
                    </View>

                    <View style={styles.liveDetailSection}>
                      <Text style={styles.liveDetailLabel}>Time</Text>
                      <Text style={styles.liveTimeText}>
                        {new Date(selectedLiveIncident.createdAt).toLocaleString()}
                      </Text>
                    </View>

                    <View style={styles.liveDetailSection}>
                      <Text style={styles.liveDetailLabel}>
                        Responders ({selectedLiveIncident.responders.length})
                      </Text>
                      {selectedLiveIncident.responders.length === 0 ? (
                        <Text style={styles.noRespondersText}>No one has responded yet</Text>
                      ) : (
                        selectedLiveIncident.responders.map(responder => (
                          <View key={responder.id} style={styles.responderItem}>
                            <Text style={styles.responderName}>{responder.userName}</Text>
                            <Text style={styles.responderRole}>{responder.userRole}</Text>
                          </View>
                        ))
                      )}
                    </View>
                  </ScrollView>

                  <View style={styles.modalFooter}>
                    <TouchableOpacity
                      style={styles.goToLiveBtn}
                      onPress={() => {
                        setSelectedLiveIncident(null);
                        router.push('/admin/live');
                      }}
                    >
                      <Text style={styles.goToLiveBtnText}>Go to Live View</Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </View>
          </View>
        </Modal>
      </ScrollView>

      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add New Building</Text>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => {
                  setShowAddModal(false);
                  setShowColorPicker(false);
                }}
              >
                <X size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Building Name</Text>
                <TextInput
                  style={styles.textInput}
                  value={newBuilding.name}
                  onChangeText={(text) => setNewBuilding(prev => ({ ...prev, name: text }))}
                  placeholder="e.g., Main Building, Science Hall"
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              {renderFloorSelector(newBuilding.floors, (floors) => 
                setNewBuilding(prev => ({ ...prev, floors }))
              )}

              {renderColorPicker(newBuilding.color, (color) => 
                setNewBuilding(prev => ({ ...prev, color }))
              )}
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => {
                  setShowAddModal(false);
                  setShowColorPicker(false);
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.saveButton, isAdding && styles.saveButtonDisabled]}
                onPress={handleAddBuilding}
                disabled={isAdding}
              >
                <Text style={styles.saveButtonText}>
                  {isAdding ? 'Adding...' : 'Add Building'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showEditModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowEditModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Building</Text>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => {
                  setShowEditModal(false);
                  setEditingBuilding(null);
                  setShowColorPicker(false);
                }}
              >
                <X size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {editingBuilding && (
              <ScrollView style={styles.modalBody}>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Building Name</Text>
                  <TextInput
                    style={styles.textInput}
                    value={editingBuilding.name}
                    onChangeText={(text) => setEditingBuilding(prev => 
                      prev ? { ...prev, name: text } : null
                    )}
                    placeholder="Building name"
                    placeholderTextColor="#9CA3AF"
                  />
                </View>

                {renderFloorSelector(editingBuilding.floors, (floors) => 
                  setEditingBuilding(prev => prev ? { ...prev, floors } : null)
                )}

                {renderColorPicker(editingBuilding.color, (color) => 
                  setEditingBuilding(prev => prev ? { ...prev, color } : null)
                )}

                <View style={styles.toggleContainer}>
                  <Text style={styles.inputLabel}>Building Status</Text>
                  <TouchableOpacity
                    style={[
                      styles.toggleButton,
                      editingBuilding.isActive ? styles.toggleActive : styles.toggleInactive
                    ]}
                    onPress={() => setEditingBuilding(prev => 
                      prev ? { ...prev, isActive: !prev.isActive } : null
                    )}
                  >
                    <Text style={[
                      styles.toggleText,
                      editingBuilding.isActive ? styles.toggleTextActive : styles.toggleTextInactive
                    ]}>
                      {editingBuilding.isActive ? 'Active' : 'Inactive'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            )}

            <View style={styles.modalFooter}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => {
                  setShowEditModal(false);
                  setEditingBuilding(null);
                  setShowColorPicker(false);
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.saveButton}
                onPress={handleEditBuilding}
              >
                <Text style={styles.saveButtonText}>Save Changes</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

            <TouchableOpacity 
              style={styles.mapButton}
              onPress={() => router.push('/admin/live')}
            >
              <View style={styles.mapButtonIcon}>
                <MapPin size={16} color="#6366F1" />
              </View>
              <Text style={styles.mapButtonText}>View Map</Text>
            </TouchableOpacity>
          </View>
        );
      }

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  legend: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    justifyContent: 'center',
    gap: 20,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500' as const,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  managementBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  managementInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  managementText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#374151',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6366F1',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600' as const,
  },
  mapContainer: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  mapTitle: {
    fontSize: 20,
    fontWeight: 'bold' as const,
    color: '#111827',
    marginBottom: 4,
  },
  mapSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 20,
  },
  buildingsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 12,
    gap: 12,
    minHeight: 200,
  },
  buildingWrapper: {
    flexShrink: 0,
  },
  building: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 2,
    overflow: 'hidden',
    width: '100%',
  },
  buildingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  buildingLabel: {
    fontSize: 11,
    fontWeight: 'bold' as const,
    color: '#FFFFFF',
    flex: 1,
  },
  buildingActions: {
    flexDirection: 'row',
    gap: 4,
  },
  buildingActionBtn: {
    padding: 4,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  floor: {
    minHeight: 28,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 6,
  },
  floorLabel: {
    fontSize: 10,
    color: '#6B7280',
    fontWeight: '600' as const,
  },
  alertsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginLeft: 'auto',
  },
  alertDotInline: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  liveAlertDotInline: {
    marginRight: 2,
  },
  pulse: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(220, 38, 38, 0.5)',
  },
  emptyMapState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyMapText: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 12,
    marginBottom: 16,
  },
  emptyAddButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  emptyAddButtonText: {
    color: '#6366F1',
    fontSize: 14,
    fontWeight: '600' as const,
  },
  reportsSection: {
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold' as const,
    color: '#111827',
    marginBottom: 12,
  },
  reportCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  reportCardSelected: {
    borderColor: '#DC2626',
    backgroundColor: '#FEF2F2',
  },
  reportHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  locationPin: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reportLocation: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '600' as const,
    flex: 1,
  },
  urgentTag: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  urgentTagText: {
    fontSize: 11,
    fontWeight: 'bold' as const,
    color: '#DC2626',
  },
  reportType: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#111827',
    marginBottom: 4,
  },
  reportDescription: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
    marginBottom: 8,
  },
  reportMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  reportStudent: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500' as const,
  },
  reportTime: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#10B981',
    marginBottom: 4,
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
  },
  liveAlertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DC2626',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  liveAlertIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  liveAlertContent: {
    flex: 1,
  },
  liveAlertTitle: {
    fontSize: 15,
    fontWeight: 'bold' as const,
    color: '#FFFFFF',
  },
  liveAlertSubtitle: {
    fontSize: 12,
    color: '#FEE2E2',
    marginTop: 2,
  },

  liveIncidentCard: {
    borderColor: '#FECACA',
    borderWidth: 2,
  },
  liveIndicator: {
    marginRight: 8,
  },
  liveTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 8,
    gap: 4,
  },
  liveTagText: {
    fontSize: 11,
    fontWeight: 'bold' as const,
    color: '#DC2626',
  },
  respondersBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  respondersBadgeText: {
    fontSize: 12,
    fontWeight: '600' as const,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  viewAllBtn: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  viewAllBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600' as const,
  },
  liveModalIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  liveModalLabel: {
    fontSize: 14,
    fontWeight: 'bold' as const,
    color: '#DC2626',
    letterSpacing: 1,
  },
  liveDetailSection: {
    marginBottom: 20,
  },
  liveDetailLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#6B7280',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  liveLocationBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    padding: 12,
    borderRadius: 10,
    gap: 12,
  },
  liveLocationPrimary: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#111827',
  },
  liveLocationSecondary: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  liveTypeBox: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  liveTypeText: {
    fontSize: 14,
    fontWeight: 'bold' as const,
    color: '#DC2626',
  },
  liveDescriptionText: {
    fontSize: 15,
    color: '#374151',
    lineHeight: 22,
  },
  liveReporterText: {
    fontSize: 15,
    color: '#374151',
    fontWeight: '500' as const,
  },
  liveTimeText: {
    fontSize: 15,
    color: '#374151',
  },
  noRespondersText: {
    fontSize: 14,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
  responderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  responderName: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#111827',
  },
  responderRole: {
    fontSize: 12,
    color: '#6B7280',
    textTransform: 'capitalize',
  },
  goToLiveBtn: {
    backgroundColor: '#DC2626',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  goToLiveBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600' as const,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold' as const,
    color: '#111827',
  },
  closeButton: {
    padding: 4,
  },
  modalBody: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#374151',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111827',
  },
  floorSelectorContainer: {
    marginBottom: 20,
  },
  floorButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  floorButton: {
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  floorButtonSelected: {
    backgroundColor: '#EEF2FF',
    borderColor: '#6366F1',
  },
  floorButtonText: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#6B7280',
  },
  floorButtonTextSelected: {
    color: '#6366F1',
  },
  colorPickerContainer: {
    marginBottom: 20,
  },
  colorPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 10,
    gap: 8,
  },
  colorPreviewText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600' as const,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 12,
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
  },
  colorOption: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorOptionSelected: {
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  toggleContainer: {
    marginBottom: 20,
  },
  toggleButton: {
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  toggleActive: {
    backgroundColor: '#DCFCE7',
  },
  toggleInactive: {
    backgroundColor: '#FEE2E2',
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  toggleTextActive: {
    color: '#16A34A',
  },
  toggleTextInactive: {
    color: '#DC2626',
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#6B7280',
  },
  saveButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: '#6366F1',
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: '#A5B4FC',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
   mapButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6366F1',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 30,
    gap: 8,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  mapButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600' as const,
  },
  mapButtonIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
});
