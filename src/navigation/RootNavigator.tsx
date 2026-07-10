import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Calendar, Users, Settings, Activity } from 'lucide-react-native';

import { useAuth } from '../context/AuthContext';
import { LoginScreen } from '../screens/Auth/LoginScreen';
import { OwnerDashboard } from '../screens/Owner/OwnerDashboard';
import { EmployeeDashboard } from '../screens/Employee/EmployeeDashboard';
import { SalespersonDashboard } from '../screens/Sales/SalespersonDashboard';

// Define the root stack param list
export type RootStackParamList = {
  Login: undefined;
  OwnerApp: undefined;
  EmployeeApp: undefined;
  SalespersonApp: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator();

// --- Role Navigators ---

const OwnerNavigator = () => {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false, tabBarActiveTintColor: '#0f172a' }}>
      <Tab.Screen 
        name="OwnerHome" 
        component={OwnerDashboard} 
        options={{
          tabBarLabel: 'Salon',
          tabBarIcon: ({ color, size }) => <Activity color={color} size={size} />
        }} 
      />
      {/* Other tabs like Calendar, Clients will be added here */}
    </Tab.Navigator>
  );
};

const EmployeeNavigator = () => {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false, tabBarActiveTintColor: '#0f172a' }}>
      <Tab.Screen 
        name="EmployeeHome" 
        component={EmployeeDashboard} 
        options={{
          tabBarLabel: 'Mój Panel',
          tabBarIcon: ({ color, size }) => <Calendar color={color} size={size} />
        }} 
      />
    </Tab.Navigator>
  );
};

const SalespersonNavigator = () => {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false, tabBarActiveTintColor: '#0f172a' }}>
      <Tab.Screen 
        name="SalesHome" 
        component={SalespersonDashboard} 
        options={{
          tabBarLabel: 'Sprzedaż',
          tabBarIcon: ({ color, size }) => <Activity color={color} size={size} />
        }} 
      />
    </Tab.Navigator>
  );
};

// --- Root Navigator ---

export const RootNavigator = () => {
  const { userRole, isLoading } = useAuth();

  if (isLoading) {
    // We could return a Splash screen here
    return null;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!userRole ? (
          <Stack.Screen name="Login" component={LoginScreen} />
        ) : (
          <>
            {userRole === 'SalonOwner' && (
              <Stack.Screen name="OwnerApp" component={OwnerNavigator} />
            )}
            {userRole === 'SalonEmployee' && (
              <Stack.Screen name="EmployeeApp" component={EmployeeNavigator} />
            )}
            {userRole === 'Salesperson' && (
              <Stack.Screen name="SalespersonApp" component={SalespersonNavigator} />
            )}
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};
