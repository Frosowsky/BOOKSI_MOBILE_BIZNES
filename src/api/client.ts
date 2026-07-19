import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
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
    
    // Offline Queue Logic
    const netState = await NetInfo.fetch();
    const isOffline = !(netState.isConnected && netState.isInternetReachable !== false);
    
    if (isOffline && config.method && ['post', 'put', 'patch', 'delete'].includes(config.method.toLowerCase())) {
        const queueRaw = await AsyncStorage.getItem('offlineQueue');
        const queue = queueRaw ? JSON.parse(queueRaw) : [];
        queue.push({
            url: config.url,
            method: config.method,
            data: config.data,
            headers: config.headers,
            timestamp: new Date().toISOString()
        });
        await AsyncStorage.setItem('offlineQueue', JSON.stringify(queue));
        
        // Zwracamy fałszywy sukces, by UI pokazało, że się udało
        return Promise.reject({ isOfflineMock: true, message: 'Saved to offline queue' });
    }
    
  } catch (error) {
    console.error('Error in request interceptor:', error);
  }

  return config;
});

let isRefreshing = false;
let failedQueue: { resolve: (token: string) => void; reject: (error: any) => void }[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token as string);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Handling our custom offline mock reject
    if (error && error.isOfflineMock) {
        return Promise.resolve({ data: { message: "Saved offline", success: true, offline: true }, status: 200, statusText: "OK", headers: {}, config: error.config });
    }

    const originalRequest = error.config;
    
    if (!originalRequest) return Promise.reject(error);
    
    if (originalRequest.url?.includes('/auth/refresh')) {
        return Promise.reject(error);
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise(function(resolve, reject) {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers['Authorization'] = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

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
            
            api.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`;
            originalRequest.headers['Authorization'] = `Bearer ${res.data.token}`;
            
            processQueue(null, res.data.token);
            
            return api(originalRequest);
          }
        }
      } catch (err) {
        processQueue(err, null);
        await AsyncStorage.multiRemove(['token', 'refreshToken', 'user_role', 'tenant_id', 'salonId']);
        import('react-native').then(({ DeviceEventEmitter }) => {
          DeviceEventEmitter.emit('UNAUTHORIZED');
        });
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  }
);

export default api;
