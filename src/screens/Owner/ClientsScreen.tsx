import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, Modal, TextInput, Alert } from 'react-native';
import api from '../../api/client';
import { User, Phone, ChevronRight, Plus, X } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface ClientDto {
  id: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  email?: string;
  visitsCount: number;
}

export const ClientsScreen = () => {
  const [clients, setClients] = useState<ClientDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  
  // Form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [creating, setCreating] = useState(false);

  const fetchClients = async () => {
    try {
      const res = await api.get('/CompanyClients');
      setClients(res.data);
    } catch (e) {
      console.error('Error fetching clients:', e);
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await fetchClients();
      setLoading(false);
    };
    init();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchClients();
    setRefreshing(false);
  };

  const handleAddClient = async () => {
    if (!firstName.trim() || !lastName.trim()) {
      Alert.alert('Błąd', 'Imię i nazwisko są wymagane.');
      return;
    }
    setCreating(true);
    try {
      await api.post('/CompanyClients', {
        firstName,
        lastName,
        phone,
        email
      });
      setModalVisible(false);
      setFirstName('');
      setLastName('');
      setPhone('');
      setEmail('');
      await fetchClients();
    } catch (e: any) {
      console.error('Error adding client', e);
      Alert.alert('Błąd', 'Nie udało się dodać klienta.');
    } finally {
      setCreating(false);
    }
  };

  const renderItem = ({ item }: { item: ClientDto }) => {
    return (
      <TouchableOpacity style={styles.card}>
        <View style={styles.cardLeft}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{item.firstName.charAt(0)}{item.lastName.charAt(0)}</Text>
          </View>
          <View style={styles.info}>
            <Text style={styles.name}>{item.firstName} {item.lastName}</Text>
            {item.phoneNumber && (
              <View style={styles.phoneRow}>
                <Phone size={14} color="#64748b" style={{marginRight: 4}} />
                <Text style={styles.phone}>{item.phoneNumber}</Text>
              </View>
            )}
            <Text style={styles.visits}>Ilość wizyt: {item.visitsCount}</Text>
          </View>
        </View>
        <ChevronRight color="#cbd5e1" size={24} />
      </TouchableOpacity>
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
        <Text style={styles.title}>Klienci Salonu</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => setModalVisible(true)}>
          <Plus color="#ffffff" size={20} />
          <Text style={styles.addButtonText}>Dodaj</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={clients}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <Text style={styles.emptyText}>Brak klientów w bazie.</Text>
        }
      />

      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Nowy Klient</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X color="#64748b" size={24} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Imię *</Text>
              <TextInput style={styles.input} value={firstName} onChangeText={setFirstName} placeholder="Wprowadź imię" />
            </View>
            
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Nazwisko *</Text>
              <TextInput style={styles.input} value={lastName} onChangeText={setLastName} placeholder="Wprowadź nazwisko" />
            </View>
            
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Telefon</Text>
              <TextInput style={styles.input} value={phone} onChangeText={setPhone} placeholder="Wprowadź nr telefonu" keyboardType="phone-pad" />
            </View>
            
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Email</Text>
              <TextInput style={styles.input} value={email} onChangeText={setEmail} placeholder="Wprowadź adres email" keyboardType="email-address" autoCapitalize="none" />
            </View>

            <TouchableOpacity style={[styles.submitButton, creating && styles.submitButtonDisabled]} onPress={handleAddClient} disabled={creating}>
              {creating ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitButtonText}>Dodaj Klienta</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  center: { justifyContent: 'center', alignItems: 'center' },
  header: { padding: 20, backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 20, fontWeight: 'bold', color: '#0f172a' },
  addButton: { flexDirection: 'row', backgroundColor: '#3b82f6', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  addButtonText: { color: '#ffffff', fontWeight: 'bold', marginLeft: 4 },
  list: { padding: 16 },
  card: { backgroundColor: '#ffffff', borderRadius: 12, padding: 16, marginBottom: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  cardLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#e2e8f0', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  avatarText: { fontSize: 16, fontWeight: 'bold', color: '#475569', textTransform: 'uppercase' },
  info: { flex: 1 },
  name: { fontSize: 16, fontWeight: 'bold', color: '#1e293b', marginBottom: 4 },
  phoneRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 2 },
  phone: { fontSize: 14, color: '#475569' },
  visits: { fontSize: 13, color: '#94a3b8', marginTop: 2 },
  emptyText: { textAlign: 'center', color: '#94a3b8', marginTop: 40 },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#ffffff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, paddingBottom: 40 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#0f172a' },
  inputContainer: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', color: '#334155', marginBottom: 8 },
  input: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8, padding: 12, fontSize: 16, color: '#0f172a' },
  submitButton: { backgroundColor: '#0f172a', borderRadius: 8, padding: 16, alignItems: 'center', marginTop: 8 },
  submitButtonDisabled: { backgroundColor: '#475569' },
  submitButtonText: { color: '#ffffff', fontSize: 16, fontWeight: '600' }
});
