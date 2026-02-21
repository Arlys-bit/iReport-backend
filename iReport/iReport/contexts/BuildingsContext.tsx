import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import React, { useState, useEffect, useCallback } from 'react';

export type DynamicBuilding = {
  id: string;
  name: string;
  floors: number;
  color: string;
  isActive: boolean;
};

const STORAGE_KEY = 'school_buildings';

export const [BuildingsProvider, useBuildings] = createContextHook(() => {
  const [buildings, setBuildings] = useState<DynamicBuilding[]>([]);
  const queryClient = useQueryClient();

  const buildingsQuery = useQuery({
    queryKey: ['buildings'],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) as DynamicBuilding[] : [];
    },
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (buildingsQuery.data) setBuildings(buildingsQuery.data);
  }, [buildingsQuery.data]);

  const saveBuildings = async (updated: DynamicBuilding[]) => {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setBuildings(updated);
    queryClient.invalidateQueries({ queryKey: ['buildings'] });
  };

  const addBuildingMutation = useMutation({
    mutationFn: async (data: { name: string; floors: number; color: string; isActive?: boolean }) => {
      const newBuilding: DynamicBuilding = {
        id: `b_${Date.now()}`,
        name: data.name,
        floors: data.floors,
        color: data.color,
        isActive: data.isActive ?? true,
      };
      const updated = [newBuilding, ...buildings];
      await saveBuildings(updated);
      return newBuilding;
    },
  });

  const updateBuildingMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<DynamicBuilding> }) => {
      const index = buildings.findIndex(b => b.id === id);
      if (index === -1) throw new Error('Building not found');
      const updatedBuilding = { ...buildings[index], ...updates } as DynamicBuilding;
      const updated = [...buildings];
      updated[index] = updatedBuilding;
      await saveBuildings(updated);
      return updatedBuilding;
    },
  });

  const deleteBuildingMutation = useMutation({
    mutationFn: async (id: string) => {
      const updated = buildings.filter(b => b.id !== id);
      await saveBuildings(updated);
      return id;
    },
  });

  const getActiveBuildings = useCallback(() => buildings.filter(b => b.isActive), [buildings]);

  const getFloorLabel = useCallback((floorNumber: number) => {
    // simple label: '1st', '2nd', '3rd', etc.
    switch (floorNumber) {
      case 1: return '1st';
      case 2: return '2nd';
      case 3: return '3rd';
      default: return `${floorNumber}th`;
    }
  }, []);

  const getFloorsForBuilding = useCallback((buildingId: string) => {
    const b = buildings.find(x => x.id === buildingId);
    if (!b) return [];
    return Array.from({ length: b.floors }, (_, i) => getFloorLabel(b.floors - i));
  }, [buildings, getFloorLabel]);

  const availableColors = ['#3B82F6', '#6366F1', '#10B981', '#F59E0B', '#DC2626'];

  return {
    buildings,
    activeBuildings: getActiveBuildings(),
    addBuilding: addBuildingMutation.mutateAsync,
    updateBuilding: updateBuildingMutation.mutateAsync,
    deleteBuilding: deleteBuildingMutation.mutateAsync,
    isAdding: addBuildingMutation.isPending,
    availableColors,
    getFloorLabel,
    getFloorsForBuilding,
  };
});
