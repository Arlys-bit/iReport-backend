import { Stack } from 'expo-router';
import React from 'react';

export default function StudentReportsLayout() {
  return (
    <Stack screenOptions={{ headerBackTitle: 'Back' }}>
      <Stack.Screen
        name="index"
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="[id]"
        options={{ title: 'Report Details' }}
      />
    </Stack>
  );
}
