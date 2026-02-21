import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Linking,
  Alert,
  Platform,
} from 'react-native';
import { Stack } from 'expo-router';
import {
  Phone,
  AlertTriangle,
} from 'lucide-react-native';
import { useSettings } from '@/contexts/SettingsContext';

interface Hotline {
  id: string;
  name: string;
  number: string;
  description: string;
  color: string;
  category: 'emergency';
}

const hotlines: Hotline[] = [
  {
    id: '1',
    name: 'Emergency Services',
    number: '911',
    description: 'Police, Fire, Medical Emergency',
    color: '#DC2626',
    category: 'emergency',
  },
  {
    id: '2',
    name: 'Police Department',
    number: '911',
    description: 'Report crimes or suspicious activity',
    color: '#1D4ED8',
    category: 'emergency',
  },
  {
    id: '3',
    name: 'Fire Department',
    number: '911',
    description: 'Fire emergencies and rescue',
    color: '#EA580C',
    category: 'emergency',
  },
];

export default function EmergencyHotlines() {
  const { colors, isDark } = useSettings();
  const handleCall = (hotline: Hotline) => {
    const phoneNumber = hotline.number.replace(/[^0-9+]/g, '');
    const url = `tel:${phoneNumber}`;

    if (Platform.OS === 'web') {
      Alert.alert(
        `Call ${hotline.name}`,
        `Dial: ${hotline.number}`,
        [{ text: 'OK' }]
      );
      return;
    }

    Linking.canOpenURL(url)
      .then((supported) => {
        if (supported) {
          Linking.openURL(url);
        } else {
          Alert.alert(
            'Cannot Make Call',
            `Please dial ${hotline.number} manually.`,
            [{ text: 'OK' }]
          );
        }
      })
      .catch((err) => {
        console.error('Error opening phone dialer:', err);
        Alert.alert('Error', 'Unable to open phone dialer');
      });
  };

  const renderHotlineCard: (hotline: Hotline) => ReactNode = (hotline) => {
    return (
      <TouchableOpacity
        key={hotline.id}
        style={[styles.hotlineCard, { backgroundColor: colors.surface }]}
        onPress={() => handleCall(hotline)}
        activeOpacity={0.7}
      >
        <View style={[styles.iconContainer, { backgroundColor: hotline.color }]}>
          <Phone size={24} color="#FFFFFF" />
        </View>
        <View style={styles.hotlineInfo}>
          <Text style={[styles.hotlineName, { color: colors.text }]}>{hotline.name}</Text>
          <Text style={[styles.hotlineDescription, { color: colors.textSecondary }]}>{hotline.description}</Text>
          <View style={styles.numberRow}>
            <Phone size={14} color={hotline.color} />
            <Text style={[styles.hotlineNumber, { color: hotline.color }]}>
              {hotline.number}
            </Text>
          </View>
        </View>
        <View style={[styles.callButton, { backgroundColor: hotline.color }]}>
          <Phone size={18} color="#FFFFFF" />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ title: 'Emergency Hotlines' }} />
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.warningBanner, { backgroundColor: isDark ? '#7F1D1D' : '#FEE2E2' }]}>
          <AlertTriangle size={20} color={isDark ? '#FCA5A5' : '#DC2626'} />
          <Text style={[styles.warningText, { color: isDark ? '#FCA5A5' : '#DC2626' }]}>
            In case of immediate danger, call 911 first
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Emergency Services</Text>
          <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>For life-threatening situations</Text>
          {hotlines.map((hotline) => renderHotlineCard(hotline))}
        </View>

        <View style={[styles.infoBox, { backgroundColor: isDark ? '#1E3A8A' : '#DBEAFE' }]}>
          <Text style={[styles.infoTitle, { color: isDark ? '#93C5FD' : '#1E40AF' }]}>Remember</Text>
          <Text style={[styles.infoText, { color: isDark ? '#93C5FD' : '#1E40AF' }]}>
            All calls to emergency services are confidential{'\n'}
            Help is always available{'\n'}
            It's okay to ask for help
          </Text>
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 14,
    borderRadius: 12,
    gap: 10,
  },
  warningText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#DC2626',
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 13,
    marginBottom: 14,
  },
  hotlineCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hotlineInfo: {
    flex: 1,
    marginLeft: 14,
  },
  hotlineName: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#000000',
    marginBottom: 2,
  },
  hotlineDescription: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 6,
  },
  numberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  hotlineNumber: {
    fontSize: 14,
    fontWeight: '700' as const,
  },
  callButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  infoBox: {
    margin: 16,
    marginTop: 24,
    padding: 18,
    backgroundColor: '#DBEAFE',
    borderRadius: 14,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#1E40AF',
    marginBottom: 10,
  },
  infoText: {
    fontSize: 14,
    color: '#1E40AF',
    lineHeight: 22,
  },
});
