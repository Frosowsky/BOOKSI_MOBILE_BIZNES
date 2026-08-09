import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, RefreshControl, TouchableOpacity, Modal, TextInput, Alert, ScrollView } from 'react-native';
import api from '../../api/client';
import { Clock, Plus, X, Trash2, Edit3, Search, Users, Calendar, Banknote, MapPin, FileText } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useThemeColors } from '../../theme/useThemeColors';
import { useAuth } from '../../context/AuthContext';

export const GroupEventsScreen = () => {
  const { userRole } = useAuth();
  const navigation = useNavigation<any>();
  const { colors, isDark } = useThemeColors();
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form Modals state
  const [eventModalVisible, setEventModalVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form Fields
  const [services, setServices] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [salonProfile, setSalonProfile] = useState<any>(null);
  
  const [eventName, setEventName] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [maxParticipants, setMaxParticipants] = useState('10');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('0');
  const [program, setProgram] = useState('');
  const [address, setAddress] = useState('');
  const [activeTab, setActiveTab] = useState<'basic' | 'program'>('basic');

  // Search state
  const [searchQuery, setSearchQuery] = useState('');

  const fetchData = async () => {
    try {
      const [eventsRes, srvRes, empRes, profRes] = await Promise.all([
        api.get('/groupevents/salon'),
        api.get('/Services'),
        api.get('/employees'),
        api.get('/salons/me')
      ]);
      setEvents(eventsRes.data);
      setServices(srvRes.data);
      setEmployees(empRes.data);
      setSalonProfile(profRes.data);
    } catch (e) {
      console.error('Error fetching data:', e);
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await fetchData();
      setLoading(false);
    };
    init();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, []);

  const getDefaultAddress = () => {
    if (!salonProfile) return '';
    const parts = [salonProfile.street, salonProfile.buildingNumber].filter(Boolean);
    const streetInfo = parts.join(' ');
    return [streetInfo, salonProfile.city].filter(Boolean).join(', ');
  };

  const handleOpenAddModal = () => {
    setIsEditing(false);
    setEditingId(null);
    setEventName('');
    setSelectedEmployee(employees.length > 0 ? employees[0].id : '');
    setEventDate('');
    setStartTime('');
    setEndTime('');
    setMaxParticipants('10');
    setDescription('');
    setPrice('0');
    setProgram('');
    setAddress(getDefaultAddress());
    setActiveTab('basic');
    setEventModalVisible(true);
  };

  const handleEditInit = (ev: any) => {
    setIsEditing(true);
    setEditingId(ev.id);
    setEventName(ev.name || ev.serviceName || '');
    setSelectedEmployee(ev.employeeId);
    setEventDate(ev.startTime.split('T')[0]);
    setStartTime(ev.startTime.split('T')[1].substring(0, 5));
    setEndTime(ev.endTime.split('T')[1].substring(0, 5));
    setMaxParticipants(ev.maxParticipants.toString());
    setDescription(ev.description || '');
    setPrice(ev.price?.toString() || '0');
    setProgram(ev.program || '');
    setAddress(ev.address || '');
    setActiveTab('basic');
    setEventModalVisible(true);
  };

  const handleDelete = (id: string) => {
    Alert.alert('Potwierdzenie', 'Czy na pewno chcesz usunąć to szkolenie? Spowoduje to odwołanie wszystkich rezerwacji.', [
      { text: 'Anuluj', style: 'cancel' },
      { text: 'Usuń', style: 'destructive', onPress: async () => {
          try {
            await api.delete(`/groupevents/${id}`);
            await fetchData();
          } catch (e) {
            Alert.alert('Błąd', 'Nie udało się usunąć szkolenia.');
          }
        }
      }
    ]);
  };

  const handleSave = async () => {
    if (!eventName || !selectedEmployee || !eventDate || !startTime || !endTime) {
      return Alert.alert('Błąd', 'Wypełnij wymagane pola (Nazwa, Prowadzący, Data, Godziny).');
    }
    
    setSubmitting(true);
    try {
      const startDateTime = `${eventDate}T${startTime}:00`;
      const endDateTime = `${eventDate}T${endTime}:00`;

      const payload = {
        employeeId: selectedEmployee,
        name: eventName,
        startTime: startDateTime,
        endTime: endDateTime,
        maxParticipants: parseInt(maxParticipants),
        description: description,
        price: parseFloat(price),
        program: program,
        address: address
      };

      if (isEditing && editingId) {
        await api.put(`/groupevents/${editingId}`, { ...payload, id: editingId });
      } else {
        await api.post('/groupevents', payload);
      }

      setEventModalVisible(false);
      await fetchData();
    } catch (e: any) {
      Alert.alert('Błąd', e.response?.data?.message || 'Nie udało się zapisać szkolenia');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredEvents = useMemo(() => {
    const q = searchQuery.toLowerCase();
    if (!q) return events;
    return events.filter(e => (e.name || e.serviceName || '').toLowerCase().includes(q));
  }, [events, searchQuery]);

  const renderEventCard = ({ item: ev }: { item: any }) => (
    <View style={[styles.card, { backgroundColor: colors.surface, shadowColor: colors.cardShadow }]}>
      <View style={styles.cardHeader}>
        <View style={{flex: 1}}>
          <Text style={[styles.name, { color: colors.text }]}>{ev.name || ev.serviceName}</Text>
          <Text style={[styles.desc, { color: colors.textMuted }]}>{ev.employeeName}</Text>
        </View>
        <View style={[styles.badge, { backgroundColor: 'rgba(99,102,241,0.1)' }]}>
          <Text style={[styles.badgeText, { color: colors.primary }]}>{ev.currentParticipants}/{ev.maxParticipants} miejsc</Text>
        </View>
      </View>
      
      <View style={[styles.infoGrid, { borderTopColor: colors.border }]}>
        <View style={styles.infoCol}>
          <View style={styles.infoRow}>
            <Calendar size={14} color={colors.textMuted} style={{marginRight: 6}} />
            <Text style={[styles.infoText, { color: colors.text }]}>{ev.startTime.substring(0,10)}</Text>
          </View>
          <View style={styles.infoRow}>
            <Clock size={14} color={colors.textMuted} style={{marginRight: 6}} />
            <Text style={[styles.infoText, { color: colors.text }]}>
              {ev.startTime.split('T')[1].substring(0,5)} - {ev.endTime.split('T')[1].substring(0,5)}
            </Text>
          </View>
        </View>
        <View style={[styles.infoCol, { alignItems: 'flex-end' }]}>
          <Text style={[styles.priceText, { color: colors.success }]}>{ev.price} PLN</Text>
        </View>
      </View>

      <View style={[styles.cardActions, { borderTopColor: colors.border }]}>
        <TouchableOpacity 
          style={[styles.btnAction, { backgroundColor: isDark ? 'rgba(99,102,241,0.2)' : 'rgba(99,102,241,0.1)' }]}
          onPress={() => navigation.navigate('GroupEventParticipants', { eventId: ev.id, eventDetails: ev })}
        >
          <Users size={16} color={colors.primary} style={{marginRight: 6}} />
          <Text style={[styles.btnActionText, { color: colors.primary }]}>Uczestnicy</Text>
        </TouchableOpacity>
        
        {userRole === 'SalonOwner' && (
          <View style={{flexDirection: 'row', gap: 8}}>
            <TouchableOpacity onPress={() => handleEditInit(ev)} style={[styles.iconBtn, { backgroundColor: colors.background }]}>
              <Edit3 color={colors.textMuted} size={18} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleDelete(ev.id)} style={[styles.iconBtn, styles.deleteBtn]}>
              <Trash2 color={colors.error} size={18} />
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );

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
        <Text style={[styles.title, { color: colors.text }]}>Szkolenia</Text>
        {userRole === 'SalonOwner' && (
          <TouchableOpacity style={[styles.addButton, { backgroundColor: colors.primary }]} onPress={handleOpenAddModal}>
            <Plus color="#ffffff" size={16} />
            <Text style={styles.addButtonText}>Dodaj</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={[styles.toolsContainer, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <View style={[styles.searchBox, { backgroundColor: isDark ? '#334155' : '#f1f5f9' }]}>
          <Search color={colors.textMuted} size={20} />
          <TextInput 
            style={[styles.searchInput, { color: colors.text }]}
            placeholderTextColor={colors.textMuted}
            placeholder="Szukaj szkolenia..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <X color={colors.textMuted} size={16} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <FlatList
        data={filteredEvents}
        keyExtractor={item => item.id}
        renderItem={renderEventCard}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={{marginTop: 40, alignItems: 'center'}}>
            <Calendar size={48} color={colors.border} style={{ marginBottom: 16 }} />
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>Brak szkoleń spełniających kryteria.</Text>
          </View>
        }
      />

      {/* Modal - Dodaj/Edytuj Szkolenie */}
      <Modal visible={eventModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>{isEditing ? 'Edytuj Szkolenie' : 'Nowe Szkolenie'}</Text>
              <TouchableOpacity onPress={() => setEventModalVisible(false)}><X color={colors.textMuted} size={24} /></TouchableOpacity>
            </View>

            <View style={styles.modalTabs}>
              <TouchableOpacity 
                style={[styles.modalTab, activeTab === 'basic' && { borderBottomColor: colors.primary }]}
                onPress={() => setActiveTab('basic')}
              >
                <Text style={[styles.modalTabText, { color: colors.textMuted }, activeTab === 'basic' && { color: colors.primary, fontWeight: 'bold' }]}>Podstawowe</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalTab, activeTab === 'program' && { borderBottomColor: colors.primary }]}
                onPress={() => setActiveTab('program')}
              >
                <Text style={[styles.modalTabText, { color: colors.textMuted }, activeTab === 'program' && { color: colors.primary, fontWeight: 'bold' }]}>Szczegóły / Program</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24, paddingTop: 16 }}>
              {activeTab === 'basic' ? (
                <>
                  <Text style={[styles.label, { color: colors.text }]}>Nazwa Szkolenia *</Text>
                  <TextInput 
                    style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]} 
                    placeholderTextColor={colors.textMuted} 
                    value={eventName} 
                    onChangeText={setEventName} 
                    placeholder="np. Warsztaty ze strzyżenia" 
                  />

                  <Text style={[styles.label, { color: colors.text }]}>Prowadzący (Pracownik) *</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{marginBottom: 16}}>
                    {employees.map(e => (
                      <TouchableOpacity 
                        key={e.id} 
                        style={[styles.chip, { backgroundColor: colors.background, borderColor: colors.border }, selectedEmployee === e.id && { backgroundColor: isDark ? '#1e3a8a' : '#eff6ff', borderColor: colors.primary }]}
                        onPress={() => setSelectedEmployee(e.id)}
                      >
                        <Text style={[styles.chipText, { color: colors.textMuted }, selectedEmployee === e.id && { color: isDark ? '#93c5fd' : '#3b82f6', fontWeight: 'bold' }]}>{e.firstName} {e.lastName}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>

                  <Text style={[styles.label, { color: colors.text }]}>Data * (YYYY-MM-DD)</Text>
                  <TextInput style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]} placeholderTextColor={colors.textMuted} value={eventDate} onChangeText={setEventDate} placeholder="np. 2026-10-15" />

                  <View style={{ flexDirection: 'row', gap: 12 }}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.label, { color: colors.text }]}>Od * (HH:MM)</Text>
                      <TextInput style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]} placeholderTextColor={colors.textMuted} value={startTime} onChangeText={setStartTime} placeholder="09:00" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.label, { color: colors.text }]}>Do * (HH:MM)</Text>
                      <TextInput style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]} placeholderTextColor={colors.textMuted} value={endTime} onChangeText={setEndTime} placeholder="17:00" />
                    </View>
                  </View>

                  <View style={{ flexDirection: 'row', gap: 12, marginTop: 12 }}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.label, { color: colors.text }]}>Cena (PLN)</Text>
                      <TextInput style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]} placeholderTextColor={colors.textMuted} value={price} onChangeText={setPrice} keyboardType="numeric" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.label, { color: colors.text }]}>Max. osób</Text>
                      <TextInput style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]} placeholderTextColor={colors.textMuted} value={maxParticipants} onChangeText={setMaxParticipants} keyboardType="numeric" />
                    </View>
                  </View>

                  <Text style={[styles.label, { color: colors.text }]}>Krótki opis widoczny na liście</Text>
                  <TextInput style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text, height: 80 }]} placeholderTextColor={colors.textMuted} value={description} onChangeText={setDescription} placeholder="Opcjonalny opis" multiline textAlignVertical="top" />
                </>
              ) : (
                <>
                  <Text style={[styles.label, { color: colors.text }]}>Adres Szkolenia</Text>
                  <TextInput style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]} placeholderTextColor={colors.textMuted} value={address} onChangeText={setAddress} placeholder="Wpisz dokładny adres" />

                  <Text style={[styles.label, { color: colors.text }]}>Szczegółowy Program (dla klientów)</Text>
                  <TextInput style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text, height: 150 }]} placeholderTextColor={colors.textMuted} value={program} onChangeText={setProgram} placeholder="Wpisz program szkolenia..." multiline textAlignVertical="top" />
                </>
              )}
            </ScrollView>
            
            <View style={{ paddingTop: 16, borderTopWidth: 1, borderTopColor: colors.border }}>
              <TouchableOpacity style={styles.submitBtn} onPress={handleSave} disabled={submitting}>
                {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>Zapisz Szkolenie</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { justifyContent: 'center', alignItems: 'center' },
  header: { padding: 20, borderBottomWidth: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 20, fontWeight: 'bold' },
  addButton: { flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  addButtonText: { color: '#ffffff', fontWeight: 'bold', marginLeft: 4 },
  
  toolsContainer: { padding: 16, borderBottomWidth: 1 },
  searchBox: { flexDirection: 'row', alignItems: 'center', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8 },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 16 },
  
  list: { padding: 16 },
  card: { borderRadius: 12, padding: 16, marginBottom: 12, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  name: { fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
  desc: { fontSize: 14 },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  badgeText: { fontSize: 12, fontWeight: 'bold' },
  
  infoGrid: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 12, borderTopWidth: 1 },
  infoCol: { flex: 1, gap: 6 },
  infoRow: { flexDirection: 'row', alignItems: 'center' },
  infoText: { fontSize: 13, fontWeight: '500' },
  priceText: { fontSize: 15, fontWeight: 'bold' },
  
  cardActions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, paddingTop: 12, borderTopWidth: 1 },
  btnAction: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  btnActionText: { fontWeight: 'bold', fontSize: 13 },
  iconBtn: { padding: 8, borderRadius: 8 },
  deleteBtn: { backgroundColor: '#fef2f2' },
  emptyText: { textAlign: 'center' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, paddingBottom: 40, maxHeight: '90%', height: '85%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 20, fontWeight: 'bold' },
  modalTabs: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#e2e8f0', marginBottom: 16 },
  modalTab: { flex: 1, paddingVertical: 12, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  modalTabText: { fontSize: 14 },
  
  label: { fontSize: 14, fontWeight: '600', marginBottom: 8, marginTop: 12 },
  input: { borderWidth: 1, borderRadius: 8, padding: 12, fontSize: 15 },
  submitBtn: { backgroundColor: '#0f172a', borderRadius: 8, padding: 16, alignItems: 'center' },
  submitBtnText: { color: '#ffffff', fontSize: 16, fontWeight: '600' },
  
  chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, marginRight: 8, borderWidth: 1 },
  chipText: { fontWeight: '500' },
});
