import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert, Modal, TextInput, ScrollView } from 'react-native';
import api from '../../api/client';
import { CreditCard, Plus, X, ArrowLeft, Gift, Edit3, Trash2 } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useThemeColors } from '../../theme/useThemeColors';

interface RewardDto {
  id: string;
  name: string;
  pointsRequired: number;
  description: string;
  isActive: boolean;
}

export const LoyaltyCardsScreen = () => {
  const { colors, isDark } = useThemeColors();
  const navigation = useNavigation();
  const [rewards, setRewards] = useState<RewardDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [pointsRequired, setPointsRequired] = useState('10');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchRewards = async () => {
    try {
      const res = await api.get('/Loyalty/rewards');
      setRewards(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await fetchRewards();
      setLoading(false);
    };
    init();
  }, []);

  const openNewRewardModal = () => {
    setIsEditing(false);
    setEditingId(null);
    setName('');
    setPointsRequired('10');
    setDescription('');
    setModalVisible(true);
  };

  const handleEditRewardInit = (reward: RewardDto) => {
    setIsEditing(true);
    setEditingId(reward.id);
    setName(reward.name);
    setPointsRequired(reward.pointsRequired.toString());
    setDescription(reward.description || '');
    setModalVisible(true);
  };

  const handleDeleteReward = (id: string) => {
    Alert.alert('Potwierdzenie', 'Czy na pewno chcesz usunąć tę nagrodę?', [
      { text: 'Anuluj', style: 'cancel' },
      { text: 'Usuń', style: 'destructive', onPress: async () => {
          try {
            await api.delete(`/Loyalty/rewards/${id}`);
            await fetchRewards();
          } catch (e) {
            Alert.alert('Błąd', 'Nie udało się usunąć nagrody');
          }
        }
      }
    ]);
  };

  const handleSaveReward = async () => {
    if (!name || !pointsRequired) return Alert.alert('Błąd', 'Wypełnij nazwę i punkty');
    setSubmitting(true);
    try {
      const payload = {
        name, 
        pointsRequired: parseInt(pointsRequired), 
        description,
        isActive: true
      };

      if (isEditing && editingId) {
        await api.put(`/Loyalty/rewards/${editingId}`, { id: editingId, ...payload });
      } else {
        await api.post('/Loyalty/rewards', payload);
      }

      setModalVisible(false);
      setName('');
      setPointsRequired('10');
      setDescription('');
      await fetchRewards();
    } catch (e) {
      Alert.alert('Błąd', 'Nie udało się zapisać nagrody');
    } finally {
      setSubmitting(false);
    }
  };

  const renderItem = useCallback(({ item }: { item: RewardDto }) => (
    <View style={[styles.card, { backgroundColor: colors.surface, shadowColor: colors.cardShadow }]}>
      <View style={styles.cardHeader}>
        <View style={{flexDirection: 'row', alignItems: 'center', flex: 1}}>
          <Gift size={20} color="#f59e0b" style={{marginRight: 8}} />
          <Text style={[styles.name, { color: colors.text }]}>{item.name}</Text>
        </View>
        <View style={styles.actions}>
          <TouchableOpacity onPress={() => handleEditRewardInit(item)} style={[styles.iconBtn, { backgroundColor: colors.background }]}>
            <Edit3 color={colors.textMuted} size={18} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleDeleteReward(item.id)} style={[styles.iconBtn, styles.deleteBtn]}>
            <Trash2 color={colors.error} size={18} />
          </TouchableOpacity>
        </View>
      </View>
      <View style={[styles.pointsBadge, { backgroundColor: isDark ? '#78350f' : '#fef3c7' }]}>
        <Text style={[styles.pointsText, { color: isDark ? '#fde68a' : '#b45309' }]}>Wymagane punkty: {item.pointsRequired}</Text>
      </View>
      {item.description ? <Text style={[styles.desc, { color: colors.textMuted }]}>{item.description}</Text> : null}
    </View>
  ), [colors, isDark]);

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color="#f59e0b" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{marginRight: 16}}>
          <ArrowLeft color={colors.text} size={24} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Program Lojalnościowy</Text>
        <View style={{flex: 1}} />
        <TouchableOpacity style={styles.addButton} onPress={openNewRewardModal}>
          <Plus color="#ffffff" size={20} />
        </TouchableOpacity>
      </View>

      <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>Zarządzanie Nagrodami</Text>
      
      <FlatList
        data={rewards}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={[styles.emptyText, { color: colors.textMuted }]}>Brak nagród. Dodaj pierwszą!</Text>}
      />

      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <ScrollView>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>{isEditing ? 'Edytuj Nagrodę' : 'Nowa Nagroda'}</Text>
                <TouchableOpacity onPress={() => setModalVisible(false)}><X color={colors.textMuted} size={24} /></TouchableOpacity>
              </View>
              
              <Text style={[styles.label, { color: colors.text }]}>Nazwa nagrody *</Text>
              <TextInput style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]} placeholderTextColor={colors.textMuted} value={name} onChangeText={setName} placeholder="np. Darmowe strzyżenie" />
              
              <Text style={[styles.label, { color: colors.text }]}>Wymagana liczba punktów *</Text>
              <TextInput style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]} placeholderTextColor={colors.textMuted} value={pointsRequired} onChangeText={setPointsRequired} keyboardType="numeric" />
              
              <Text style={[styles.label, { color: colors.text }]}>Opis opcjonalny</Text>
              <TextInput style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]} placeholderTextColor={colors.textMuted} value={description} onChangeText={setDescription} placeholder="Opis nagrody" />

              <TouchableOpacity style={styles.submitBtn} onPress={handleSaveReward} disabled={submitting}>
                {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>Zapisz Nagrodę</Text>}
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
  addButton: { backgroundColor: '#f59e0b', padding: 8, borderRadius: 8 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#475569', marginHorizontal: 16, marginTop: 16 },
  list: { padding: 16 },
  card: { backgroundColor: '#ffffff', borderRadius: 12, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  name: { fontSize: 16, fontWeight: 'bold', color: '#1e293b' },
  actions: { flexDirection: 'row', alignItems: 'center' },
  iconBtn: { padding: 6, backgroundColor: '#f1f5f9', borderRadius: 8, marginLeft: 8 },
  deleteBtn: { backgroundColor: '#fef2f2' },
  pointsBadge: { backgroundColor: '#fef3c7', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, alignSelf: 'flex-start', marginBottom: 8 },
  pointsText: { color: '#b45309', fontWeight: 'bold', fontSize: 13 },
  desc: { fontSize: 14, color: '#64748b' },
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
