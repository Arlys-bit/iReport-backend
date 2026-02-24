import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import React, { useState, useEffect, useCallback } from 'react';
import { LiveIncident, LiveIncidentResponder, UserRole } from '@/types';
import apiClient from '@/services/apiClient';

const STORAGE_KEY = 'school_live_incidents';

export const [LiveReportsProvider, useLiveReports] = createContextHook(() => {
  const [incidents, setIncidents] = useState<LiveIncident[]>([]);
  const queryClient = useQueryClient();

  const incidentsQuery = useQuery({
    queryKey: ['liveIncidents'],
    queryFn: async () => {
      try {
        // Fetch from backend API
        const response = await apiClient.get('/api/reports');
        if (response.data?.data && Array.isArray(response.data.data)) {
          return response.data.data;
        }
      } catch (error) {
        console.error('Error fetching reports from backend:', error);
        throw error;
      }
    },
    refetchInterval: 5000, // Refetch every 5 seconds to sync reports
  });

  useEffect(() => {
    if (incidentsQuery.data) {
      setIncidents(incidentsQuery.data);
    }
  }, [incidentsQuery.data]);

  const saveIncidents = async (updated: LiveIncident[]) => {
    setIncidents(updated);
    queryClient.invalidateQueries({ queryKey: ['liveIncidents'] });
  };

  const createIncidentMutation = useMutation({
    mutationFn: async (data: {
      reporterId: string;
      reporterName: string;
      reporterGradeLevelId: string;
      reporterSectionId: string;
      buildingId: string;
      buildingName: string;
      floor: string;
      room: string;
      incidentType: string;
      description: string;
    }) => {
      try {
        // Post to backend API
        const response = await apiClient.post('/api/reports', {
          ...data,
          status: 'pending',
        });

        if (response.data?.data) {
          const newIncident: LiveIncident = {
            id: response.data.data.id,
            ...data,
            status: 'active',
            responders: [],
            createdAt: response.data.data.createdAt,
          };

          const updated = [newIncident, ...incidents];
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
          setIncidents(updated);
          queryClient.invalidateQueries({ queryKey: ['liveIncidents'] });
          
          return newIncident;
        }
        throw new Error('Failed to create incident');
      } catch (error) {
        console.error('Error creating incident:', error);
        // Fallback: create locally if backend fails
        const newIncident: LiveIncident = {
          id: `live_${Date.now()}`,
          ...data,
          status: 'active',
          responders: [],
          createdAt: new Date().toISOString(),
        };

        const updated = [newIncident, ...incidents];
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        setIncidents(updated);
        queryClient.invalidateQueries({ queryKey: ['liveIncidents'] });
        
        return newIncident;
      }
    },
  });

  const respondToIncidentMutation = useMutation({
    mutationFn: async ({
      incidentId,
      userId,
      userName,
      userRole,
    }: {
      incidentId: string;
      userId: string;
      userName: string;
      userRole: UserRole;
    }) => {
      const index = incidents.findIndex(i => i.id === incidentId);
      if (index === -1) throw new Error('Incident not found');

      const incident = incidents[index];
      const alreadyResponding = incident.responders.some(r => r.userId === userId);
      
      if (alreadyResponding) {
        throw new Error('Already responding to this incident');
      }

      const responder: LiveIncidentResponder = {
        id: `resp_${Date.now()}`,
        userId,
        userName,
        userRole,
        respondedAt: new Date().toISOString(),
      };

      const updatedIncident: LiveIncident = {
        ...incident,
        status: 'responding',
        responders: [...incident.responders, responder],
      };

      const updated = [...incidents];
      updated[index] = updatedIncident;
      await saveIncidents(updated);
      return updatedIncident;
    },
  });

  const resolveIncidentMutation = useMutation({
    mutationFn: async ({
      incidentId,
      resolvedBy,
      resolvedByName,
    }: {
      incidentId: string;
      resolvedBy: string;
      resolvedByName: string;
    }) => {
      const index = incidents.findIndex(i => i.id === incidentId);
      if (index === -1) throw new Error('Incident not found');

      const updatedIncident: LiveIncident = {
        ...incidents[index],
        status: 'resolved',
        resolvedAt: new Date().toISOString(),
        resolvedBy,
        resolvedByName,
      };

      const updated = [...incidents];
      updated[index] = updatedIncident;
      await saveIncidents(updated);
      return updatedIncident;
    },
  });

  const removeResponderMutation = useMutation({
    mutationFn: async ({
      incidentId,
      userId,
    }: {
      incidentId: string;
      userId: string;
    }) => {
      const index = incidents.findIndex(i => i.id === incidentId);
      if (index === -1) throw new Error('Incident not found');

      const incident = incidents[index];
      const updatedResponders = incident.responders.filter(r => r.userId !== userId);

      const updatedIncident: LiveIncident = {
        ...incident,
        responders: updatedResponders,
        status: updatedResponders.length === 0 ? 'active' : 'responding',
      };

      const updated = [...incidents];
      updated[index] = updatedIncident;
      await saveIncidents(updated);
      return updatedIncident;
    },
  });

  const getActiveIncidents = useCallback(() => {
    return incidents.filter(i => i.status !== 'resolved');
  }, [incidents]);

  const getIncidentsByBuilding = useCallback((buildingId: string) => {
    return incidents.filter(i => i.buildingId === buildingId && i.status !== 'resolved');
  }, [incidents]);

  const getIncidentsByLocation = useCallback((buildingId: string, floor: string) => {
    return incidents.filter(
      i => i.buildingId === buildingId && i.floor === floor && i.status !== 'resolved'
    );
  }, [incidents]);

  const isUserResponding = useCallback((incidentId: string, userId: string) => {
    const incident = incidents.find(i => i.id === incidentId);
    return incident?.responders.some(r => r.userId === userId) ?? false;
  }, [incidents]);

  const getRespondersCount = useCallback((incidentId: string) => {
    const incident = incidents.find(i => i.id === incidentId);
    return incident?.responders.length ?? 0;
  }, [incidents]);

  return {
    incidents,
    activeIncidents: getActiveIncidents(),
    isLoading: incidentsQuery.isLoading,
    
    createIncident: createIncidentMutation.mutateAsync,
    respondToIncident: respondToIncidentMutation.mutateAsync,
    resolveIncident: resolveIncidentMutation.mutateAsync,
    removeResponder: removeResponderMutation.mutateAsync,
    
    isCreating: createIncidentMutation.isPending,
    isResponding: respondToIncidentMutation.isPending,
    isResolving: resolveIncidentMutation.isPending,
    
    getActiveIncidents,
    getIncidentsByBuilding,
    getIncidentsByLocation,
    isUserResponding,
    getRespondersCount,
  };
});
