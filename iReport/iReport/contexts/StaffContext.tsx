import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { StaffMember, ActivityLog, StaffPermission, StaffPosition } from '@/types';
import apiClient from '@/services/apiClient';

const STORAGE_KEYS = {
  STAFF: 'school_staff_members',
  ACTIVITY_LOGS: 'school_activity_logs',
};

export const [StaffProvider, useStaff] = createContextHook(() => {
  const queryClient = useQueryClient();

  const staffQuery = useQuery({
    queryKey: ['staffMembers'],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.STAFF);
      return stored ? JSON.parse(stored) : [];
    },
  });

  const activityLogsQuery = useQuery({
    queryKey: ['activityLogs'],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.ACTIVITY_LOGS);
      return stored ? JSON.parse(stored) : [];
    },
  });

  const saveStaffMutation = useMutation({
    mutationFn: async (staff: StaffMember[]) => {
      await AsyncStorage.setItem(STORAGE_KEYS.STAFF, JSON.stringify(staff));
      return staff;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staffMembers'] });
    },
  });

  const saveActivityLogMutation = useMutation({
    mutationFn: async (log: ActivityLog) => {
      const logs: ActivityLog[] = activityLogsQuery.data || [];
      const updatedLogs = [log, ...logs];
      await AsyncStorage.setItem(STORAGE_KEYS.ACTIVITY_LOGS, JSON.stringify(updatedLogs));
      return updatedLogs;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activityLogs'] });
    },
  });

  const getRoleFromPosition = (position: StaffPosition): 'admin' | 'principal' | 'guidance' | 'teacher' => {
    switch (position) {
      case 'principal':
        return 'principal';
      case 'vice_principal':
        return 'admin';
      case 'guidance_counselor':
        return 'guidance';
      default:
        return 'teacher';
    }
  };

  const createStaffMutation = useMutation({
    mutationFn: async (staffData: Omit<StaffMember, 'id' | 'createdAt' | 'isActive' | 'role'>) => {
      console.log('📕 createStaffMutation started with data:', staffData);
      const staff: StaffMember[] = staffQuery.data || [];
      
      // Check for duplicates locally first
      const emailExists = staff.some(s => s.schoolEmail.toLowerCase() === staffData.schoolEmail.toLowerCase());
      if (emailExists) {
        console.log('📕 Email already exists locally');
        throw new Error('Email already exists');
      }

      const staffIdExists = staff.some(s => s.staffId === staffData.staffId);
      if (staffIdExists) {
        console.log('📕 Staff ID already exists locally');
        throw new Error('Staff ID already exists');
      }

      // Create user account on backend
      console.log('📕 Creating user account on backend...');
      const roleMap: Record<StaffPosition, 'teacher' | 'admin' | 'principal'> = {
        'teacher': 'teacher',
        'principal': 'principal',
        'vice_principal': 'admin',
        'guidance_counselor': 'admin',
      };
      
      const registrationResponse = await apiClient.post('/api/auth/register', {
        fullName: staffData.fullName,
        email: staffData.schoolEmail,
        password: staffData.password,
        role: roleMap[staffData.position],
      });

      const userId = registrationResponse.data.data?.user?.id;
      
      if (!userId) {
        throw new Error('Failed to get user ID from backend');
      }

      const newStaff: StaffMember = {
        ...staffData,
        id: userId,
        role: getRoleFromPosition(staffData.position),
        isActive: true,
        createdAt: new Date().toISOString(),
      };

      console.log('📕 Saving new staff locally:', newStaff);
      const updatedStaff = [...staff, newStaff];
      await saveStaffMutation.mutateAsync(updatedStaff);
      
      await saveActivityLogMutation.mutateAsync({
        id: `log_${Date.now()}`,
        staffId: 'system',
        staffName: 'System',
        action: 'created_staff',
        targetType: 'staff',
        targetId: newStaff.id,
        targetName: newStaff.fullName,
        details: `Created ${staffData.position} account`,
        timestamp: new Date().toISOString(),
      });

      console.log('📕 Staff saved successfully');
      return newStaff;
    },
  });

  const updateStaffMutation = useMutation({
    mutationFn: async ({ id, updates, adminId, adminName }: { 
      id: string; 
      updates: Partial<StaffMember>;
      adminId: string;
      adminName: string;
    }) => {
      const staff: StaffMember[] = staffQuery.data || [];
      const index = staff.findIndex(s => s.id === id);
      
      if (index === -1) {
        throw new Error('Staff member not found');
      }

      // If email is being updated, sync it with the backend
      if (updates.email && updates.email !== staff[index].email) {
        try {
          await apiClient.put(`/api/auth/staff/${id}/email`, {
            newEmail: updates.email,
          });
        } catch (backendError) {
          console.warn('Backend email update failed, updating locally:', backendError);
        }
      }

      const updatedStaff = [...staff];
      updatedStaff[index] = { ...updatedStaff[index], ...updates };
      
      await saveStaffMutation.mutateAsync(updatedStaff);

      await saveActivityLogMutation.mutateAsync({
        id: `log_${Date.now()}`,
        staffId: adminId,
        staffName: adminName,
        action: 'updated_staff',
        targetType: 'staff',
        targetId: id,
        targetName: updatedStaff[index].fullName,
        details: `Updated ${Object.keys(updates).join(', ')}`,
        timestamp: new Date().toISOString(),
      });

      return updatedStaff[index];
    },
  });

  const updatePermissionsMutation = useMutation({
    mutationFn: async ({ 
      staffId, 
      permissions,
      adminId,
      adminName 
    }: { 
      staffId: string; 
      permissions: StaffPermission[];
      adminId: string;
      adminName: string;
    }) => {
      const staff: StaffMember[] = staffQuery.data || [];
      const index = staff.findIndex(s => s.id === staffId);
      
      if (index === -1) {
        throw new Error('Staff member not found');
      }

      const updatedStaff = [...staff];
      updatedStaff[index] = { ...updatedStaff[index], permissions };
      
      await saveStaffMutation.mutateAsync(updatedStaff);

      await saveActivityLogMutation.mutateAsync({
        id: `log_${Date.now()}`,
        staffId: adminId,
        staffName: adminName,
        action: 'updated_permissions',
        targetType: 'permission',
        targetId: staffId,
        targetName: updatedStaff[index].fullName,
        details: `Updated permissions: ${permissions.join(', ')}`,
        timestamp: new Date().toISOString(),
      });

      return updatedStaff[index];
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: async ({ 
      staffId, 
      newPassword,
      adminId,
      adminName 
    }: { 
      staffId: string; 
      newPassword: string;
      adminId: string;
      adminName: string;
    }) => {
      const staff: StaffMember[] = staffQuery.data || [];
      const index = staff.findIndex(s => s.id === staffId);
      
      if (index === -1) {
        throw new Error('Staff member not found');
      }

      // Update password on backend
      try {
        await apiClient.put(`/api/auth/staff/${staffId}/password`, {
          newPassword,
        });
      } catch (backendError) {
        console.warn('Backend password update failed, updating locally:', backendError);
        // Continue with local update as fallback
      }

      const updatedStaff = [...staff];
      updatedStaff[index] = { ...updatedStaff[index], password: newPassword };
      
      await saveStaffMutation.mutateAsync(updatedStaff);

      await saveActivityLogMutation.mutateAsync({
        id: `log_${Date.now()}`,
        staffId: adminId,
        staffName: adminName,
        action: 'changed_password',
        targetType: 'account',
        targetId: staffId,
        targetName: updatedStaff[index].fullName,
        details: 'Password changed',
        timestamp: new Date().toISOString(),
      });

      return true;
    },
  });

  const deleteStaffMutation = useMutation({
    mutationFn: async ({ 
      staffId,
      adminId,
      adminName 
    }: { 
      staffId: string;
      adminId: string;
      adminName: string;
    }) => {
      const staff: StaffMember[] = staffQuery.data || [];
      const staffMember = staff.find(s => s.id === staffId);
      
      if (!staffMember) {
        throw new Error('Staff member not found');
      }

      // Delete from backend
      try {
        await apiClient.delete(`/api/auth/${staffMember.id}`);
      } catch (backendError) {
        console.warn('Backend delete failed, deleting locally:', backendError);
      }

      const updatedStaff = staff.filter(s => s.id !== staffId);
      await saveStaffMutation.mutateAsync(updatedStaff);

      await saveActivityLogMutation.mutateAsync({
        id: `log_${Date.now()}`,
        staffId: adminId,
        staffName: adminName,
        action: 'deleted_staff',
        targetType: 'staff',
        targetId: staffId,
        targetName: staffMember.fullName,
        details: `Deleted ${staffMember.position} account`,
        timestamp: new Date().toISOString(),
      });

      return true;
    },
  });

  const getTeachers = () => {
    const staff: StaffMember[] = staffQuery.data || [];
    return staff.filter(s => s.position === 'teacher' && s.isActive);
  };

  const getStaffByPosition = (position: StaffPosition) => {
    const staff: StaffMember[] = staffQuery.data || [];
    return staff.filter(s => s.position === position && s.isActive);
  };

  const getStaffBySection = (sectionId: string) => {
    const staff: StaffMember[] = staffQuery.data || [];
    return staff.filter(s => s.assignedSectionIds?.includes(sectionId) && s.isActive);
  };

  return {
    staff: (staffQuery.data || []) as StaffMember[],
    activityLogs: (activityLogsQuery.data || []) as ActivityLog[],
    isLoading: staffQuery.isLoading || activityLogsQuery.isLoading,
    
    createStaff: createStaffMutation.mutateAsync,
    updateStaff: updateStaffMutation.mutate,
    updatePermissions: updatePermissionsMutation.mutate,
    changePassword: changePasswordMutation.mutateAsync,
    deleteStaff: deleteStaffMutation.mutate,
    changePasswordMutation,
    
    getTeachers,
    getStaffByPosition,
    getStaffBySection,
    
    isCreating: createStaffMutation.isPending,
    isUpdating: updateStaffMutation.isPending,
    isChangingPassword: changePasswordMutation.isPending,
  };
});
