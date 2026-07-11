import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, Modal, TextInput, Alert, Linking } from 'react-native';
import api from '../../api/client';
import { User, Phone, ChevronRight, Plus, X, Search, Mail, ArrowDownAZ, ArrowDown01 } from 'lucide-react-native';
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

  // Search & Sort state
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'visits'>('name');

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

  const handleCall = (phoneNumber: string) => {
    Linking.openURL(`tel:${phoneNumber}`).catch(() => {
      Alert.alert('Błąd', 'Nie można otworzyć aplikacji telefonu.');
    });
  };

  const handleEmail = (emailAddr: string) => {
    Linking.openURL(`mailto:${emailAddr}`).catch(() => {
      Alert.alert('Błąd', 'Nie można otworzyć aplikacji e-mail.');
    });
  };

  const processedClients = useMemo(() => {
    let filtered = clients.filter(c => {
      const q = searchQuery.toLowerCase();
      const fullName = `${c.firstName} ${c.lastName}`.toLowerCase();
      return fullName.includes(q) || 
             (c.phoneNumber && c.phoneNumber.includes(q)) || 
             (c.email && c.email.toLowerCase().includes(q));
    });

    return filtered.sort((a, b) => {
      if (sortBy === 'name') {
        const nameA = `${a.firstName} ${a.lastName}`.toLowerCase();
        const nameB = `${b.firstName} ${b.lastName}`.toLowerCase();
        return nameA.localeCompare(nameB);
      } else {
        return b.visitsCount - a.visitsCount;
      }
    });
  }, [clients, searchQuery, sortBy]);

  const renderItem = ({ item }: { item: ClientDto }) => {
    return (
      <View style={styles.card}>
        <View style={styles.cardTop}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{item.firstName.charAt(0)}{item.lastName.charAt(0)}</Text>
          </View>
          <View style={styles.info}>
            <Text style={styles.name}>{item.firstName} {item.lastName}</Text>
            <Text style={styles.visits}>Ilość wizyt: {item.visitsCount}</Text>
          </View>
          <ChevronRight color="#cbd5e1" size={24} />
        </View>
        
        {/* Contact Actions */}
        {(item.phoneNumber || item.email) && (
          <View style={styles.contactRow}>
            {item.phoneNumber && (
              <TouchableOpacity style={styles.contactBtn} onPress={() => handleCall(item.phoneNumber!)}>
                <Phone size={14} color="#3b82f6" style={{marginRight: 6}} />
                <Text style={styles.contactText}>{item.phoneNumber}</Text>
              </TouchableOpacity>
            )}
            {item.email && (
              <TouchableOpacity style={styles.contactBtn} onPress={() => handleEmail(item.email!)}>
                <Mail size={14} color="#3b82f6" style={{marginRight: 6}} />
                <Text style={styles.contactText} numberOfLines={1} ellipsizeMode="tail">{item.email}</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
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

      <View style={styles.toolsContainer}>
        <View style={styles.searchBox}>
          <Search color="#94a3b8" size={20} />
          <TextInput 
            style={styles.searchInput}
            placeholder="Szukaj klienta..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <X color="#94a3b8" size={16} />
            </TouchableOpacity>
          )}
        </View>
        <View style={styles.sortRow}>
          <Text style={styles.sortLabel}>Sortuj:</Text>
          <TouchableOpacity 
            style={[styles.sortBtn, sortBy === 'name' && styles.sortBtnActive]} 
            onPress={() => setSortBy('name')}
          >
            <ArrowDownAZ size={14} color={sortBy === 'name' ? '#ffffff' : '#64748b'} style={{marginRight: 4}} />
            <Text style={[styles.sortText, sortBy === 'name' && styles.sortTextActive]}>Alfabetycznie</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.sortBtn, sortBy === 'visits' && styles.sortBtnActive]} 
            onPress={() => setSortBy('visits')}
          >
            <ArrowDown01 size={14} color={sortBy === 'visits' ? '#ffffff' : '#64748b'} style={{marginRight: 4}} />
            <Text style={[styles.sortText, sortBy === 'visits' && styles.sortTextActive]}>Wg Wizyt</Text>
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={processedClients}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <Text style={styles.emptyText}>Brak klientów spełniających kryteria.</Text>
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
  
  toolsContainer: { padding: 16, backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f1f5f9', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, marginBottom: 12 },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 16, color: '#0f172a' },
  sortRow: { flexDirection: 'row', alignItems: 'center' },
  sortLabel: { fontSize: 14, color: '#64748b', marginRight: 12, fontWeight: '500' },
  sortBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f1f5f9', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, marginRight: 8 },
  sortBtnActive: { backgroundColor: '#3b82f6' },
  sortText: { fontSize: 13, color: '#64748b', fontWeight: '500' },
  sortTextActive: { color: '#ffffff', fontWeight: 'bold' },

  list: { padding: 16 },
  card: { backgroundColor: '#ffffff', borderRadius: 12, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#e2e8f0', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  avatarText: { fontSize: 16, fontWeight: 'bold', color: '#475569', textTransform: 'uppercase' },
  info: { flex: 1 },
  name: { fontSize: 16, fontWeight: 'bold', color: '#1e293b', marginBottom: 4 },
  visits: { fontSize: 13, color: '#94a3b8', marginTop: 2 },
  
  contactRow: { flexDirection: 'row', marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  contactBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#eff6ff', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, marginRight: 8, flex: 1, justifyContent: 'center' },
  contactText: { fontSize: 13, color: '#3b82f6', fontWeight: '500' },

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

