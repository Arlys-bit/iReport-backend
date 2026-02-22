import { Stack } from 'expo-router';
import React from 'react';

export default function TeacherLayout() {
  return (
    <Stack screenOptions={{ headerBackTitle: 'Back' }}>
      <Stack.Screen 
        name="index" 
        options={{ 
          headerShown: false,
        }} 
      />
      <Stack.Screen 
        name="profile" 
        options={{ 
          title: 'My Profile',
        }} 
      />
      <Stack.Screen 
        name="students/[id]" 
        options={{ 
          title: 'Student Profile',
        }} 
      />
      <Stack.Screen 
        name="reports/[id]" 
        options={{ 
          title: 'Report Details',
        }} 
      />
    </Stack>
  );
}
