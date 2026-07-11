import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert, Modal, TextInput, ScrollView } from 'react-native';
import api from '../../api/client';
import { Megaphone, Send, Plus, X, ArrowLeft } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useThemeColors } from '../../theme/useThemeColors';

interface CampaignDto {
  id: string;
  name: string;
  message: string;
  status: string;
  createdAt: string;
}

export const MarketingScreen = () => {
  const { colors, isDark } = useThemeColors();
  const navigation = useNavigation();
  const [campaigns, setCampaigns] = useState<CampaignDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchCampaigns = async () => {
    try {
      const res = await api.get('/Marketing/campaigns');
      setCampaigns(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await fetchCampaigns();
      setLoading(false);
    };
    init();
  }, []);

  const handleCreate = async () => {
    if (!name || !message) return Alert.alert('Błąd', 'Wypełnij wszystkie pola');
    setSubmitting(true);
    try {
      await api.post('/Marketing/campaigns', { name, message, status: 'Draft', createdAt: new Date().toISOString() });
      setModalVisible(false);
      setName('');
      setMessage('');
      await fetchCampaigns();
    } catch (e) {
      Alert.alert('Błąd', 'Nie udało się stworzyć kampanii');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSend = useCallback((id: string) => {
    Alert.alert('Wysyłanie', 'Czy chcesz wysłać tę kampanię do wszystkich klientów?', [
      { text: 'Anuluj', style: 'cancel' },
      { text: 'Wyślij', onPress: async () => {
          try {
            await api.post(`/Marketing/campaigns/${id}/send`);
            Alert.alert('Sukces', 'Kampania wysłana');
            await fetchCampaigns();
          } catch(e) {
            Alert.alert('Błąd', 'Wysyłanie nie powiodło się');
          }
        }}
    ]);
  }, []);

  const renderItem = useCallback(({ item }: { item: CampaignDto }) => (
    <View style={[styles.card, { backgroundColor: colors.surface, shadowColor: colors.cardShadow }]}>
      <View style={styles.cardHeader}>
        <Text style={[styles.name, { color: colors.text }]}>{item.name}</Text>
        <View style={[styles.badge, { backgroundColor: item.status === 'Sent' ? (isDark ? '#064e3b' : '#dcfce7') : (isDark ? '#334155' : '#f1f5f9') }]}>
          <Text style={[styles.badgeText, { color: item.status === 'Sent' ? (isDark ? '#86efac' : '#166534') : colors.textMuted }]}>
            {item.status === 'Sent' ? 'Wysłana' : 'Szkic'}
          </Text>
        </View>
      </View>
      <Text style={[styles.msg, { color: colors.textMuted }]}>{item.message}</Text>
      <View style={[styles.footer, { borderTopColor: colors.border }]}>
        <Text style={[styles.date, { color: colors.textMuted }]}>{new Date(item.createdAt).toLocaleDateString()}</Text>
        {item.status !== 'Sent' && (
          <TouchableOpacity style={[styles.sendBtn, { backgroundColor: colors.success }]} onPress={() => handleSend(item.id)}>
            <Send size={16} color="#ffffff" />
            <Text style={styles.sendBtnText}>Wyślij</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  ), [handleSend, colors, isDark]);

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
        <TouchableOpacity onPress={() => navigation.goBack()} style={{marginRight: 16}}>
          <ArrowLeft color={colors.text} size={24} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Marketing</Text>
        <View style={{flex: 1}} />
        <TouchableOpacity style={[styles.addButton, { backgroundColor: colors.primary }]} onPress={() => setModalVisible(true)}>
          <Plus color="#ffffff" size={20} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={campaigns}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={[styles.emptyText, { color: colors.textMuted }]}>Brak kampanii.</Text>}
      />

      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <ScrollView>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>Nowa Kampania</Text>
                <TouchableOpacity onPress={() => setModalVisible(false)}><X color={colors.textMuted} size={24} /></TouchableOpacity>
              </View>
              <Text style={[styles.label, { color: colors.text }]}>Nazwa (tylko dla Ciebie) *</Text>
              <TextInput style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]} placeholderTextColor={colors.textMuted} value={name} onChangeText={setName} placeholder="np. Promocja Świąteczna" />
              
              <Text style={[styles.label, { color: colors.text }]}>Treść wiadomości (SMS/Email) *</Text>
              <TextInput style={[styles.input, {height: 100, backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]} placeholderTextColor={colors.textMuted} value={message} onChangeText={setMessage} multiline textAlignVertical="top" placeholder="Witaj! Mamy dla Ciebie promocję..." />

              <TouchableOpacity style={styles.submitBtn} onPress={handleCreate} disabled={submitting}>
                {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>Zapisz Szkic</Text>}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  center: { justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  title: { fontSize: 20, fontWeight: 'bold', color: '#0f172a' },
  addButton: { backgroundColor: '#3b82f6', padding: 8, borderRadius: 8 },
  list: { padding: 16 },
  card: { backgroundColor: '#ffffff', borderRadius: 12, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  name: { fontSize: 16, fontWeight: 'bold', color: '#1e293b' },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  badgeText: { fontSize: 12, fontWeight: '600' },
  msg: { fontSize: 14, color: '#475569', marginBottom: 16 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 12 },
  date: { fontSize: 12, color: '#94a3b8' },
  sendBtn: { flexDirection: 'row', backgroundColor: '#10b981', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, alignItems: 'center' },
  sendBtnText: { color: '#ffffff', fontWeight: '600', marginLeft: 4, fontSize: 14 },
  emptyText: { textAlign: 'center', color: '#94a3b8', marginTop: 40 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#ffffff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, paddingBottom: 40, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#0f172a' },
  label: { fontSize: 14, fontWeight: '600', color: '#334155', marginBottom: 8, marginTop: 12 },
  input: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8, padding: 12, fontSize: 16, color: '#0f172a' },
  submitBtn: { backgroundColor: '#0f172a', borderRadius: 8, padding: 16, alignItems: 'center', marginTop: 24 },
  submitBtnText: { color: '#ffffff', fontSize: 16, fontWeight: '600' }
});
