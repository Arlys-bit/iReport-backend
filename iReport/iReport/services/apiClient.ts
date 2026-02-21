import axios, { AxiosInstance } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Production URL: https://ireport-backend-production.up.railway.app
// For local development: http://localhost:5001
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5001';

const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

// Add token to every request
apiClient.interceptors.request.use(async (config) => {
  try {
    const token = await AsyncStorage.getItem('school_auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (error) {
    console.error('Error getting token:', error);
  }
  return config;
});

// Handle 401 responses (invalid token)
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      await AsyncStorage.removeItem('school_auth_token');
      await AsyncStorage.removeItem('school_current_user');
      // Could trigger a logout action here
      console.error('Token invalid, user should re-login');
    }
    return Promise.reject(error);
  }
);

export default apiClient;
