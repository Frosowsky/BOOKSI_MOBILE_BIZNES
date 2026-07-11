import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert, RefreshControl } from 'react-native';
import api from '../../api/client';
import { Clock, User, Check, X, CheckCircle2, Plus } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { useThemeColors } from '../../theme/useThemeColors';

LocaleConfig.locales['pl'] = {
  monthNames: ['Styczeń','Luty','Marzec','Kwiecień','Maj','Czerwiec','Lipiec','Sierpień','Wrzesień','Październik','Listopad','Grudzień'],
  monthNamesShort: ['Sty.','Lut.','Mar.','Kwi.','Maj','Cze.','Lip.','Sie.','Wrz.','Paź.','Lis.','Gru.'],
  dayNames: ['Niedziela','Poniedziałek','Wtorek','Środa','Czwartek','Piątek','Sobota'],
  dayNamesShort: ['Nd','Pn','Wt','Śr','Cz','Pt','Sb'],
  today: 'Dzisiaj'
};
LocaleConfig.defaultLocale = 'pl';

export interface AppointmentDto {
  id: string;
  clientId: string;
  clientName: string;
  clientPhone?: string;
  employeeId: string;
  employeeName: string;
  serviceId?: string;
  serviceName?: string;
  startTime: string;
  endTime: string;
  status: number; 
}

