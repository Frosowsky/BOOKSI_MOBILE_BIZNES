import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, Text, Button, Alert } from 'react-native';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';

import { Step1CompanyDetails } from '../screens/Setup/Step1CompanyDetails';
import { Step2BusinessHours } from '../screens/Setup/Step2BusinessHours';
import { Step3Categories } from '../screens/Setup/Step3Categories';
import { Step4Services } from '../screens/Setup/Step4Services';
import { Step5Employees } from '../screens/Setup/Step5Employees';

const SetupStack = createNativeStackNavigator();

const StepPlaceholder = ({ route, navigation }: any) => {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>{route.name} - Konfiguracja Salonu</Text>
      <Button 
        title="Dalej" 
        onPress={() => {
          if (route.name === 'Step2Hours') navigation.navigate('Step3Categories');
          else if (route.name === 'Step3Categories') navigation.navigate('Step4Services');
          else if (route.name === 'Step4Services') navigation.navigate('Step5Employees');
          else if (route.name === 'Step5Employees') navigation.navigate('Step6Done');
        }} 
      />
    </View>
  );
};

const Step6Done = () => {
  const { setIsSetupCompleted } = useAuth();
  
  const finishSetup = async () => {
    try {
      await api.post('/Setup/complete');
      setIsSetupCompleted(true);
    } catch (e) {
      console.error(e);
      Alert.alert('Błąd', 'Nie udało się zakończyć konfiguracji.');
    }
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' }}>
        Gratulacje! Zakończyłeś konfigurację salonu.
      </Text>
      <Text style={{ fontSize: 16, marginBottom: 40, textAlign: 'center' }}>
        Twój salon jest teraz gotowy do działania. Możesz zacząć przyjmować rezerwacje i zarządzać swoim biznesem!
      </Text>
      <Button title="Przejdź do aplikacji" onPress={finishSetup} />
    </View>
  );
};

export const SetupWizardNavigator = () => {
  return (
    <SetupStack.Navigator screenOptions={{ headerShown: true }}>
      <SetupStack.Screen name="Step1Company" component={Step1CompanyDetails} options={{ title: "Dane firmy" }} />
      <SetupStack.Screen name="Step2Hours" component={Step2BusinessHours} options={{ title: "Godziny otwarcia" }} />
      <SetupStack.Screen name="Step3Categories" component={Step3Categories} options={{ title: "Kategorie usług" }} />
      <SetupStack.Screen name="Step4Services" component={Step4Services} options={{ title: "Usługi" }} />
      <SetupStack.Screen name="Step5Employees" component={Step5Employees} options={{ title: "Pracownicy" }} />
      <SetupStack.Screen name="Step6Done" component={Step6Done} options={{ title: "Zakończ" }} />
    </SetupStack.Navigator>
  );
};
