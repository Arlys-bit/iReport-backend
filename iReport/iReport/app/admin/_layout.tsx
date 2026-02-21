import { Stack } from 'expo-router';
import React from 'react';

export default function AdminLayout() {
  return (
    <Stack screenOptions={{ headerBackTitle: 'Back' }}>
      <Stack.Screen 
        name="index" 
        options={{ 
          headerShown: false,
        }} 
      />
      <Stack.Screen 
        name="management" 
        options={{ 
          title: 'Management',
          headerLargeTitle: true,
        }} 
      />
      <Stack.Screen 
        name="students" 
        options={{ 
          title: 'Manage Students',
          headerLargeTitle: true,
        }} 
      />
      <Stack.Screen 
        name="students/[id]" 
        options={{ 
          title: 'Student Profile',
        }} 
      />
      <Stack.Screen 
        name="reports/index" 
        options={{ 
          title: 'All Reports',
          headerLargeTitle: true,
        }} 
      />
      <Stack.Screen 
        name="reports/[id]" 
        options={{ 
          title: 'Report Details',
        }} 
      />
      <Stack.Screen 
        name="staff" 
        options={{ 
          title: 'Manage Staff',
          headerLargeTitle: true,
        }} 
      />
      <Stack.Screen 
        name="staff/[id]" 
        options={{ 
          title: 'Staff Profile',
        }} 
      />
      <Stack.Screen 
        name="map" 
        options={{ 
          title: 'School Map',
          headerLargeTitle: true,
        }} 
      />
      <Stack.Screen 
        name="live" 
        options={{ 
          title: 'Live Incidents',
        }} 
      />
      <Stack.Screen 
        name="profile" 
        options={{ 
          title: 'My Profile',
        }} 
      />
    </Stack>
  );
}
