import { Stack } from 'expo-router';
import React from 'react';

export default function StudentLayout() {
  return (
    <Stack screenOptions={{ headerBackTitle: 'Back' }}>
      <Stack.Screen 
        name="index" 
        options={{ 
          headerShown: false,
        }} 
      />
      <Stack.Screen 
        name="report" 
        options={{ 
          title: 'Submit Report',
          presentation: 'modal',
        }} 
      />
      <Stack.Screen 
        name="reports" 
        options={{ 
          headerShown: false,
        }} 
      />
    </Stack>
  );
}
