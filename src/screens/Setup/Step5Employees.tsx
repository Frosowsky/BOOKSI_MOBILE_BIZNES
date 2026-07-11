import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, Switch, TouchableOpacity } from 'react-native';
import { Button } from '../../components/Button';
import { useThemeColors } from '../../theme/useThemeColors';
import api from '../../api/client';

export const Step5Employees = ({ navigation }: any) => {
  const { colors } = useThemeColors();
  const [employees, setEmployees] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
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

      const catRes = await api.get('/ServiceCategories');
      setCategories(catRes.data);
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

  const toggleAllInCategory = (employeeId: string, categoryId: string, isSelecting: boolean) => {
    const categoryServices = services.filter(s => s.categoryId === categoryId).map(s => s.id);
    
    setEmployees(prev => prev.map(emp => {
      if (emp.id !== employeeId) return emp;
      let newServiceIds = [...(emp.serviceIds || [])];
      
      if (isSelecting) {
        categoryServices.forEach(id => {
          if (!newServiceIds.includes(id)) newServiceIds.push(id);
        });
      } else {
        newServiceIds = newServiceIds.filter(id => !categoryServices.includes(id));
      }
      return { ...emp, serviceIds: newServiceIds };
    }));
  };

  const toggleAllServices = (employeeId: string, isSelecting: boolean) => {
    const allServiceIds = services.map(s => s.id);
    setEmployees(prev => prev.map(emp => {
      if (emp.id !== employeeId) return emp;
      return { ...emp, serviceIds: isSelecting ? allServiceIds : [] };
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

      {employees.map(emp => {
        const allServiceIds = services.map(s => s.id);
        const hasAllServices = allServiceIds.length > 0 && allServiceIds.every(id => emp.serviceIds?.includes(id));

        return (
          <View key={emp.id} style={[styles.employeeCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
              <Text style={{ color: colors.text, fontSize: 18, fontWeight: 'bold' }}>
                {emp.firstName} {emp.lastName}
              </Text>
              <TouchableOpacity 
                style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 4, backgroundColor: hasAllServices ? colors.primary : colors.surface, borderWidth: 1, borderColor: colors.border }}
                onPress={() => toggleAllServices(emp.id, !hasAllServices)}
              >
                <Text style={{ color: hasAllServices ? '#fff' : colors.text, fontSize: 12 }}>
                  {hasAllServices ? 'Odznacz wszystko' : 'Zaznacz wszystkie'}
                </Text>
              </TouchableOpacity>
            </View>
            
            {categories.map(cat => {
              const catServices = services.filter(s => s.categoryId === cat.id);
              if (catServices.length === 0) return null;
              
              const hasAllInCat = catServices.every(s => emp.serviceIds?.includes(s.id));

              return (
                <View key={cat.id} style={{ borderLeftWidth: 3, borderLeftColor: colors.primary, paddingLeft: 10, marginBottom: 15 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <Text style={{ color: colors.text, fontSize: 14, fontWeight: 'bold' }}>{cat.name}</Text>
                    <TouchableOpacity 
                      style={{ paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, borderWidth: 1, borderColor: colors.border }}
                      onPress={() => toggleAllInCategory(emp.id, cat.id, !hasAllInCat)}
                    >
                      <Text style={{ color: colors.text + '80', fontSize: 11 }}>
                        {hasAllInCat ? 'Odznacz kategorię' : 'Zaznacz kategorię'}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {catServices.map(ser => {
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
                </View>
              );
            })}
            
            <View style={{ marginTop: 10 }}>
              <Button title="Zapisz przypisania" onPress={() => saveEmployeeServices(emp.id)} />
            </View>
          </View>
        );
      })}

      <View style={{ marginTop: 30, flexDirection: 'row', gap: 10, marginBottom: 40 }}>
        <TouchableOpacity 
          style={{ flex: 1, paddingVertical: 12, borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }} 
          onPress={() => navigation.goBack()}
        >
          <Text style={{ color: colors.text, fontSize: 16, fontWeight: '600' }}>Wstecz</Text>
        </TouchableOpacity>
        <Button title="Zakończ" onPress={handleNext} loading={isLoading} style={{ flex: 1 }} />
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
