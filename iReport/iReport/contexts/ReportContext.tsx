import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { IncidentReport, ReportStatus, ReportReviewHistory, Notification } from '@/types';
import apiClient from '@/services/apiClient';

const STORAGE_KEYS = {
  REPORTS: 'school_reports',
  NOTIFICATIONS: 'school_notifications',
};

export const [ReportsProvider, useReports] = createContextHook(() => {
  const queryClient = useQueryClient();

  const reportsQuery = useQuery({
    queryKey: ['reports'],
    queryFn: async () => {
      try {
        // Fetch from backend API
        const response = await apiClient.get('/api/reports');
        if (response.data?.data && Array.isArray(response.data.data)) {
          // Cache to AsyncStorage
          await AsyncStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(response.data.data));
          return response.data.data;
        }
      } catch (error) {
        console.error('Error fetching reports from backend:', error);
      }
      
      // Fallback to local storage
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.REPORTS);
      return stored ? JSON.parse(stored) : [];
    },
    refetchInterval: 5000, // Sync with backend every 5 seconds
  });

  const notificationsQuery = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
      return stored ? JSON.parse(stored) : [];
    },
  });

  const saveReportsMutation = useMutation({
    mutationFn: async (reports: IncidentReport[]) => {
      await AsyncStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(reports));
      return reports;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    },
  });

  const saveNotificationsMutation = useMutation({
    mutationFn: async (notifications: Notification[]) => {
      await AsyncStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifications));
      return notifications;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const createReportMutation = useMutation({
    mutationFn: async (report: Omit<IncidentReport, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'priority' | 'reviewHistory'>) => {
      let newReport: IncidentReport;
      try {
        console.log('📝 Creating report:', report);
        
        const priority = report.incidentType === 'physical_assault' || report.incidentType === 'fighting' 
          ? 'urgent' 
          : report.incidentType === 'bullying' || report.incidentType === 'harassment'
          ? 'high'
          : 'medium';

        const reviewHistory: ReportReviewHistory[] = [{
          id: `review_${Date.now()}`,
          reviewerId: report.reporterId,
          reviewerName: report.reporterName,
          action: 'submitted',
          timestamp: new Date().toISOString(),
        }];

        // Post to backend API
        try {
          const response = await apiClient.post('/api/reports', {
            ...report,
            status: 'under_review',
          });

          if (response.data?.data) {
            newReport = {
              id: response.data.data.id,
              ...report,
              status: 'under_review',
              priority,
              reviewHistory,
              createdAt: response.data.data.createdAt,
              updatedAt: response.data.data.updatedAt,
            };
          } else {
            throw new Error('No response data');
          }
        } catch (apiError) {
          console.error('Backend API error:', apiError);
          // Fallback: create locally
          newReport = {
            ...report,
            id: `report_${Date.now()}`,
            status: 'under_review',
            priority,
            reviewHistory,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
        }

        const reports: IncidentReport[] = reportsQuery.data || [];
        const updatedReports = [...reports, newReport];
        await AsyncStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(updatedReports));
        queryClient.invalidateQueries({ queryKey: ['reports'] });
        console.log('✅ Report created successfully:', newReport);
      } catch (error) {
        console.error('❌ Error creating report:', error);
        throw error;
      }

      if (report.assignedTeacherId) {
        await createNotification({
          userId: report.assignedTeacherId,
          title: 'New Report Submitted',
          message: `A student from your class has submitted a new ${report.incidentType} report.`,
          type: 'report',
          relatedId: newReport.id,
        });
      }

      return newReport;
    },
  });

  const updateReportStatusMutation = useMutation({
    mutationFn: async ({ 
      reportId, 
      status, 
      reviewerId,
      reviewerName,
      notes,
      declineReason,
    }: { 
      reportId: string; 
      status: ReportStatus;
      reviewerId: string;
      reviewerName: string;
      notes?: string;
      declineReason?: string;
    }) => {
      const reports: IncidentReport[] = reportsQuery.data || [];
      const index = reports.findIndex(r => r.id === reportId);
      
      if (index === -1) {
        throw new Error('Report not found');
      }

      const reviewEntry: ReportReviewHistory = {
        id: `review_${Date.now()}`,
        reviewerId,
        reviewerName,
        action: status === 'accepted' ? 'accepted' : status === 'declined' ? 'declined' : 'reviewed',
        notes,
        timestamp: new Date().toISOString(),
      };

      const updatedReports = [...reports];
      updatedReports[index] = {
        ...updatedReports[index],
        status,
        reviewHistory: [...updatedReports[index].reviewHistory, reviewEntry],
        adminNotes: notes || updatedReports[index].adminNotes,
        declineReason: declineReason || updatedReports[index].declineReason,
        reviewedAt: new Date().toISOString(),
        reviewedBy: reviewerId,
        updatedAt: new Date().toISOString(),
      };

      await saveReportsMutation.mutateAsync(updatedReports);

      await createNotification({
        userId: updatedReports[index].reporterId,
        title: `Report ${status === 'accepted' ? 'Accepted' : status === 'declined' ? 'Declined' : 'Updated'}`,
        message: status === 'accepted' 
          ? 'Your report has been accepted and is being processed.'
          : status === 'declined'
          ? `Your report has been declined. ${declineReason || ''}`
          : 'Your report status has been updated.',
        type: 'report',
        relatedId: reportId,
      });

      return updatedReports[index];
    },
  });

  const addReviewNoteMutation = useMutation({
    mutationFn: async ({
      reportId,
      reviewerId,
      reviewerName,
      notes,
    }: {
      reportId: string;
      reviewerId: string;
      reviewerName: string;
      notes: string;
    }) => {
      const reports: IncidentReport[] = reportsQuery.data || [];
      const index = reports.findIndex(r => r.id === reportId);
      
      if (index === -1) {
        throw new Error('Report not found');
      }

      const reviewEntry: ReportReviewHistory = {
        id: `review_${Date.now()}`,
        reviewerId,
        reviewerName,
        action: 'note_added',
        notes,
        timestamp: new Date().toISOString(),
      };

      const updatedReports = [...reports];
      updatedReports[index] = {
        ...updatedReports[index],
        reviewHistory: [...updatedReports[index].reviewHistory, reviewEntry],
        updatedAt: new Date().toISOString(),
      };

      await saveReportsMutation.mutateAsync(updatedReports);
      return updatedReports[index];
    },
  });

  const createNotification = async (data: Omit<Notification, 'id' | 'isRead' | 'createdAt'>) => {
    const notifications: Notification[] = notificationsQuery.data || [];
    
    const newNotification: Notification = {
      ...data,
      id: `notif_${Date.now()}`,
      isRead: false,
      createdAt: new Date().toISOString(),
    };

    const updated = [newNotification, ...notifications];
    await saveNotificationsMutation.mutateAsync(updated);
    return newNotification;
  };

  const markNotificationReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const notifications: Notification[] = notificationsQuery.data || [];
      const updated = notifications.map(n => 
        n.id === notificationId ? { ...n, isRead: true } : n
      );
      await saveNotificationsMutation.mutateAsync(updated);
      return true;
    },
  });

  const getReportsByTeacher = (teacherId: string) => {
    const reports: IncidentReport[] = reportsQuery.data || [];
    return reports.filter(r => r.assignedTeacherId === teacherId);
  };

  const getReportsByStudent = (studentId: string) => {
    const reports: IncidentReport[] = reportsQuery.data || [];
    return reports.filter(r => r.reporterId === studentId);
  };

  const getPendingReports = () => {
    const reports: IncidentReport[] = reportsQuery.data || [];
    return reports.filter(r => r.status === 'under_review');
  };

  const getOverdueReports = () => {
    const reports: IncidentReport[] = reportsQuery.data || [];
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    
    return reports.filter(r => 
      r.status === 'under_review' && 
      new Date(r.createdAt) < threeDaysAgo
    );
  };

  const getUserNotifications = (userId: string) => {
    const notifications: Notification[] = notificationsQuery.data || [];
    return notifications.filter(n => n.userId === userId);
  };

  const getUnreadNotificationCount = (userId: string) => {
    const notifications: Notification[] = notificationsQuery.data || [];
    return notifications.filter(n => n.userId === userId && !n.isRead).length;
  };

  return {
    reports: (reportsQuery.data || []) as IncidentReport[],
    notifications: (notificationsQuery.data || []) as Notification[],
    isLoading: reportsQuery.isLoading || notificationsQuery.isLoading,
    
    createReport: createReportMutation.mutateAsync,
    updateReportStatus: updateReportStatusMutation.mutateAsync,
    addReviewNote: addReviewNoteMutation.mutateAsync,
    markNotificationRead: markNotificationReadMutation.mutate,
    
    getReportsByTeacher,
    getReportsByStudent,
    getPendingReports,
    getOverdueReports,
    getUserNotifications,
    getUnreadNotificationCount,
    
    isCreatingReport: createReportMutation.isPending,
    isUpdatingStatus: updateReportStatusMutation.isPending,
  };
});
