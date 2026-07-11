import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert, Modal, TextInput, ScrollView } from 'react-native';
import api from '../../api/client';
import { CheckCircle2, XCircle, Clock, Plus, X, ArrowLeft, MoreHorizontal } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

interface WaitlistEntry {
  id: string;
  clientId: string;
  clientName: string;
  serviceId?: string;
  requestedDate: string;
  status: string; // Pending, Notified, Confirmed, Cancelled
  notes?: string;
}

export const WaitlistScreen = () => {
  const navigation = useNavigation();
  const [entries, setEntries] = useState<WaitlistEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchWaitlist = async () => {
    try {
      const res = await api.get('/Waitlist');
      setEntries(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await fetchWaitlist();
      setLoading(false);
    };
    init();
  }, []);

  const handleUpdateStatus = useCallback(async (id: string, newStatus: string) => {
    try {
      await api.put(`/Waitlist/${id}/status`, { status: newStatus });
      await fetchWaitlist();
    } catch (e) {
      Alert.alert('Błąd', 'Nie udało się zmienić statusu.');
    }
  }, []);

  const handleDelete = useCallback(async (id: string) => {
    Alert.alert('Usuń', 'Czy chcesz usunąć z listy rezerwowej?', [
      { text: 'Anuluj', style: 'cancel' },
      { text: 'Usuń', style: 'destructive', onPress: async () => {
          try {
            await api.delete(`/Waitlist/${id}`);
            await fetchWaitlist();
          } catch(e) { Alert.alert('Błąd', 'Nie udało się usunąć'); }
      }}
    ]);
  }, []);

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'Pending': return { bg: '#fef3c7', text: '#d97706', label: 'Oczekujący' };
      case 'Notified': return { bg: '#dbeafe', text: '#2563eb', label: 'Powiadomiony' };
      case 'Confirmed': return { bg: '#dcfce7', text: '#166534', label: 'Zrealizowany' };
      case 'Cancelled': return { bg: '#fee2e2', text: '#991b1b', label: 'Anulowany' };
      default: return { bg: '#f1f5f9', text: '#475569', label: status };
    }
  };

  const renderItem = useCallback(({ item }: { item: WaitlistEntry }) => {
    const badge = getStatusBadge(item.status);
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.name}>{item.clientName}</Text>
          <View style={[styles.badge, { backgroundColor: badge.bg }]}>
            <Text style={[styles.badgeText, { color: badge.text }]}>{badge.label}</Text>
          </View>
        </View>
        <Text style={styles.dateText}>Preferowana data: {new Date(item.requestedDate).toLocaleDateString()}</Text>
        {item.notes && <Text style={styles.notes}>{item.notes}</Text>}
        
        <View style={styles.actions}>
          {item.status === 'Pending' && (
            <TouchableOpacity style={[styles.btn, styles.notifyBtn]} onPress={() => handleUpdateStatus(item.id, 'Notified')}>
              <Text style={styles.btnTextNotify}>Oznacz jako powiadomiony</Text>
            </TouchableOpacity>
          )}
          {item.status === 'Notified' && (
            <TouchableOpacity style={[styles.btn, styles.confirmBtn]} onPress={() => handleUpdateStatus(item.id, 'Confirmed')}>
              <Text style={styles.btnTextConfirm}>Potwierdź rezerwację</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={[styles.btn, styles.cancelBtn]} onPress={() => handleDelete(item.id)}>
            <Text style={styles.btnTextCancel}>Usuń</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }, [handleUpdateStatus, handleDelete]);

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
        <TouchableOpacity onPress={() => navigation.goBack()} style={{marginRight: 16}}>
          <ArrowLeft color="#0f172a" size={24} />
        </TouchableOpacity>
        <Text style={styles.title}>Lista Rezerwowa</Text>
      </View>

      <FlatList
        data={entries}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.emptyText}>Brak osób na liście rezerwowej.</Text>}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  center: { justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  title: { fontSize: 20, fontWeight: 'bold', color: '#0f172a' },
  list: { padding: 16 },
  card: { backgroundColor: '#ffffff', borderRadius: 12, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  name: { fontSize: 16, fontWeight: 'bold', color: '#1e293b' },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  badgeText: { fontSize: 12, fontWeight: '600' },
  dateText: { fontSize: 14, color: '#475569', marginBottom: 4 },
  notes: { fontSize: 13, color: '#64748b', fontStyle: 'italic', marginBottom: 12 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12, borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 12 },
  btn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6, borderWidth: 1 },
  notifyBtn: { backgroundColor: '#eff6ff', borderColor: '#bfdbfe' },
  btnTextNotify: { color: '#2563eb', fontWeight: '500', fontSize: 13 },
  confirmBtn: { backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' },
  btnTextConfirm: { color: '#16a34a', fontWeight: '500', fontSize: 13 },
  cancelBtn: { backgroundColor: '#fef2f2', borderColor: '#fecaca' },
  btnTextCancel: { color: '#dc2626', fontWeight: '500', fontSize: 13 },
  emptyText: { textAlign: 'center', color: '#94a3b8', marginTop: 40 },
});
