import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useSettings } from '@/contexts/SettingsContext';

export default function DashboardLayout() {
  const { colors } = useSettings();
  const GridItem = ({ text, row }: { text: string; row?: number }) => (
    <View style={[styles.gridItem, { borderColor: colors.border }]}>
      <Text style={[styles.gridText, { color: colors.text }]}>{text}</Text>
    </View>
  );

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.parent}>
        <GridItem text="1" />
        <GridItem text="4" />
        <GridItem text="5" row={3} />
        <GridItem text="6" row={3} />
        <GridItem text="7" row={5} />
        <GridItem text="8" row={5} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  parent: {
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    padding: 16,
  },
  gridItem: {
    width: '18%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
  },
  gridText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});