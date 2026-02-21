import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useState, useEffect } from 'react';
import apiClient from '@/services/apiClient';
import { initializeSocket, disconnectSocket } from '@/services/socketService';
import { User, StaffMember, Student, UserRole, StaffPermission, hasPermission } from '@/types';

const STORAGE_KEYS = {
  AUTH_TOKEN: 'school_auth_token',
  CURRENT_USER: 'school_current_user',
};

export const [AuthProvider, useAuth] = createContextHook(() => {
  const [currentUser, setCurrentUser] = useState<User | StaffMember | Student | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Check existing session on mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        const token = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
        const userStr = await AsyncStorage.getItem(STORAGE_KEYS.CURRENT_USER);
        
        if (token && userStr) {
          const user = JSON.parse(userStr);
          setCurrentUser(user);
          // Initialize socket connection
          initializeSocket(user.id);
        }
      } catch (err) {
        console.error('Error checking session:', err);
      } finally {
        setIsLoading(false);
      }
    };

    checkSession();

    return () => {
      disconnectSocket();
    };
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoggingIn(true);
    setError(null);
    try {
      const response = await apiClient.post('/api/auth/login', {
        email,
        password,
      });

      const { token, user } = response.data.data;

      // Store token and user
      await AsyncStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
      await AsyncStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));

      setCurrentUser(user);

      // Initialize socket connection
      initializeSocket(user.id);

      return { success: true, user };
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Login failed';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setIsLoggingIn(false);
    }
  };

  const register = async (
    fullName: string,
    email: string,
    password: string,
    role: string = 'student'
  ) => {
    setIsLoggingIn(true);
    setError(null);
    try {
      const response = await apiClient.post('/api/auth/register', {
        fullName,
        email,
        password,
        role,
      });

      const { token, user } = response.data.data;

      // Store token and user
      await AsyncStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
      await AsyncStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));

      setCurrentUser(user);

      // Initialize socket connection
      initializeSocket(user.id);

      return { success: true, user };
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Registration failed';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setIsLoggingIn(false);
    }
  };

  const logout = async () => {
    try {
      disconnectSocket();
      await AsyncStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
      await AsyncStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
      setCurrentUser(null);
      setError(null);
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const createStudent = async (
    data: { fullName: string; lrn: string; email: string; password: string; profilePhoto?: string },
    callbacks?: { onSuccess?: () => void; onError?: (err: any) => void }
  ) => {
    try {
      const response = await apiClient.post('/api/auth/register', {
        fullName: data.fullName,
        email: data.email,
        password: data.password,
        role: 'student',
      });

      // Also create student record with LRN
      if (response.data.data?.user?.id) {
        await apiClient.post('/api/students', {
          userId: response.data.data.user.id,
          lrn: data.lrn,
        });
      }

      callbacks?.onSuccess?.();
      return { success: true };
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Failed to create student';
      callbacks?.onError?.(new Error(errorMsg));
      return { success: false, error: errorMsg };
    }
  };

  const isCreatingStudent = false; // TODO: Add loading state if needed

  const updateCurrentUser = async (updates: Partial<User | StaffMember | Student>) => {
    if (!currentUser) {
      setError('No user logged in');
      return { success: false, error: 'No user logged in' };
    }

    try {
      const updated = { ...currentUser, ...updates };
      await AsyncStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(updated));
      setCurrentUser(updated);
      
      // TODO: Call backend API to persist changes
      // await apiClient.put(`/api/users/${currentUser.id}`, updates);
      
      return { success: true, user: updated };
    } catch (err: any) {
      const errorMsg = 'Failed to update user';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    }
  };

  const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'principal';
  const isGuidance = currentUser?.role === 'guidance';
  const isTeacher = currentUser?.role === 'teacher';
  const isStudent = currentUser?.role === 'student';

  const canAccessFullDashboard = isAdmin || isGuidance;

  const checkPermission = (permission: StaffPermission): boolean => {
    if (!currentUser || currentUser.role === 'student') return false;
    return hasPermission(currentUser as StaffMember, permission);
  };

  const getStaffMember = (): StaffMember | null => {
    if (!currentUser || currentUser.role === 'student') return null;
    return currentUser as StaffMember;
  };

  const getStudent = (): Student | null => {
    if (!currentUser || currentUser.role !== 'student') return null;
    return currentUser as Student;
  };

  return {
    currentUser,
    isLoading,
    error,
    isLoggingIn,
    login,
    register,
    createStudent,
    isCreatingStudent,
    logout,
    updateCurrentUser,

    isAdmin,
    isGuidance,
    isTeacher,
    isStudent,
    canAccessFullDashboard,
    checkPermission,
    getStaffMember,
    getStudent,
  };
});
