import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import api from '../../api/client';
import { Calendar as CalendarIcon, Clock, User, Scissors, Check, X } from 'lucide-react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';

export const NewAppointmentScreen = () => {
  const navigation = useNavigation();
  const route = useRoute<any>();
  const editAppointmentId = route.params?.editAppointmentId;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [clients, setClients] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);

  const [selectedClient, setSelectedClient] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [selectedService, setSelectedService] = useState('');
  
  // Minimalist approach for dates: just standard string inputs for now, 
  // since we don't have a date-picker library installed.
  const [dateStr, setDateStr] = useState(''); // YYYY-MM-DD
  const [timeStr, setTimeStr] = useState(''); // HH:mm
  const [notes, setNotes] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [cRes, eRes, sRes, apptsRes] = await Promise.all([
          api.get('/CompanyClients'),
          api.get('/Employees'),
          api.get('/Services'),
          editAppointmentId ? api.get('/Appointments') : Promise.resolve({ data: [] })
        ]);
        setClients(cRes.data);
        setEmployees(eRes.data);
        setServices(sRes.data);

        if (editAppointmentId) {
          const apptToEdit = apptsRes.data.find((a: any) => a.id === editAppointmentId);
          if (apptToEdit) {
            setSelectedClient(apptToEdit.clientId);
            setSelectedEmployee(apptToEdit.employeeId);
            setSelectedService(apptToEdit.serviceId);
            
            const startDate = new Date(apptToEdit.startTime);
            setDateStr(startDate.toISOString().split('T')[0]);
            setTimeStr(startDate.toTimeString().substring(0, 5));
            setNotes(apptToEdit.notes || '');
          }
        } else {
          // Ustaw domyślne daty na dziś
          const now = new Date();
          setDateStr(now.toISOString().split('T')[0]);
          setTimeStr(now.toTimeString().substring(0, 5));
        }
      } catch (e) {
        console.error('Failed to load form data', e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleSubmit = async () => {
    if (!selectedClient || !selectedEmployee || !selectedService || !dateStr || !timeStr) {
      Alert.alert('Błąd', 'Proszę wypełnić wszystkie wymagane pola.');
      return;
    }

    setSubmitting(true);
    try {
      const service = services.find(s => s.id === selectedService);
      const duration = service?.durationMinutes || 60;
      
      const startDateTime = new Date(`${dateStr}T${timeStr}:00`);
      const endDateTime = new Date(startDateTime.getTime() + duration * 60000);

      const payload = {
        id: editAppointmentId,
        clientId: selectedClient,
        employeeId: selectedEmployee,
        serviceId: selectedService,
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
        notes: notes
      };

      if (editAppointmentId) {
        await api.put(`/Appointments/${editAppointmentId}`, payload);
        Alert.alert('Sukces', 'Wizyta została zaktualizowana.', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      } else {
        await api.post('/Appointments', payload);
        Alert.alert('Sukces', 'Wizyta została utworzona.', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      }
    } catch (e) {
      console.error(e);
      Alert.alert('Błąd', 'Nie udało się zapisać wizyty.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderSelection = (items: any[], selectedValue: string, onSelect: (val: string) => void, placeholder: string) => {
    return (
      <View style={styles.selectionGroup}>
        {items.map(item => {
          const isSelected = item.id === selectedValue;
          const label = item.name || `${item.firstName} ${item.lastName}`;
          return (
            <TouchableOpacity 
              key={item.id} 
              style={[styles.selectBtn, isSelected && styles.selectBtnActive]}
              onPress={() => onSelect(item.id)}
            >
              <Text style={[styles.selectBtnText, isSelected && styles.selectBtnTextActive]}>
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
        {items.length === 0 && <Text style={styles.noItems}>Brak danych do wyboru</Text>}
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{paddingRight: 10}}>
          <X color="#0f172a" size={24} />
        </TouchableOpacity>
        <Text style={styles.title}>{editAppointmentId ? 'Edycja Wizyty' : 'Nowa Wizyta'}</Text>
        <View style={{width: 24}}/>
      </View>
      <ScrollView contentContainerStyle={styles.content}>

        <Text style={styles.label}><User size={16} color="#64748b"/> Wybierz Klienta</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scrollSelect}>
          {renderSelection(clients, selectedClient, setSelectedClient, 'Wybierz klienta...')}
        </ScrollView>

        <Text style={styles.label}><User size={16} color="#64748b"/> Wybierz Pracownika</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scrollSelect}>
          {renderSelection(employees, selectedEmployee, setSelectedEmployee, 'Wybierz pracownika...')}
        </ScrollView>

        <Text style={styles.label}><Scissors size={16} color="#64748b"/> Wybierz Usługę</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scrollSelect}>
          {renderSelection(services, selectedService, setSelectedService, 'Wybierz usługę...')}
        </ScrollView>

        <View style={styles.row}>
          <View style={{flex: 1, marginRight: 8}}>
            <Text style={styles.label}><CalendarIcon size={16} color="#64748b"/> Data (YYYY-MM-DD)</Text>
            <TextInput 
              style={styles.input} 
              value={dateStr}
              onChangeText={setDateStr}
              placeholder="np. 2024-12-01"
            />
          </View>
          <View style={{flex: 1, marginLeft: 8}}>
            <Text style={styles.label}><Clock size={16} color="#64748b"/> Czas (HH:MM)</Text>
            <TextInput 
              style={styles.input} 
              value={timeStr}
              onChangeText={setTimeStr}
              placeholder="np. 14:30"
            />
          </View>
        </View>

        <Text style={styles.label}>Dodatkowe Notatki</Text>
        <TextInput 
          style={[styles.input, styles.textArea]} 
          value={notes}
          onChangeText={setNotes}
          placeholder="Opcjonalne notatki..."
          multiline
        />

        <TouchableOpacity 
          style={styles.submitBtn} 
          onPress={handleSubmit} 
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Check size={20} color="#fff" style={{marginRight: 8}}/>
              <Text style={styles.submitBtnText}>{editAppointmentId ? 'Zapisz Zmiany' : 'Zapisz Wizytę'}</Text>
            </>
          )}
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  center: { justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  title: { fontSize: 20, fontWeight: 'bold', color: '#0f172a' },
  content: { padding: 16 },
  label: { fontSize: 14, fontWeight: '600', color: '#475569', marginBottom: 8, marginTop: 16, flexDirection: 'row', alignItems: 'center' },
  scrollSelect: { flexGrow: 0, marginBottom: 8 },
  selectionGroup: { flexDirection: 'row', paddingVertical: 4 },
  selectBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, backgroundColor: '#e2e8f0', marginRight: 10 },
  selectBtnActive: { backgroundColor: '#3b82f6' },
  selectBtnText: { color: '#475569', fontWeight: '500' },
  selectBtnTextActive: { color: '#ffffff', fontWeight: 'bold' },
  noItems: { color: '#94a3b8', fontStyle: 'italic', paddingVertical: 10 },
  row: { flexDirection: 'row' },
  input: { backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 8, padding: 12, fontSize: 16, color: '#0f172a' },
  textArea: { height: 100, textAlignVertical: 'top' },
  submitBtn: { backgroundColor: '#10b981', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', padding: 16, borderRadius: 12, marginTop: 32, marginBottom: 40 },
  submitBtnText: { color: '#ffffff', fontSize: 16, fontWeight: 'bold' }
});
