import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, Switch } from 'react-native';
import { Button } from '../../components/Button';
import { useThemeColors } from '../../theme/useThemeColors';
import api from '../../api/client';

export const Step5Employees = ({ navigation }: any) => {
  const { colors } = useThemeColors();
  const [employees, setEmployees] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const empRes = await api.get('/Employees');
      setEmployees(empRes.data);

      const serRes = await api.get('/Services');
      setServices(serRes.data);
    } catch (e) {
      console.log('Failed to fetch data', e);
    }
  };

  const toggleService = (employeeId: string, serviceId: string) => {
    setEmployees(prev => prev.map(emp => {
      if (emp.id !== employeeId) return emp;
      const hasService = emp.serviceIds?.includes(serviceId);
      const newServiceIds = hasService
        ? (emp.serviceIds || []).filter((id: string) => id !== serviceId)
        : [...(emp.serviceIds || []), serviceId];
      return { ...emp, serviceIds: newServiceIds };
    }));
  };

  const saveEmployeeServices = async (employeeId: string) => {
    const emp = employees.find(e => e.id === employeeId);
    if (!emp) return;
    
    try {
      await api.put(`/Employees/${employeeId}/services`, {
        employeeId: employeeId,
        serviceIds: emp.serviceIds || []
      });
      Alert.alert('Sukces', 'Usługi pracownika zostały zapisane.');
    } catch (e) {
      Alert.alert('Błąd', 'Nie udało się zapisać usług pracownika.');
    }
  };

  const handleNext = () => {
    navigation.navigate('Step6Done');
  };

  return (
    <ScrollView contentContainerStyle={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>Pracownicy</Text>
      <Text style={[styles.subtitle, { color: colors.text + '80' }]}>
        Przypisz usługi do pracowników. Jako właściciel, jesteś już na liście.
      </Text>

      {employees.map(emp => (
        <View key={emp.id} style={[styles.employeeCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={{ color: colors.text, fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>
            {emp.firstName} {emp.lastName}
          </Text>
          
          <Text style={{ color: colors.text + '80', marginBottom: 10 }}>Przypisane usługi:</Text>
          {services.map(ser => {
            const isAssigned = emp.serviceIds?.includes(ser.id) || false;
            return (
              <View key={ser.id} style={styles.serviceRow}>
                <Switch
                  value={isAssigned}
                  onValueChange={() => toggleService(emp.id, ser.id)}
                  trackColor={{ false: colors.border, true: colors.primary }}
                />
                <Text style={{ color: colors.text, marginLeft: 10 }}>{ser.name}</Text>
              </View>
            );
          })}
          
          <View style={{ marginTop: 10 }}>
            <Button title="Zapisz usługi" onPress={() => saveEmployeeServices(emp.id)} />
          </View>
        </View>
      ))}

      <View style={{ marginTop: 30, marginBottom: 40 }}>
        <Button title="Zakończ konfigurację" onPress={handleNext} loading={isLoading} />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 20,
  },
  employeeCard: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 15,
    marginBottom: 20,
  },
  serviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  }
});
