import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Calendar, Users, Activity, PlusCircle, UserCog, Scissors, Building } from 'lucide-react-native';

import { useAuth } from '../context/AuthContext';
import { LoginScreen } from '../screens/Auth/LoginScreen';
import { OwnerDashboard } from '../screens/Owner/OwnerDashboard';
import { EmployeeDashboard } from '../screens/Employee/EmployeeDashboard';
import { SalespersonDashboard } from '../screens/Sales/SalespersonDashboard';
import { AppointmentsScreen } from '../screens/Shared/AppointmentsScreen';
import { NewAppointmentScreen } from '../screens/Shared/NewAppointmentScreen';
import { ClientsScreen } from '../screens/Owner/ClientsScreen';
import { EmployeesScreen } from '../screens/Owner/EmployeesScreen';
import { ServicesScreen } from '../screens/Owner/ServicesScreen';
import { SalesCompaniesScreen } from '../screens/Sales/SalesCompaniesScreen';

import { MarketingScreen } from '../screens/Owner/MarketingScreen';
import { MessagesScreen } from '../screens/Owner/MessagesScreen';
import { LoyaltyCardsScreen } from '../screens/Owner/LoyaltyCardsScreen';
import { WaitlistScreen } from '../screens/Owner/WaitlistScreen';
import { StatisticsScreen } from '../screens/Owner/StatisticsScreen';
import { EmployeeScheduleScreen } from '../screens/Owner/EmployeeScheduleScreen';

export type RootStackParamList = {
  Login: undefined;
  OwnerApp: undefined;
  EmployeeApp: undefined;
  SalespersonApp: undefined;
  NewAppointment: undefined;
  Marketing: undefined;
  Messages: undefined;
  LoyaltyCards: undefined;
  Waitlist: undefined;
  Statistics: undefined;
  EmployeeSchedule: { employeeId: string; employeeName: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator();

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
      <Tab.Screen 
        name="OwnerAppointments" 
        component={AppointmentsScreen} 
        options={{
          tabBarLabel: 'Wizyty',
          tabBarIcon: ({ color, size }) => <Calendar color={color} size={size} />
        }} 
      />
      <Tab.Screen 
        name="OwnerClients" 
        component={ClientsScreen} 
        options={{
          tabBarLabel: 'Klienci',
          tabBarIcon: ({ color, size }) => <Users color={color} size={size} />
        }} 
      />
      <Tab.Screen 
        name="OwnerEmployees" 
        component={EmployeesScreen} 
        options={{
          tabBarLabel: 'Pracownicy',
          tabBarIcon: ({ color, size }) => <UserCog color={color} size={size} />
        }} 
      />
      <Tab.Screen 
        name="OwnerServices" 
        component={ServicesScreen} 
        options={{
          tabBarLabel: 'Usługi',
          tabBarIcon: ({ color, size }) => <Scissors color={color} size={size} />
        }} 
      />
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
          tabBarIcon: ({ color, size }) => <Activity color={color} size={size} />
        }} 
      />
      <Tab.Screen 
        name="EmployeeAppointments" 
        component={AppointmentsScreen} 
        options={{
          tabBarLabel: 'Wizyty',
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
          tabBarLabel: 'Podsumowanie',
          tabBarIcon: ({ color, size }) => <Activity color={color} size={size} />
        }} 
      />
      <Tab.Screen 
        name="SalesCompanies" 
        component={SalesCompaniesScreen} 
        options={{
          tabBarLabel: 'Moje Salony',
          tabBarIcon: ({ color, size }) => <Building color={color} size={size} />
        }} 
      />
    </Tab.Navigator>
  );
};

export const RootNavigator = () => {
  const { userRole, isLoading } = useAuth();

  if (isLoading) {
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
              <>
                <Stack.Screen name="OwnerApp" component={OwnerNavigator} />
                <Stack.Screen name="Marketing" component={MarketingScreen} />
                <Stack.Screen name="Messages" component={MessagesScreen} />
                <Stack.Screen name="LoyaltyCards" component={LoyaltyCardsScreen} />
                <Stack.Screen name="Waitlist" component={WaitlistScreen} />
                <Stack.Screen name="Statistics" component={StatisticsScreen} />
                <Stack.Screen name="EmployeeSchedule" component={EmployeeScheduleScreen} />
              </>
            )}
            {userRole === 'SalonEmployee' && (
              <Stack.Screen name="EmployeeApp" component={EmployeeNavigator} />
            )}
            {userRole === 'Salesperson' && (
              <Stack.Screen name="SalespersonApp" component={SalespersonNavigator} />
            )}
            <Stack.Screen 
              name="NewAppointment" 
              component={NewAppointmentScreen} 
              options={{ presentation: 'modal' }} 
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};
