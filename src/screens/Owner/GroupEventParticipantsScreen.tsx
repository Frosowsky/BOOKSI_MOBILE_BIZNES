import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Alert, TextInput, ScrollView } from 'react-native';
import api from '../../api/client';
import { useRoute, useNavigation } from '@react-navigation/native';
import { ChevronLeft, Users, Calendar, Clock, X, Plus } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemeColors } from '../../theme/useThemeColors';

export const GroupEventParticipantsScreen = () => {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { eventId, eventDetails } = route.params;
  const { colors, isDark } = useThemeColors();

  const [participants, setParticipants] = useState<any[]>([]);
  const [waitlist, setWaitlist] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'participants' | 'waitlist'>('participants');
  const [salonClients, setSalonClients] = useState<any[]>([]);

  // Add Participant Form
  const [showAddForm, setShowAddForm] = useState(false);
  const [guestFirstName, setGuestFirstName] = useState('');
  const [guestLastName, setGuestLastName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Cancel Participant
  const [showCancelForm, setShowCancelForm] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('');

  const fetchParticipants = useCallback(async () => {
    try {
      setLoading(true);
      const [partsRes, clientsRes, waitlistRes] = await Promise.all([
        api.get(`/groupevents/${eventId}/participants`),
        api.get('/companyclients'),
        api.get('/Waitlist')
      ]);
      setParticipants(partsRes.data);
      setSalonClients(clientsRes.data);
      
      const eventWaitlist = waitlistRes.data.filter((w: any) => w.groupEventId === eventId);
      setWaitlist(eventWaitlist);
    } catch (e) {
      console.error(e);
      Alert.alert('Błąd', 'Nie udało się pobrać uczestników.');
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    fetchParticipants();
  }, [fetchParticipants]);

  const handleAddParticipant = async () => {
    if (!guestFirstName || !guestLastName || !guestEmail) {
      return Alert.alert('Błąd', 'Wypełnij Imię, Nazwisko i E-mail');
    }
    setSubmitting(true);
    try {
      // Get salonId from eventDetails
      const profRes = await api.get('/salons/me');
      
      await api.post('/appointments/guest', {
        salonId: profRes.data.id,
        employeeId: eventDetails.employeeId,
        serviceId: eventDetails.serviceId,
        groupEventId: eventDetails.id,
        startTime: eventDetails.startTime,
        endTime: eventDetails.endTime,
        guestFirstName,
        guestLastName,
        guestEmail,
        guestPhone
      });
      Alert.alert('Sukces', 'Uczestnik został pomyślnie dodany!');
      setShowAddForm(false);
      setGuestFirstName('');
      setGuestLastName('');
      setGuestEmail('');
      setGuestPhone('');
      fetchParticipants();
    } catch (err: any) {
      Alert.alert('Błąd', err.response?.data?.message || 'Nie udało się dodać uczestnika.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelParticipant = async () => {
    if (!cancelReason) {
      return Alert.alert('Błąd', 'Podaj powód anulowania.');
    }
    setSubmitting(true);
    try {
      await api.post(`/appointments/${cancellingId}/reject`, { reason: cancelReason });
      Alert.alert('Sukces', 'Zapis uczestnika został odwołany.');
      setShowCancelForm(false);
      setCancellingId(null);
      setCancelReason('');
      fetchParticipants();
    } catch (err) {
      Alert.alert('Błąd', 'Wystąpił błąd podczas anulowania.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderParticipant = ({ item, index }: { item: any, index: number }) => (
    <View style={[styles.participantCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{index + 1}</Text>
        </View>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={[styles.participantName, { color: colors.text }]}>{item.clientName}</Text>
          {(item.clientEmail || item.clientPhone) && (
            <Text style={[styles.participantContact, { color: colors.textMuted }]}>
              {item.clientPhone ? `${item.clientPhone} • ` : ''}{item.clientEmail}
            </Text>
          )}
        </View>
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <View style={styles.badgeSuccess}>
          <Text style={styles.badgeSuccessText}>Zapisany</Text>
        </View>
        <TouchableOpacity 
          style={[styles.btnOutlineDanger, { borderColor: colors.error }]}
          onPress={() => {
            setCancellingId(item.appointmentId);
            setShowCancelForm(true);
          }}
        >
          <X size={14} color={colors.error} style={{marginRight: 4}} />
          <Text style={[styles.btnOutlineDangerText, { color: colors.error }]}>Odwołaj</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderWaitlist = ({ item, index }: { item: any, index: number }) => (
    <View style={[styles.participantCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
        <View style={[styles.avatar, { backgroundColor: colors.textMuted }]}>
          <Text style={styles.avatarText}>{index + 1}</Text>
        </View>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={[styles.participantName, { color: colors.text }]}>{item.clientName}</Text>
          <Text style={[styles.participantContact, { color: colors.textMuted }]}>
            {item.clientPhone ? `${item.clientPhone} • ` : ''}{item.clientEmail}
          </Text>
        </View>
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <View style={[styles.badgeSuccess, { backgroundColor: 'rgba(245,158,11,0.1)' }]}>
          <Text style={[styles.badgeSuccessText, { color: '#f59e0b' }]}>{item.status === 0 ? 'Oczekujący' : 'Propozycja'}</Text>
        </View>
        <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 4 }}>
          {new Date(item.requestedDate).toLocaleDateString()}
        </Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ChevronLeft color={colors.text} size={28} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Uczestnicy</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
        {eventDetails && (
          <View style={[styles.eventInfoCard, { backgroundColor: 'rgba(99,102,241,0.05)', borderColor: colors.border }]}>
            <Text style={[styles.eventName, { color: colors.primary }]}>{eventDetails.serviceName || eventDetails.name}</Text>
            <View style={styles.infoRow}>
              <Calendar size={14} color={colors.textMuted} style={{marginRight: 6}} />
              <Text style={[styles.infoText, { color: colors.textMuted }]}>{eventDetails.startTime?.substring(0, 10)}</Text>
            </View>
            <View style={styles.infoRow}>
              <Clock size={14} color={colors.textMuted} style={{marginRight: 6}} />
              <Text style={[styles.infoText, { color: colors.textMuted }]}>
                {eventDetails.startTime?.split('T')[1]?.substring(0,5)} - {eventDetails.endTime?.split('T')[1]?.substring(0,5)}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Users size={14} color={colors.textMuted} style={{marginRight: 6}} />
              <Text style={[styles.infoText, { color: colors.textMuted }]}>Prowadzący: {eventDetails.employeeName}</Text>
            </View>
          </View>
        )}

        <View style={styles.tabsContainer}>
          <TouchableOpacity 
            style={[styles.tabBtn, activeTab === 'participants' && { borderBottomColor: colors.primary }]}
            onPress={() => setActiveTab('participants')}
          >
            <Text style={[styles.tabText, { color: colors.textMuted }, activeTab === 'participants' && { color: colors.primary, fontWeight: 'bold' }]}>Zapisani ({participants.length})</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tabBtn, activeTab === 'waitlist' && { borderBottomColor: colors.primary }]}
            onPress={() => setActiveTab('waitlist')}
          >
            <Text style={[styles.tabText, { color: colors.textMuted }, activeTab === 'waitlist' && { color: colors.primary, fontWeight: 'bold' }]}>Lista Rezerwowa ({waitlist.length})</Text>
          </TouchableOpacity>
        </View>

        {showCancelForm ? (
          <View style={[styles.formContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.formTitle, { color: colors.error }]}>Odwołaj uczestnika</Text>
            <Text style={[styles.formSubtitle, { color: colors.textMuted }]}>
              Podaj powód odwołania udziału w szkoleniu. Klient otrzyma powiadomienie SMS / E-mail z tą informacją.
            </Text>
            <TextInput 
              style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text, height: 80 }]}
              placeholder="np. Niestety musimy odwołać to szkolenie z powodu..."
              placeholderTextColor={colors.textMuted}
              value={cancelReason}
              onChangeText={setCancelReason}
              multiline
              textAlignVertical="top"
            />
            <View style={styles.formActions}>
              <TouchableOpacity style={styles.btnSecondary} onPress={() => { setShowCancelForm(false); setCancellingId(null); }}>
                <Text style={styles.btnSecondaryText}>Anuluj</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btnDanger} onPress={handleCancelParticipant} disabled={submitting}>
                {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnDangerText}>Odwołaj</Text>}
              </TouchableOpacity>
            </View>
          </View>
        ) : showAddForm ? (
          <View style={[styles.formContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.formTitle, { color: colors.text }]}>Dodaj nowego uczestnika</Text>
            
            <Text style={[styles.label, { color: colors.text }]}>Wyszukaj z bazy (opcjonalnie)</Text>
            <TextInput 
              style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
              placeholder="Wpisz e-mail lub nazwisko..."
              placeholderTextColor={colors.textMuted}
              onChangeText={(val) => {
                const found = salonClients.find(c => `${c.firstName} ${c.lastName}`.includes(val) || c.email?.includes(val) || c.phoneNumber?.includes(val));
                if (found && val.length > 2) {
                  setGuestFirstName(found.firstName);
                  setGuestLastName(found.lastName);
                  setGuestEmail(found.email);
                  setGuestPhone(found.phoneNumber || '');
                }
              }}
            />

            <Text style={[styles.label, { color: colors.text }]}>Imię *</Text>
            <TextInput style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]} value={guestFirstName} onChangeText={setGuestFirstName} />
            
            <Text style={[styles.label, { color: colors.text }]}>Nazwisko *</Text>
            <TextInput style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]} value={guestLastName} onChangeText={setGuestLastName} />
            
            <Text style={[styles.label, { color: colors.text }]}>Email *</Text>
            <TextInput style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]} value={guestEmail} onChangeText={setGuestEmail} keyboardType="email-address" />
            
            <Text style={[styles.label, { color: colors.text }]}>Telefon</Text>
            <TextInput style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]} value={guestPhone} onChangeText={setGuestPhone} keyboardType="phone-pad" />

            <View style={styles.formActions}>
              <TouchableOpacity style={styles.btnSecondary} onPress={() => setShowAddForm(false)}>
                <Text style={styles.btnSecondaryText}>Anuluj</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btnPrimary} onPress={handleAddParticipant} disabled={submitting}>
                {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnPrimaryText}>Zapisz</Text>}
              </TouchableOpacity>
            </View>
          </View>
        ) : activeTab === 'participants' ? (
          <>
            <TouchableOpacity 
              style={[styles.addBtn, { borderColor: colors.border, backgroundColor: 'rgba(99,102,241,0.05)' }]}
              onPress={() => setShowAddForm(true)}
            >
              <Plus size={20} color={colors.primary} style={{marginRight: 8}} />
              <Text style={[styles.addBtnText, { color: colors.primary }]}>Dodaj uczestnika ręcznie</Text>
            </TouchableOpacity>

            {loading ? (
              <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
            ) : participants.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Users size={48} color={colors.border} />
                <Text style={[styles.emptyText, { color: colors.textMuted }]}>Nikt jeszcze nie zapisał się na to szkolenie.</Text>
              </View>
            ) : (
              <FlatList
                data={participants}
                keyExtractor={item => item.appointmentId}
                renderItem={renderParticipant}
                scrollEnabled={false}
              />
            )}
          </>
        ) : (
          <>
            {loading ? (
              <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
            ) : waitlist.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Clock size={48} color={colors.border} />
                <Text style={[styles.emptyText, { color: colors.textMuted }]}>Brak osób na liście rezerwowej.</Text>
              </View>
            ) : (
              <FlatList
                data={waitlist}
                keyExtractor={item => item.id}
                renderItem={renderWaitlist}
                scrollEnabled={false}
              />
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
  backBtn: { padding: 4 },
  title: { fontSize: 18, fontWeight: 'bold' },
  
  eventInfoCard: { padding: 16, borderRadius: 12, borderWidth: 1, marginBottom: 16 },
  eventName: { fontSize: 18, fontWeight: 'bold', marginBottom: 12 },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  infoText: { fontSize: 14 },
  
  addBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, borderRadius: 12, borderWidth: 1, borderStyle: 'dashed', marginBottom: 24 },
  addBtnText: { fontSize: 16, fontWeight: 'bold' },
  
  tabsContainer: { flexDirection: 'row', marginBottom: 16, borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  tabBtn: { flex: 1, paddingVertical: 12, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabText: { fontSize: 15 },

  participantCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderRadius: 12, borderWidth: 1, marginBottom: 12 },
  avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#6366f1', justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#ffffff', fontWeight: 'bold', fontSize: 16 },
  participantName: { fontSize: 16, fontWeight: 'bold' },
  participantContact: { fontSize: 13, marginTop: 4 },
  
  badgeSuccess: { backgroundColor: 'rgba(16,185,129,0.1)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, marginBottom: 8, alignSelf: 'flex-end' },
  badgeSuccessText: { color: '#10b981', fontSize: 12, fontWeight: 'bold' },
  btnOutlineDanger: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1 },
  btnOutlineDangerText: { fontSize: 12, fontWeight: 'bold' },
  
  emptyContainer: { alignItems: 'center', marginTop: 40 },
  emptyText: { marginTop: 16, fontSize: 15 },
  
  formContainer: { padding: 20, borderRadius: 12, borderWidth: 1 },
  formTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 16 },
  formSubtitle: { fontSize: 14, marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 8, marginTop: 12 },
  input: { borderWidth: 1, borderRadius: 8, padding: 12, fontSize: 15 },
  
  formActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 24 },
  btnSecondary: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8, backgroundColor: '#e2e8f0' },
  btnSecondaryText: { color: '#475569', fontWeight: 'bold' },
  btnPrimary: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8, backgroundColor: '#6366f1' },
  btnPrimaryText: { color: '#ffffff', fontWeight: 'bold' },
  btnDanger: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8, backgroundColor: '#ef4444' },
  btnDangerText: { color: '#ffffff', fontWeight: 'bold' },
});
