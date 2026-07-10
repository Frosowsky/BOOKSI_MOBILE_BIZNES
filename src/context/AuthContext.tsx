import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { jwtDecode } from 'jwt-decode';
import api from '../api/client';

type Role = 'SalonOwner' | 'SalonEmployee' | 'Salesperson' | null;

interface AuthContextData {
  isLoading: boolean;
  userRole: Role;
  salonId: string | null;
  tenantId: string | null;
  signIn: (token: string, refreshToken: string, salonId: string, tenantId: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export const AuthProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [userRole, setUserRole] = useState<Role>(null);
  const [salonId, setSalonId] = useState<string | null>(null);
  const [tenantId, setTenantId] = useState<string | null>(null);

  useEffect(() => {
    // Check if user is already logged in
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
        }
      } catch (e) {
        console.error('Restoring token failed', e);
      }
      setIsLoading(false);
    };

    bootstrapAsync();
  }, []);

  const signIn = async (token: string, refreshToken: string, newSalonId: string, newTenantId: string) => {
    try {
      const decoded: any = jwtDecode(token);
      let role: Role = null;

      // Map roles
      if (decoded.role) {
        const roles = Array.isArray(decoded.role) ? decoded.role : [decoded.role];
        if (roles.includes('SalonOwner') || roles.includes('Admin')) {
          role = 'SalonOwner';
        } else if (roles.includes('Salesperson')) {
          role = 'Salesperson';
        } else if (roles.includes('SalonEmployee')) {
          role = 'SalonEmployee';
        }
      }

      await AsyncStorage.setItem('token', token);
      await AsyncStorage.setItem('refreshToken', refreshToken);
      if (role) await AsyncStorage.setItem('user_role', role);
      if (newSalonId) await AsyncStorage.setItem('salonId', newSalonId);
      if (newTenantId) await AsyncStorage.setItem('tenant_id', newTenantId);

      setUserRole(role);
      setSalonId(newSalonId);
      setTenantId(newTenantId);
    } catch (e) {
      console.error('SignIn error', e);
    }
  };

  const signOut = async () => {
    await AsyncStorage.multiRemove(['token', 'refreshToken', 'user_role', 'salonId', 'tenant_id']);
    setUserRole(null);
    setSalonId(null);
    setTenantId(null);
  };

  return (
    <AuthContext.Provider value={{ isLoading, userRole, salonId, tenantId, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
