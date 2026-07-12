import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, TextInput, Alert, Modal, FlatList } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, User, Phone, Mail, Clock, Calendar as CalendarIcon, FileText, ChevronRight } from 'lucide-react-native';
import { useThemeColors } from '../../theme/useThemeColors';
import api from '../../api/client';

interface ClientDetails {
  id: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  email?: string;
  averageRating: number;
  totalRatings: number;
  totalVisits: number;
  lastVisit?: string;
  totalSpent: string;
  registeredSince: string;
}

interface ClientHistory {
  id: string;
  date: string;
  service: string;
  employee: string;
  status: string;
  price: string;
  rating?: number;
}

export const ClientDetailsScreen = () => {
  const route = useRoute<any>();
  const navigation = useNavigation();
  const { colors, isDark } = useThemeColors();
  const clientId = route.params?.clientId;

  const [client, setClient] = useState<ClientDetails | null>(null);
  const [history, setHistory] = useState<ClientHistory[]>([]);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchClientDetails = async () => {
    try {
      const [detailsRes, historyRes, notesRes] = await Promise.all([
        api.get(`/companyclients/${clientId}`),
        api.get(`/companyclients/${clientId}/history`),
        api.get(`/companyclients/${clientId}/notes`)
      ]);
      setClient(detailsRes.data);
      setHistory(historyRes.data);
      setNotes(notesRes.data?.notes || '');
    } catch (e) {
      console.error(e);
      Alert.alert('Błąd', 'Nie udało się pobrać szczegółów klienta.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (clientId) fetchClientDetails();
  }, [clientId]);

  const handleSaveNotes = async () => {
    try {
      await api.post(`/companyclients/${clientId}/notes`, { notes });
      Alert.alert('Sukces', 'Notatki zapisane.');
    } catch (e) {
      Alert.alert('Błąd', 'Nie udało się zapisać notatek.');
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  if (!client) {
    return (
      <SafeAreaView style={[styles.container, styles.center, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.text }}>Nie znaleziono klienta.</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={{ color: colors.primary }}>Wróć</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const renderHistoryItem = ({ item }: { item: ClientHistory }) => (
    <View style={[styles.historyCard, { backgroundColor: colors.surface, shadowColor: colors.cardShadow }]}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
        <Text style={{ fontWeight: 'bold', color: colors.text, fontSize: 16 }}>{item.service}</Text>
        <Text style={{ color: colors.textMuted, fontSize: 14 }}>{item.date}</Text>
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Text style={{ color: colors.textMuted, fontSize: 14 }}>Pracownik: {item.employee}</Text>
        <Text style={{ fontWeight: 'bold', color: colors.primary }}>{item.price}</Text>
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
        <Text style={{ color: colors.textMuted, fontSize: 14 }}>Status: {item.status}</Text>
        {item.rating && item.rating > 0 ? (
          <Text style={{ color: '#fbbf24', fontWeight: 'bold' }}>Ocena: {item.rating} ⭐</Text>
        ) : null}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBackBtn}>
          <ChevronLeft color={colors.text} size={28} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Karta Klienta</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* Profil Klienta */}
        <View style={[styles.card, { backgroundColor: colors.surface, shadowColor: colors.cardShadow }]}>
          <View style={styles.profileRow}>
            <View style={[styles.avatar, { backgroundColor: isDark ? '#334155' : '#e2e8f0' }]}>
              <Text style={[styles.avatarText, { color: isDark ? '#cbd5e1' : '#475569' }]}>
                {client.firstName.charAt(0)}{client.lastName.charAt(0)}
              </Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={[styles.name, { color: colors.text }]}>{client.firstName} {client.lastName}</Text>
              {client.averageRating > 0 && (
                <Text style={{ color: '#fbbf24', fontSize: 16, fontWeight: 'bold', marginTop: 4 }}>
                  {client.averageRating.toFixed(1)} ⭐ <Text style={{ color: colors.textMuted, fontSize: 12, fontWeight: 'normal' }}>({client.totalRatings} ocen)</Text>
                </Text>
              )}
            </View>
          </View>
          
          <View style={styles.detailsGrid}>
            <View style={[styles.detailItem, { borderColor: colors.border }]}>
              <Text style={[styles.detailLabel, { color: colors.textMuted }]}>Wizyty</Text>
              <Text style={[styles.detailValue, { color: colors.text }]}>{client.totalVisits}</Text>
            </View>
            <View style={[styles.detailItem, { borderColor: colors.border }]}>
              <Text style={[styles.detailLabel, { color: colors.textMuted }]}>Wydano</Text>
              <Text style={[styles.detailValue, { color: colors.primary }]}>{client.totalSpent}</Text>
            </View>
          </View>
          <View style={styles.detailsGrid}>
            <View style={[styles.detailItem, { borderColor: colors.border }]}>
              <Text style={[styles.detailLabel, { color: colors.textMuted }]}>Ostatnia wizyta</Text>
              <Text style={[styles.detailValue, { color: colors.text }]}>{client.lastVisit ? new Date(client.lastVisit).toLocaleDateString() : 'Brak'}</Text>
            </View>
            <View style={[styles.detailItem, { borderColor: colors.border }]}>
              <Text style={[styles.detailLabel, { color: colors.textMuted }]}>Od kiedy z nami</Text>
              <Text style={[styles.detailValue, { color: colors.text }]}>{client.registeredSince}</Text>
            </View>
          </View>

          {/* Kontakt */}
          {(client.phoneNumber || client.email) && (
            <View style={[styles.contactSection, { borderTopColor: colors.border }]}>
              {client.phoneNumber && (
                <View style={styles.contactRow}>
                  <Phone size={16} color={colors.primary} />
                  <Text style={[styles.contactText, { color: colors.text }]}>{client.phoneNumber}</Text>
                </View>
              )}
              {client.email && (
                <View style={styles.contactRow}>
                  <Mail size={16} color={colors.primary} />
                  <Text style={[styles.contactText, { color: colors.text }]}>{client.email}</Text>
                </View>
              )}
            </View>
          )}
        </View>

        {/* Notatki */}
        <View style={[styles.card, { backgroundColor: colors.surface, shadowColor: colors.cardShadow }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Ogólne notatki o kliencie</Text>
          <TextInput
            style={[styles.notesInput, { backgroundColor: isDark ? '#334155' : '#f8fafc', color: colors.text, borderColor: colors.border }]}
            multiline
            placeholder="Alergie, preferencje..."
            placeholderTextColor={colors.textMuted}
            value={notes}
            onChangeText={setNotes}
            onBlur={handleSaveNotes}
          />
        </View>

        {/* Historia Wizyt */}
        <View style={[styles.card, { backgroundColor: colors.surface, shadowColor: colors.cardShadow }]}>
          <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: 16 }]}>Historia wizyt</Text>
          {history.length === 0 ? (
            <Text style={{ color: colors.textMuted, textAlign: 'center', marginVertical: 16 }}>Brak wcześniejszych wizyt.</Text>
          ) : (
            <FlatList
              data={history}
              keyExtractor={(item) => item.id}
              renderItem={renderHistoryItem}
              scrollEnabled={false}
            />
          )}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1 },
  headerBackBtn: { padding: 4 },
  title: { fontSize: 20, fontWeight: 'bold', flex: 1, textAlign: 'center' },
  scrollContent: { padding: 16, gap: 16 },
  card: { borderRadius: 16, padding: 20, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  profileRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  avatar: { width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 24, fontWeight: 'bold' },
  profileInfo: { marginLeft: 16, flex: 1 },
  name: { fontSize: 22, fontWeight: 'bold' },
  detailsGrid: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  detailItem: { flex: 1, padding: 12, borderRadius: 12, borderWidth: 1 },
  detailLabel: { fontSize: 12, marginBottom: 4, textTransform: 'uppercase', fontWeight: '600' },
  detailValue: { fontSize: 16, fontWeight: 'bold' },
  contactSection: { marginTop: 12, paddingTop: 16, borderTopWidth: 1, gap: 12 },
  contactRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  contactText: { fontSize: 16 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 12 },
  notesInput: { height: 120, borderRadius: 12, padding: 16, fontSize: 16, borderWidth: 1, textAlignVertical: 'top' },
  historyCard: { padding: 16, borderRadius: 12, marginBottom: 12, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  backBtn: { marginTop: 20, padding: 12 }
});