export const AppointmentsScreen = () => {
  const { colors, isDark } = useThemeColors();
  const [appointments, setAppointments] = useState<AppointmentDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const navigation = useNavigation<any>();

  const fetchAppointments = async () => {
    try {
      const res = await api.get('/Appointments');
      setAppointments(res.data);
    } catch (e) {
      console.error('Error fetching appointments', e);
    }
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchAppointments();
    });
    return unsubscribe;
  }, [navigation]);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await fetchAppointments();
      setLoading(false);
    };
    init();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAppointments();
    setRefreshing(false);
  };

  const handleApprove = async (id: string) => {
    try {
      await api.post(`/Appointments/${id}/approve`);
      Alert.alert('Sukces', 'Wizyta zatwierdzona!');
      fetchAppointments();
    } catch (e) {
      Alert.alert('Błąd', 'Nie udało się zatwierdzić wizyty.');
    }
  };

  const handleReject = async (id: string) => {
    try {
      await api.post(`/Appointments/${id}/reject`);
      Alert.alert('Sukces', 'Wizyta odrzucona.');
      fetchAppointments();
    } catch (e) {
      Alert.alert('Błąd', 'Nie udało się odrzucić wizyty.');
    }
  };

  const getStatusText = (status: number) => {
    switch(status) {
      case 0: return { text: 'Oczekująca', color: '#f59e0b', bg: '#fef3c7' };
      case 1: return { text: 'Potwierdzona', color: '#10b981', bg: '#dcfce7' };
      case 2: return { text: 'Anulowana', color: '#ef4444', bg: '#fee2e2' };
      case 3: return { text: 'Zakończona', color: '#3b82f6', bg: '#dbeafe' };
      default: return { text: 'Nieznany', color: '#64748b', bg: '#f1f5f9' };
    }
  };

  // Przygotowanie kalendarza (kropki w dni z wizytami)
  const markedDates: any = {};
  appointments.forEach(a => {
    const date = a.startTime.split('T')[0];
    markedDates[date] = { marked: true, dotColor: '#3b82f6' };
  });
  markedDates[selectedDate] = { 
    ...markedDates[selectedDate], 
    selected: true, 
    selectedColor: '#3b82f6' 
  };

  const filteredAppointments = appointments.filter(a => a.startTime.startsWith(selectedDate));

  const renderItem = ({ item }: { item: AppointmentDto }) => {
    const statusInfo = getStatusText(item.status);
    const startDate = new Date(item.startTime);
    
    return (
      <View style={[styles.card, { backgroundColor: colors.surface, shadowColor: colors.cardShadow }]}>
        <View style={styles.cardHeader}>
          <Text style={[styles.clientName, { color: colors.text }]}>{item.clientName}</Text>
          <View style={[styles.badge, { backgroundColor: isDark ? (item.status === 0 ? '#78350f' : item.status === 1 ? '#064e3b' : item.status === 2 ? '#7f1d1d' : item.status === 3 ? '#1e3a8a' : '#334155') : statusInfo.bg }]}>
            <Text style={[styles.badgeText, { color: isDark ? (item.status === 0 ? '#fde68a' : item.status === 1 ? '#6ee7b7' : item.status === 2 ? '#fca5a5' : item.status === 3 ? '#93c5fd' : colors.textMuted) : statusInfo.color }]}>{statusInfo.text}</Text>
          </View>
        </View>

        <View style={styles.detailsRow}>
          <Clock size={16} color={colors.textMuted} />
          <Text style={[styles.detailsText, { color: colors.textMuted }]}>
            {startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
        <View style={styles.detailsRow}>
          <User size={16} color={colors.textMuted} />
          <Text style={[styles.detailsText, { color: colors.textMuted }]}>Pracownik: {item.employeeName}</Text>
        </View>
        {item.serviceName && (
          <View style={styles.detailsRow}>
            <CheckCircle2 size={16} color={colors.textMuted} />
            <Text style={[styles.detailsText, { color: colors.textMuted }]}>Usługa: {item.serviceName}</Text>
          </View>
        )}

        {item.status === 0 && (
          <View style={styles.actionsRow}>
            <TouchableOpacity style={[styles.actionBtn, styles.approveBtn]} onPress={() => handleApprove(item.id)}>
              <Check size={16} color="#fff" style={{marginRight: 4}}/>
              <Text style={styles.actionBtnText}>Zatwierdź</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionBtn, styles.rejectBtn]} onPress={() => handleReject(item.id)}>
              <X size={16} color="#fff" style={{marginRight: 4}}/>
              <Text style={styles.actionBtnText}>Odrzuć</Text>
            </TouchableOpacity>
          </View>
        )}
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
        <Text style={[styles.title, { color: colors.text }]}>Lista Wizyt</Text>
        <TouchableOpacity onPress={() => navigation.navigate('NewAppointment')}>
          <Plus color={colors.primary} size={28} />
        </TouchableOpacity>
      </View>
      
      <Calendar
        key={isDark ? 'dark' : 'light'}
        onDayPress={(day: any) => setSelectedDate(day.dateString)}
        markedDates={markedDates}
        theme={{
          calendarBackground: colors.surface,
          selectedDayBackgroundColor: colors.primary,
          todayTextColor: colors.primary,
          arrowColor: colors.primary,
          dotColor: colors.primary,
          monthTextColor: colors.text,
          dayTextColor: colors.text,
          textDisabledColor: colors.textMuted,
          textMonthFontWeight: 'bold',
        }}
      />

      <FlatList
        data={filteredAppointments}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        ListEmptyComponent={
          <Text style={[styles.emptyText, { color: colors.textMuted }]}>Brak wizyt w tym dniu.</Text>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  center: { justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  title: { fontSize: 20, fontWeight: 'bold', color: '#0f172a' },
  list: { padding: 16 },
  card: { backgroundColor: '#ffffff', borderRadius: 12, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  clientName: { fontSize: 16, fontWeight: 'bold', color: '#1e293b' },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  badgeText: { fontSize: 12, fontWeight: '600' },
  detailsRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  detailsText: { marginLeft: 8, fontSize: 14, color: '#475569' },
  actionsRow: { flexDirection: 'row', marginTop: 12, gap: 8 },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 8, borderRadius: 8 },
  approveBtn: { backgroundColor: '#10b981' },
  rejectBtn: { backgroundColor: '#ef4444' },
  actionBtnText: { color: '#ffffff', fontWeight: '600', fontSize: 14 },
  emptyText: { textAlign: 'center', color: '#94a3b8', marginTop: 40 }
});
