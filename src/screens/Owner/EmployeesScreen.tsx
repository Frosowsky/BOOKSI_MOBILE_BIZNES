import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, Modal, TextInput, Alert, ScrollView } from 'react-native';
import api from '../../api/client';
import { User, Phone, CheckCircle2, XCircle, Plus, X, Power, Calendar, Search, ArrowDownAZ } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

interface EmployeeDto {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  jobTitle?: string;
  isActive: boolean;
}

export const EmployeesScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const [employees, setEmployees] = useState<EmployeeDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const [modalVisible, setModalVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [jobTitle, setJobTitle] = useState('');

  // Search & Sort state
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'lastName' | 'firstName'>('lastName');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const fetchEmployees = useCallback(async () => {
    try {
      const res = await api.get('/Employees');
      setEmployees(res.data);
    } catch (e) {
      console.error('Error fetching employees:', e);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await fetchEmployees();
      setLoading(false);
    };
    init();
  }, [fetchEmployees]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchEmployees();
    setRefreshing(false);
  };

  const handleAddEmployee = async () => {
    if (!firstName || !lastName || !email) {
      Alert.alert('Błąd', 'Imię, nazwisko i email są wymagane');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/Employees', {
        firstName,
        lastName,
        email,
        phoneNumber,
        jobTitle
      });
      setModalVisible(false);
      setFirstName('');
      setLastName('');
      setEmail('');
      setPhoneNumber('');
      setJobTitle('');
      await fetchEmployees();
    } catch (e: any) {
      Alert.alert('Błąd', e.response?.data?.Error || 'Nie udało się dodać pracownika');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = useCallback(async (id: string, currentStatus: boolean) => {
    Alert.alert(
      'Potwierdzenie',
      `Czy na pewno chcesz ${currentStatus ? 'dezaktywować' : 'aktywować'} tego pracownika?`,
      [
        { text: 'Anuluj', style: 'cancel' },
        { 
          text: 'Tak', 
          onPress: async () => {
            try {
              await api.put(`/Employees/${id}/deactivate`);
              await fetchEmployees();
            } catch (e) {
              Alert.alert('Błąd', 'Zapis statusu nie powiódł się.');
            }
          } 
        }
      ]
    );
  }, [fetchEmployees]);

  const handleSortToggle = (type: 'lastName' | 'firstName') => {
    if (sortBy === type) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(type);
      setSortOrder('asc');
    }
  };

  const processedEmployees = useMemo(() => {
    let filtered = employees.filter(e => {
      const q = searchQuery.toLowerCase();
      const fullName = `${e.firstName} ${e.lastName}`.toLowerCase();
      return fullName.includes(q) || 
             (e.jobTitle && e.jobTitle.toLowerCase().includes(q)) || 
             (e.email && e.email.toLowerCase().includes(q));
    });

    return filtered.sort((a, b) => {
      const multiplier = sortOrder === 'asc' ? 1 : -1;
      if (sortBy === 'lastName') {
        const nameA = `${a.lastName} ${a.firstName}`.toLowerCase();
        const nameB = `${b.lastName} ${b.firstName}`.toLowerCase();
        return nameA.localeCompare(nameB) * multiplier;
      } else {
        const nameA = `${a.firstName} ${a.lastName}`.toLowerCase();
        const nameB = `${b.firstName} ${b.lastName}`.toLowerCase();
        return nameA.localeCompare(nameB) * multiplier;
      }
    });
  }, [employees, searchQuery, sortBy, sortOrder]);

  const renderItem = useCallback(({ item }: { item: EmployeeDto }) => {
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.name}>{item.firstName} {item.lastName}</Text>
          <View style={[styles.badge, { backgroundColor: item.isActive ? '#dcfce7' : '#fee2e2' }]}>
            <Text style={[styles.badgeText, { color: item.isActive ? '#166534' : '#991b1b' }]}>
              {item.isActive ? 'Aktywny' : 'Nieaktywny'}
            </Text>
          </View>
        </View>
        {item.jobTitle && <Text style={styles.jobTitle}>{item.jobTitle}</Text>}
        <Text style={styles.email}>{item.email}</Text>
        <View style={styles.footer}>
          <View style={styles.phoneRow}>
            {item.phoneNumber && (
              <>
                <Phone size={14} color="#64748b" style={{marginRight: 6}} />
                <Text style={styles.phoneText}>{item.phoneNumber}</Text>
              </>
            )}
          </View>
          <View style={styles.actionsContainer}>
            <TouchableOpacity 
              style={[styles.actionBtn, { marginRight: 8 }]} 
              onPress={() => navigation.navigate('EmployeeSchedule', { employeeId: item.id, employeeName: `${item.firstName} ${item.lastName}` })}
            >
              <Calendar color="#3b82f6" size={20} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleToggleActive(item.id, item.isActive)} style={styles.actionBtn}>
              <Power color={item.isActive ? '#ef4444' : '#10b981'} size={20} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }, [handleToggleActive, navigation]);

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
        <Text style={styles.title}>Pracownicy Salonu</Text>
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
            placeholder="Szukaj pracownika..."
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
            style={[styles.sortBtn, sortBy === 'lastName' && styles.sortBtnActive]} 
            onPress={() => handleSortToggle('lastName')}
          >
            <ArrowDownAZ size={14} color={sortBy === 'lastName' ? '#ffffff' : '#64748b'} style={{marginRight: 4, transform: [{rotate: sortBy === 'lastName' && sortOrder === 'desc' ? '180deg' : '0deg'}]}} />
            <Text style={[styles.sortText, sortBy === 'lastName' && styles.sortTextActive]}>Po Nazwisku</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.sortBtn, sortBy === 'firstName' && styles.sortBtnActive]} 
            onPress={() => handleSortToggle('firstName')}
          >
            <ArrowDownAZ size={14} color={sortBy === 'firstName' ? '#ffffff' : '#64748b'} style={{marginRight: 4, transform: [{rotate: sortBy === 'firstName' && sortOrder === 'desc' ? '180deg' : '0deg'}]}} />
            <Text style={[styles.sortText, sortBy === 'firstName' && styles.sortTextActive]}>Po Imieniu</Text>
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={processedEmployees}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <Text style={styles.emptyText}>Brak pracowników w bazie.</Text>
        }
      />

      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Nowy Pracownik</Text>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <X color="#64748b" size={24} />
                </TouchableOpacity>
              </View>
              
              <Text style={styles.label}>Imię *</Text>
              <TextInput style={styles.input} value={firstName} onChangeText={setFirstName} placeholder="Imię" />
              
              <Text style={styles.label}>Nazwisko *</Text>
              <TextInput style={styles.input} value={lastName} onChangeText={setLastName} placeholder="Nazwisko" />
              
              <Text style={styles.label}>Email *</Text>
              <TextInput style={styles.input} value={email} onChangeText={setEmail} placeholder="adres@email.com" keyboardType="email-address" autoCapitalize="none" />
              
              <Text style={styles.label}>Telefon</Text>
              <TextInput style={styles.input} value={phoneNumber} onChangeText={setPhoneNumber} placeholder="Numer telefonu" keyboardType="phone-pad" />
              
              <Text style={styles.label}>Stanowisko</Text>
              <TextInput style={styles.input} value={jobTitle} onChangeText={setJobTitle} placeholder="np. Stylista" />

              <TouchableOpacity style={styles.submitButton} onPress={handleAddEmployee} disabled={submitting}>
                {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitButtonText}>Dodaj Pracownika</Text>}
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
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
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
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  name: { fontSize: 16, fontWeight: 'bold', color: '#1e293b' },
  jobTitle: { fontSize: 13, color: '#3b82f6', fontWeight: '500', marginBottom: 8 },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  badgeText: { fontSize: 12, fontWeight: '600' },
  email: { fontSize: 14, color: '#475569', marginBottom: 4 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  phoneRow: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  phoneText: { fontSize: 14, color: '#475569' },
  statusText: { fontSize: 12, color: '#475569', fontWeight: '500' },
  actionsBox: { alignItems: 'center' },
  actionsContainer: { flexDirection: 'row', alignItems: 'center' },
  actionBtn: { padding: 8, backgroundColor: '#f8fafc', borderRadius: 8, borderWidth: 1, borderColor: '#e2e8f0' },
  toggleBtn: { padding: 8, borderRadius: 8 },
  emptyText: { textAlign: 'center', color: '#94a3b8', marginTop: 40 },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#ffffff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, paddingBottom: 40, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#0f172a' },
  inputContainer: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', color: '#334155', marginBottom: 8, marginTop: 12 },
  input: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8, padding: 12, fontSize: 16, color: '#0f172a' },
  submitButton: { backgroundColor: '#0f172a', borderRadius: 8, padding: 16, alignItems: 'center', marginTop: 24 },
  submitButtonText: { color: '#ffffff', fontSize: 16, fontWeight: '600' }
});
