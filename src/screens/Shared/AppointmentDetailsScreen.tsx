import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import { ChevronLeft, Star, Clock, User, CheckCircle2, FileText, Check, UserX } from 'lucide-react-native';
import { useThemeColors } from '../../theme/useThemeColors';
import api from '../../api/client';
import { AppointmentDto } from './AppointmentsScreen';

export const AppointmentDetailsScreen = () => {
  const { colors, isDark } = useThemeColors();
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  
  const { appointment } = route.params as { appointment: AppointmentDto };

  const [activeTab, setActiveTab] = useState<'current' | 'client'>('current');
  const [rating, setRating] = useState(0);
  const [clientDetails, setClientDetails] = useState<any>(null);
  const [loadingClient, setLoadingClient] = useState(false);
  const [clientAppointments, setClientAppointments] = useState<AppointmentDto[]>([]);
  const [appointmentNotes, setAppointmentNotes] = useState(appointment.notes || '');
  const [expandedHistoryId, setExpandedHistoryId] = useState<string | null>(null);

  const handleApprove = async () => {
    try {
      await api.post(`/Appointments/${appointment.id}/approve`);
      Alert.alert('Sukces', 'Wizyta została zatwierdzona.');
      navigation.goBack();
    } catch (e) {
      Alert.alert('Błąd', 'Nie udało się zatwierdzić wizyty.');
    }
  };

  const handleReject = async () => {
    try {
      await api.post(`/Appointments/${appointment.id}/reject`);
      Alert.alert('Sukces', 'Wizyta została odrzucona.');
      navigation.goBack();
    } catch (e) {
      Alert.alert('Błąd', 'Nie udało się odrzucić wizyty.');
    }
  };

  const handleComplete = async () => {
    try {
      // Zakładam, że endpoint do zrealizowania to PUT z statusem 3 lub podobnie, ale bez backendu użyjemy PUT /Appointments/{id}
      Alert.alert('Info', 'Funkcja zrealizowania wizyty w trakcie przygotowania na backendzie.');
    } catch (e) {
      Alert.alert('Błąd', 'Nie udało się zrealizować wizyty.');
    }
  };

  useEffect(() => {
    fetchClientData();
  }, []);

  const fetchClientData = async () => {
    setLoadingClient(true);
    try {
      const resClient = await api.get('/companyclients');
      const clients = resClient.data;
      const foundClient = clients.find((c: any) => c.id === appointment.clientId);
      if (foundClient) {
        setClientDetails(foundClient);
      }

      const resApps = await api.get('/Appointments');
      const allApps: AppointmentDto[] = resApps.data;
      const filteredApps = allApps.filter(a => a.clientId === appointment.clientId).sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
      setClientAppointments(filteredApps);
      
    } catch (e) {
      console.error('Error fetching client data', e);
    }
    setLoadingClient(false);
  };

  const handleRateClient = async () => {
    if (rating === 0) {
      Alert.alert('Błąd', 'Wybierz ocenę (od 1 do 5 gwiazdek).');
      return;
    }
    try {
      await api.post(`/companyclients/${appointment.clientId}/ratings`, {
        rating: rating,
        comment: appointmentNotes,
        appointmentId: appointment.id,
        employeeId: appointment.employeeId,
        serviceId: appointment.serviceId
      });
      Alert.alert('Sukces', 'Ocena klienta została zapisana!');
    } catch (e) {
      Alert.alert('Błąd', 'Nie udało się zapisać oceny.');
    }
  };

  const handleMarkAsCompleted = async () => {
    try {
      // Symulacja zrealizowania dla UX
      Alert.alert('Informacja', 'Wizyta zrealizowana!');
      navigation.goBack();
    } catch (e) {
      Alert.alert('Błąd', 'Wystąpił błąd podczas zapisywania.');
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ChevronLeft color={colors.text} size={28} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Karta Wizyty</Text>
        <View style={{ width: 28 }} />
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tabButton, activeTab === 'current' && [styles.activeTab, { borderBottomColor: colors.primary }]]}
          onPress={() => setActiveTab('current')}
        >
          <Text style={[styles.tabText, { color: activeTab === 'current' ? colors.primary : colors.textMuted }]}>
            Bieżąca Wizyta
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tabButton, activeTab === 'client' && [styles.activeTab, { borderBottomColor: colors.primary }]]}
          onPress={() => setActiveTab('client')}
        >
          <Text style={[styles.tabText, { color: activeTab === 'client' ? colors.primary : colors.textMuted }]}>
            Karta Klienta
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {activeTab === 'current' ? (
          <View>
            <View style={[styles.card, { backgroundColor: colors.surface, shadowColor: colors.cardShadow }]}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Szczegóły</Text>
              <View style={styles.detailsRow}>
                <User size={18} color={colors.textMuted} />
                <Text style={[styles.detailsText, { color: colors.text }]}>Klient: {appointment.clientName}</Text>
                {clientDetails && clientDetails.averageRating > 0 && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 8 }}>
                    <Star size={14} color="#fbbf24" fill="#fbbf24" />
                    <Text style={{ marginLeft: 4, fontWeight: 'bold', color: colors.text, fontSize: 14 }}>{clientDetails.averageRating.toFixed(1)}</Text>
                  </View>
                )}
              </View>
              {appointment.serviceName && (
                <View style={styles.detailsRow}>
                  <CheckCircle2 size={18} color={colors.textMuted} />
                  <Text style={[styles.detailsText, { color: colors.text }]}>Usługa: {appointment.serviceName}</Text>
                </View>
              )}
              <View style={styles.detailsRow}>
                <Clock size={18} color={colors.textMuted} />
                <Text style={[styles.detailsText, { color: colors.text }]}>
                  Czas: {new Date(appointment.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(appointment.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
              <View style={styles.detailsRow}>
                <User size={18} color={colors.textMuted} />
                <Text style={[styles.detailsText, { color: colors.text }]}>Pracownik: {appointment.employeeName}</Text>
              </View>
              {appointment.notes && (
                <View style={{ marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.border }}>
                  <Text style={{ fontSize: 13, fontWeight: 'bold', color: colors.textMuted, marginBottom: 4 }}>UWAGI DO REZERWACJI</Text>
                  <Text style={{ fontStyle: 'italic', color: colors.text }}>{appointment.notes}</Text>
                </View>
              )}
            </View>

            <View style={{ flexDirection: 'column', gap: 12, marginBottom: 24 }}>
              {appointment.status === 0 && (
                <View style={{ flexDirection: 'row', gap: 12 }}>
                  <TouchableOpacity style={[styles.actionBtn, { flex: 1, backgroundColor: '#10b981', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6 }]} onPress={handleApprove}>
                    <CheckCircle2 size={20} color="#fff" />
                    <Text style={styles.actionBtnText}>Zatwierdź</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.actionBtn, { flex: 1, backgroundColor: '#ef4444', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6 }]} onPress={handleReject}>
                    <UserX size={20} color="#fff" />
                    <Text style={styles.actionBtnText}>Odwołaj</Text>
                  </TouchableOpacity>
                </View>
              )}
              {appointment.status === 1 && (
                <View style={{ flexDirection: 'row', gap: 12 }}>
                  <TouchableOpacity 
                    style={[styles.actionBtn, { flex: 1, backgroundColor: isDark ? 'rgba(34, 197, 94, 0.15)' : '#dcfce7', borderColor: isDark ? 'rgba(34, 197, 94, 0.3)' : '#86efac', borderWidth: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, paddingVertical: 14 }]} 
                    onPress={handleComplete}
                  >
                    <CheckCircle2 size={22} color="#16a34a" />
                    <Text style={[styles.actionBtnText, { color: '#16a34a', fontSize: 16 }]}>Zrealizowana</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.actionBtn, { flex: 1, backgroundColor: isDark ? 'rgba(239, 68, 68, 0.1)' : '#fee2e2', borderColor: isDark ? 'rgba(239, 68, 68, 0.2)' : '#fca5a5', borderWidth: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, paddingVertical: 14 }]} 
                    onPress={handleReject}
                  >
                    <UserX size={22} color="#dc2626" />
                    <Text style={[styles.actionBtnText, { color: '#dc2626', fontSize: 16 }]}>Nie przyszedł</Text>
                  </TouchableOpacity>
                </View>
              )}
              {(appointment.status === 0 || appointment.status === 1) && (
                <TouchableOpacity 
                  style={[styles.actionBtn, { backgroundColor: colors.surface, borderColor: colors.primary, borderWidth: 1 }]} 
                  onPress={() => navigation.navigate('NewAppointment', { editAppointmentId: appointment.id })}
                >
                  <Text style={[styles.actionBtnText, { color: colors.primary }]}>Edytuj Termin</Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={[styles.card, { backgroundColor: colors.surface, shadowColor: colors.cardShadow }]}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Opis wizyty / Notatki</Text>
              <TextInput
                style={[styles.input, { backgroundColor: isDark ? '#1e293b' : '#f1f5f9', color: colors.text, borderColor: colors.border }]}
                multiline
                numberOfLines={4}
                placeholder="Dodaj notatkę po zabiegu..."
                placeholderTextColor={colors.textMuted}
                value={appointmentNotes}
                onChangeText={setAppointmentNotes}
              />
            </View>

            <View style={[styles.card, { backgroundColor: colors.surface, shadowColor: colors.cardShadow }]}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Oceń klienta po wizycie</Text>
              <View style={styles.starsContainer}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <TouchableOpacity key={star} onPress={() => setRating(star)} style={styles.starBtn}>
                    <Star 
                      size={32} 
                      color={star <= rating ? '#fbbf24' : colors.border} 
                      fill={star <= rating ? '#fbbf24' : 'transparent'} 
                    />
                  </TouchableOpacity>
                ))}
              </View>
              <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: colors.primary }]} onPress={handleRateClient}>
                <Text style={styles.primaryBtnText}>Zapisz ocenę</Text>
              </TouchableOpacity>
            </View>

          </View>
        ) : (
          <View>
            {loadingClient ? (
              <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
            ) : (
              <>
                {clientDetails && (
                  <View style={[styles.card, { backgroundColor: colors.surface, shadowColor: colors.cardShadow }]}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: 0 }]}>{clientDetails.firstName} {clientDetails.lastName}</Text>
                      {clientDetails.averageRating && clientDetails.averageRating > 0 && (
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <Star size={16} color="#fbbf24" fill="#fbbf24" />
                          <Text style={{ marginLeft: 4, fontWeight: 'bold', color: colors.text }}>{clientDetails.averageRating.toFixed(1)}</Text>
                        </View>
                      )}
                    </View>
                    <Text style={{ color: colors.textMuted, marginTop: 8 }}>Tel: {clientDetails.phoneNumber}</Text>
                    {clientDetails.notes && (
                      <View style={{ marginTop: 12, padding: 12, backgroundColor: isDark ? '#1e293b' : '#f8fafc', borderRadius: 8 }}>
                        <Text style={{ color: colors.text }}>{clientDetails.notes}</Text>
                      </View>
                    )}
                  </View>
                )}

                <Text style={[styles.sectionTitle, { color: colors.text, marginLeft: 8, marginTop: 16 }]}>Historia Wizyt</Text>
                {clientAppointments.length > 0 ? (
                  clientAppointments.map((app: any) => (
                    <TouchableOpacity 
                      key={app.id} 
                      style={[styles.historyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                      onPress={() => setExpandedHistoryId(expandedHistoryId === app.id ? null : app.id)}
                    >
                      <View style={styles.historyCardHeader}>
                        <Text style={{ fontWeight: 'bold', color: colors.text }}>{new Date(app.startTime).toLocaleDateString()}</Text>
                        <Text style={{ color: colors.primary, fontWeight: 'bold' }}>{app.serviceName}</Text>
                      </View>
                      <Text style={{ color: colors.textMuted, fontSize: 13, marginTop: 4 }}>Pracownik: {app.employeeName}</Text>
                      {expandedHistoryId === app.id && (
                        <View style={{ marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.border }}>
                          <Text style={{ fontSize: 13, fontWeight: 'bold', color: colors.textMuted, marginBottom: 4 }}>NOTATKI Z WIZYTY / UWAGI</Text>
                          <Text style={{ fontStyle: 'italic', color: colors.text }}>{app.notes || 'Brak uwag'}</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  ))
                ) : (
                  <Text style={{ color: colors.textMuted, textAlign: 'center', marginTop: 20 }}>Brak historycznych wizyt.</Text>
                )}
              </>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1 },
  backBtn: { padding: 4 },
  title: { fontSize: 18, fontWeight: 'bold' },
  tabContainer: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  tabButton: { flex: 1, paddingVertical: 16, alignItems: 'center' },
  activeTab: { borderBottomWidth: 2 },
  tabText: { fontWeight: '600', fontSize: 15 },
  scrollContent: { padding: 16 },
  card: { borderRadius: 12, padding: 16, marginBottom: 16, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 12 },
  detailsRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  detailsText: { marginLeft: 8, fontSize: 15 },
  input: { borderWidth: 1, borderRadius: 8, padding: 12, minHeight: 100, textAlignVertical: 'top' },
  starsContainer: { flexDirection: 'row', justifyContent: 'center', marginBottom: 20, gap: 8 },
  starBtn: { padding: 4 },
  primaryBtn: { padding: 14, borderRadius: 12, alignItems: 'center' },
  primaryBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  historyCard: { padding: 16, borderRadius: 12, marginBottom: 12, borderWidth: 1 },
  historyCardHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  actionBtn: { flex: 1, minWidth: '48%', paddingVertical: 12, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  actionBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 14 }
});
