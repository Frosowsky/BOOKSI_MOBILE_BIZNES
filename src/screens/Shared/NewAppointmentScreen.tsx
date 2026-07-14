import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator, Modal } from 'react-native';
import api from '../../api/client';
import { Calendar as CalendarIcon, Clock, User, Scissors, Check, X } from 'lucide-react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemeColors } from '../../theme/useThemeColors';
import DateTimePickerModal from 'react-native-modal-datetime-picker';

export const NewAppointmentScreen = () => {
  const { colors, isDark } = useThemeColors();
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

  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  const [isTimePickerVisible, setTimePickerVisibility] = useState(false);

  const [clientSearch, setClientSearch] = useState('');
  const [employeeSearch, setEmployeeSearch] = useState('');
  const [serviceSearch, setServiceSearch] = useState('');

  // New Client states
  const [isAddClientVisible, setAddClientVisible] = useState(false);
  const [newClientFirst, setNewClientFirst] = useState('');
  const [newClientLast, setNewClientLast] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');
  const [isAddingClient, setIsAddingClient] = useState(false);

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

  const handleAddClient = async () => {
    if (!newClientFirst || !newClientLast) {
      Alert.alert('Błąd', 'Imię i nazwisko są wymagane.');
      return;
    }
    setIsAddingClient(true);
    try {
      const res = await api.post('/CompanyClients', {
        firstName: newClientFirst,
        lastName: newClientLast,
        phone: newClientPhone
      });
      const newClient = res.data;
      setClients(prev => [...prev, newClient]);
      setSelectedClient(newClient.id);
      setAddClientVisible(false);
      setNewClientFirst('');
      setNewClientLast('');
      setNewClientPhone('');
    } catch (e) {
      console.error(e);
      Alert.alert('Błąd', 'Nie udało się dodać klienta.');
    } finally {
      setIsAddingClient(false);
    }
  };

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
    } catch (e: any) {
      console.error(e);
      const msg = e.response?.data?.message || 'Nie udało się zapisać wizyty.';
      Alert.alert('Błąd', msg);
    } finally {
      setSubmitting(false);
    }
  };

  const renderSelection = (items: any[], selectedValue: string, onSelect: (val: string) => void, placeholder: string, searchVal: string, setSearchVal: (val: string) => void) => {
    const filtered = items.filter(item => {
      if (!searchVal) return true;
      const label = (item.name || `${item.firstName} ${item.lastName}`).toLowerCase();
      const phone = (item.phoneNumber || '').toLowerCase();
      const s = searchVal.toLowerCase();
      return label.includes(s) || phone.includes(s);
    });

    return (
      <View style={{ marginBottom: 8 }}>
        <TextInput
          style={[styles.input, { backgroundColor: isDark ? '#1e293b' : '#f1f5f9', color: colors.text, borderColor: colors.border, marginBottom: 8, paddingVertical: 8 }]}
          placeholder={`Wyszukaj: ${placeholder}`}
          placeholderTextColor={colors.textMuted}
          value={searchVal}
          onChangeText={setSearchVal}
        />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scrollSelect}>
          <View style={styles.selectionGroup}>
            {filtered.slice(0, 15).map(item => {
              const isSelected = item.id === selectedValue;
              const label = item.name || `${item.firstName} ${item.lastName}`;
              return (
                <TouchableOpacity 
                  key={item.id} 
                  style={[
                    styles.selectBtn, 
                    { backgroundColor: isDark ? '#334155' : '#e2e8f0' },
                    isSelected && { backgroundColor: colors.primary }
                  ]}
                  onPress={() => onSelect(item.id)}
                >
                  <Text style={[
                    styles.selectBtnText, 
                    { color: isDark ? '#cbd5e1' : '#475569' },
                    isSelected && styles.selectBtnTextActive
                  ]}>
                    {label}
                  </Text>
                </TouchableOpacity>
              );
            })}
            {filtered.length === 0 && <Text style={[styles.noItems, { color: colors.textMuted }]}>Brak wyników</Text>}
          </View>
        </ScrollView>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{paddingRight: 10}}>
          <X color={colors.text} size={24} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>{editAppointmentId ? 'Edycja Wizyty' : 'Nowa Wizyta'}</Text>
        <View style={{width: 24}}/>
      </View>
      <ScrollView contentContainerStyle={styles.content}>

        <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 16, marginBottom: 8}}>
          <Text style={[styles.label, { color: colors.text, marginTop: 0, marginBottom: 0 }]}><User size={16} color={colors.textMuted}/> Wybierz Klienta</Text>
          <TouchableOpacity onPress={() => setAddClientVisible(true)}>
             <Text style={{color: colors.primary, fontWeight: 'bold', fontSize: 14}}>+ Dodaj klienta</Text>
          </TouchableOpacity>
        </View>
        {renderSelection(clients, selectedClient, setSelectedClient, 'np. Jan Kowalski', clientSearch, setClientSearch)}

        <Text style={[styles.label, { color: colors.text }]}><User size={16} color={colors.textMuted}/> Wybierz Pracownika</Text>
        {renderSelection(employees, selectedEmployee, setSelectedEmployee, 'np. Anna', employeeSearch, setEmployeeSearch)}

        <Text style={[styles.label, { color: colors.text }]}><Scissors size={16} color={colors.textMuted}/> Wybierz Usługę</Text>
        {renderSelection(services, selectedService, setSelectedService, 'np. Strzyżenie', serviceSearch, setServiceSearch)}

        <View style={styles.row}>
          <TouchableOpacity style={{flex: 1, marginRight: 8}} onPress={() => setDatePickerVisibility(true)}>
            <Text style={[styles.label, { color: colors.text }]}><CalendarIcon size={16} color={colors.textMuted}/> Data</Text>
            <View style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, justifyContent: 'center' }]}>
              <Text style={{ color: dateStr ? colors.text : colors.textMuted }}>
                {dateStr || 'Wybierz datę'}
              </Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={{flex: 1, marginLeft: 8}} onPress={() => setTimePickerVisibility(true)}>
            <Text style={[styles.label, { color: colors.text }]}><Clock size={16} color={colors.textMuted}/> Czas</Text>
            <View style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, justifyContent: 'center' }]}>
              <Text style={{ color: timeStr ? colors.text : colors.textMuted }}>
                {timeStr || 'Wybierz godzinę'}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        <DateTimePickerModal
          isVisible={isDatePickerVisible}
          mode="date"
          onConfirm={(date) => {
            setDateStr(date.toISOString().split('T')[0]);
            setDatePickerVisibility(false);
          }}
          onCancel={() => setDatePickerVisibility(false)}
        />
        <DateTimePickerModal
          isVisible={isTimePickerVisible}
          mode="time"
          onConfirm={(date) => {
            setTimeStr(date.toTimeString().substring(0, 5));
            setTimePickerVisibility(false);
          }}
          onCancel={() => setTimePickerVisibility(false)}
        />

        <Text style={[styles.label, { color: colors.text }]}>Dodatkowe Notatki</Text>
        <TextInput 
          style={[styles.input, styles.textArea, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]} 
          value={notes}
          onChangeText={setNotes}
          placeholder="Opcjonalne notatki..."
          placeholderTextColor={colors.textMuted}
          multiline
        />

        <TouchableOpacity 
          style={[styles.submitBtn, { backgroundColor: colors.primary }]} 
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

      {/* New Client Modal */}
      <Modal visible={isAddClientVisible} animationType="slide" transparent={true} onRequestClose={() => setAddClientVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <Text style={[styles.title, { color: colors.text, marginBottom: 16 }]}>Nowy Klient</Text>
            
            <Text style={{color: colors.text, marginBottom: 4}}>Imię *</Text>
            <TextInput 
              style={[styles.input, { backgroundColor: isDark ? '#1e293b' : '#f1f5f9', color: colors.text, borderColor: colors.border, marginBottom: 12 }]}
              value={newClientFirst} onChangeText={setNewClientFirst}
            />
            
            <Text style={{color: colors.text, marginBottom: 4}}>Nazwisko *</Text>
            <TextInput 
              style={[styles.input, { backgroundColor: isDark ? '#1e293b' : '#f1f5f9', color: colors.text, borderColor: colors.border, marginBottom: 12 }]}
              value={newClientLast} onChangeText={setNewClientLast}
            />
            
            <Text style={{color: colors.text, marginBottom: 4}}>Telefon</Text>
            <TextInput 
              style={[styles.input, { backgroundColor: isDark ? '#1e293b' : '#f1f5f9', color: colors.text, borderColor: colors.border, marginBottom: 24 }]}
              value={newClientPhone} onChangeText={setNewClientPhone}
              keyboardType="phone-pad"
            />
            
            <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
              <TouchableOpacity 
                style={[styles.modalBtn, { backgroundColor: colors.border }]} 
                onPress={() => setAddClientVisible(false)}
              >
                <Text style={{color: colors.text, fontWeight: 'bold'}}>Anuluj</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalBtn, { backgroundColor: colors.primary }]} 
                onPress={handleAddClient}
                disabled={isAddingClient}
              >
                {isAddingClient ? <ActivityIndicator color="#fff"/> : <Text style={{color: '#fff', fontWeight: 'bold'}}>Dodaj</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

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
  submitBtnText: { color: '#ffffff', fontSize: 16, fontWeight: 'bold' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '90%', padding: 20, borderRadius: 12, elevation: 5, shadowColor: '#000', shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.25, shadowRadius: 3.84 },
  modalBtn: { flex: 1, padding: 14, borderRadius: 8, alignItems: 'center', marginHorizontal: 4 }
});
