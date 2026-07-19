import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { signRequest } from '../lib/SecurityInterceptor';

// In Expo, process.env is sometimes available, but often EXPO_PUBLIC_ prefix is used
// For now, we will use the production API URL as fallback, or EXPO_PUBLIC_API_URL
const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL || 'https://booksi-api-uk9p.onrender.com/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to inject the tenant ID for company dashboard
api.interceptors.request.use(async (config) => {
  try {
    const token = await AsyncStorage.getItem('token');
    if (token) {
      config.headers.set('Authorization', `Bearer ${token}`);
    }
    
    const salonId = await AsyncStorage.getItem('salonId');
    if (salonId) {
      config.headers.set('X-Salon-Id', salonId);
      config.headers.set('X-Tenant-Id', salonId);
    }
    // Zabezpieczenie przed Scrapingiem (HMAC + Nonce)
    config = signRequest(config);
  } catch (error) {
    console.error('Error in request interceptor:', error);
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (originalRequest.url?.includes('/auth/refresh')) {
        return Promise.reject(error);
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = await AsyncStorage.getItem('refreshToken');
        const token = await AsyncStorage.getItem('token');
        
        if (refreshToken && token) {
          const res = await axios.post(`${api.defaults.baseURL}/auth/refresh`, {
            token,
            refreshToken
          });
          
          if (res.data.token && res.data.refreshToken) {
            await AsyncStorage.setItem('token', res.data.token);
            await AsyncStorage.setItem('refreshToken', res.data.refreshToken);
            
            originalRequest.headers['Authorization'] = `Bearer ${res.data.token}`;
            
            return api(originalRequest);
          }
        }
      } catch (err) {
        // Refresh failed, clear storage
        await AsyncStorage.multiRemove(['token', 'refreshToken', 'user_role', 'tenant_id', 'salonId']);
        import('react-native').then(({ DeviceEventEmitter }) => {
          DeviceEventEmitter.emit('UNAUTHORIZED');
        });
      }
    }
    return Promise.reject(error);
  }
);

export default api;
