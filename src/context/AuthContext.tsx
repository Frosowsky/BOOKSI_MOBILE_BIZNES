import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { jwtDecode } from 'jwt-decode';
import api from '../api/client';

type Role = 'SalonOwner' | 'SalonEmployee' | 'Salesperson' | null;

interface AuthContextData {
  isLoading: boolean;
  userRole: Role;
  salonId: string | null;
  tenantId: string | null;
  isSetupCompleted: boolean;
  setIsSetupCompleted: (val: boolean) => void;
  signIn: (token: string, refreshToken: string, salonId: string, tenantId: string) => Promise<void>;
  signOut: () => Promise<void>;
  enableBiometric: (token: string, refreshToken: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export const AuthProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [userRole, setUserRole] = useState<Role>(null);
  const [salonId, setSalonId] = useState<string | null>(null);
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [isSetupCompleted, setIsSetupCompleted] = useState<boolean>(true);

  useEffect(() => {
    const bootstrapAsync = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        const storedRole = await AsyncStorage.getItem('user_role') as Role;
        const storedSalonId = await AsyncStorage.getItem('salonId');
        const storedTenantId = await AsyncStorage.getItem('tenant_id');

        if (token && storedRole) {
          setUserRole(storedRole);
          setSalonId(storedSalonId);
          setTenantId(storedTenantId);
          
          if (storedRole === 'SalonOwner') {
            try {
              const res = await api.get('/Salons/me');
              if (res.data && res.data.isSetupCompleted !== undefined) {
                setIsSetupCompleted(res.data.isSetupCompleted);
                await AsyncStorage.setItem('isSetupCompleted', res.data.isSetupCompleted.toString());
              }
            } catch (err) {
              console.log('Failed to fetch setup status', err);
            }
          }
        }
      } catch (e) {
        console.error('Restoring token failed', e);
      }
      setIsLoading(false);
    };

    bootstrapAsync();

    const { DeviceEventEmitter } = require('react-native');
    const listener = DeviceEventEmitter.addListener('UNAUTHORIZED', () => {
      signOut();
    });

    return () => {
      listener.remove();
    };
  }, []);

  const signIn = async (token: string, refreshToken: string, newSalonId: string, newTenantId: string) => {
    try {
      const decoded: any = jwtDecode(token);
      let role: Role = null;
      console.log('Decoded Token:', decoded);

      const roleClaim = decoded['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] || decoded.role;

      if (roleClaim) {
        const roles = Array.isArray(roleClaim) ? roleClaim : [roleClaim];
        if (roles.includes('SalonOwner') || roles.includes('Admin')) {
          role = 'SalonOwner';
        } else if (roles.includes('Salesperson')) {
          role = 'Salesperson';
        } else if (roles.includes('SalonEmployee')) {
          role = 'SalonEmployee';
        }
      }

      if (!role) {
         console.warn('Uwaga: Nie udało się zmapować roli z tokena!', roleClaim);
      }

      await AsyncStorage.setItem('token', token);
      await AsyncStorage.setItem('refreshToken', refreshToken);
      if (role) await AsyncStorage.setItem('user_role', role);
      if (newSalonId) await AsyncStorage.setItem('salonId', newSalonId);
      if (newTenantId) await AsyncStorage.setItem('tenant_id', newTenantId);

      setUserRole(role);
      setSalonId(newSalonId);
      setTenantId(newTenantId);

      if (role === 'SalonOwner') {
        try {
          const res = await api.get('/Salons/me');
          if (res.data && res.data.isSetupCompleted !== undefined) {
            setIsSetupCompleted(res.data.isSetupCompleted);
            await AsyncStorage.setItem('isSetupCompleted', res.data.isSetupCompleted.toString());
          }
        } catch (err) {
          console.log('Failed to fetch setup status during signIn', err);
        }
      }
    } catch (e) {
      console.error('SignIn error', e);
    }
  };

  const signOut = async () => {
    // We intentionally DO NOT remove the biometric credentials from SecureStore,
    // so the user can easily log back in using their fingerprint.
    await AsyncStorage.multiRemove(['token', 'refreshToken', 'user_role', 'salonId', 'tenant_id']);
    setUserRole(null);
    setSalonId(null);
    setTenantId(null);
  };

  const enableBiometric = async (token: string, refreshToken: string) => {
    try {
      await SecureStore.setItemAsync('biometric_token', token);
      await SecureStore.setItemAsync('biometric_refresh_token', refreshToken);
    } catch (e) {
      console.error('Error enabling biometrics', e);
    }
  };

  return (
    <AuthContext.Provider value={{ isLoading, userRole, salonId, tenantId, isSetupCompleted, setIsSetupCompleted, signIn, signOut, enableBiometric }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
