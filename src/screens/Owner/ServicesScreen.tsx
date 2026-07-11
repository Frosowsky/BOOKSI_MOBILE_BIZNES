import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, RefreshControl, TouchableOpacity, Modal, TextInput, Alert, ScrollView } from 'react-native';
import api from '../../api/client';
import { Clock, Plus, X, Trash2, Tag, Banknote, Edit3, Search, ArrowDownAZ, LayoutList } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface ServiceDto {
  id: string;
  name: string;
  description?: string;
  durationMinutes: number;
  price: number;
  categoryId: string;
}

interface CategoryDto {
  id: string;
  name: string;
  description?: string;
}

export const ServicesScreen = () => {
  const [services, setServices] = useState<ServiceDto[]>([]);
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Modals state
  const [serviceModalVisible, setServiceModalVisible] = useState(false);
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Service form
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [sName, setSName] = useState('');
  const [sDesc, setSDesc] = useState('');
  const [sDuration, setSDuration] = useState('60');
  const [sPrice, setSPrice] = useState('100');
  const [sCatId, setSCatId] = useState('');

  // Category form
  const [cName, setCName] = useState('');
  const [cDesc, setCDesc] = useState('');

  // Search & Sort state
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'category' | 'name'>('category');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const fetchData = async () => {
    try {
      const [srvRes, catRes] = await Promise.all([
        api.get('/Services'),
        api.get('/ServiceCategories')
      ]);
      setServices(srvRes.data);
      setCategories(catRes.data);
      if (catRes.data.length > 0 && !sCatId) {
        setSCatId(catRes.data[0].id);
      }
    } catch (e) {
      console.error('Error fetching data:', e);
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await fetchData();
      setLoading(false);
    };
    init();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, []);

  const handleDeleteService = useCallback((id: string) => {
    Alert.alert('Potwierdzenie', 'Czy na pewno chcesz usunąć tę usługę?', [
      { text: 'Anuluj', style: 'cancel' },
      { text: 'Usuń', style: 'destructive', onPress: async () => {
          try {
            await api.delete(`/Services/${id}`);
            await fetchData();
          } catch (e) {
            Alert.alert('Błąd', 'Nie udało się usunąć usługi.');
          }
        }
      }
    ]);
  }, []);

  const handleEditServiceInit = useCallback((srv: ServiceDto) => {
    setIsEditing(true);
    setEditingId(srv.id);
    setSName(srv.name);
    setSDesc(srv.description || '');
    setSPrice(srv.price.toString());
    setSDuration(srv.durationMinutes.toString());
    setSCatId(srv.categoryId);
    setServiceModalVisible(true);
  }, []);

  const handleAddCategory = async () => {
    if (!cName) return Alert.alert('Błąd', 'Nazwa jest wymagana');
    setSubmitting(true);
    try {
      await api.post('/ServiceCategories', { name: cName, description: cDesc });
      setCategoryModalVisible(false);
      setCName('');
      setCDesc('');
      await fetchData();
    } catch (e) {
      Alert.alert('Błąd', 'Nie udało się dodać kategorii');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveService = async () => {
    if (!sName || !sCatId || !sPrice || !sDuration) return Alert.alert('Błąd', 'Wypełnij wymagane pola');
    setSubmitting(true);
    try {
      const payload = {
        name: sName,
        description: sDesc,
        price: parseFloat(sPrice),
        durationMinutes: parseInt(sDuration),
        categoryId: sCatId
      };

      if (isEditing && editingId) {
        await api.put(`/Services/${editingId}`, { id: editingId, ...payload });
      } else {
        await api.post('/Services', payload);
      }

      setServiceModalVisible(false);
      setIsEditing(false);
      setEditingId(null);
      setSName('');
      setSDesc('');
      setSPrice('100');
      setSDuration('60');
      await fetchData();
    } catch (e) {
      Alert.alert('Błąd', 'Nie udało się zapisać usługi');
    } finally {
      setSubmitting(false);
    }
  };

  const openNewServiceModal = () => {
    if(categories.length===0) { Alert.alert('Uwaga', 'Dodaj najpierw kategorię!'); return; }
    setIsEditing(false);
    setEditingId(null);
    setSName('');
    setSDesc('');
    setSPrice('100');
    setSDuration('60');
    if(!sCatId && categories.length > 0) setSCatId(categories[0].id);
    setServiceModalVisible(true);
  };

  const handleSortToggle = (type: 'category' | 'name') => {
    if (sortBy === type) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(type);
      setSortOrder('asc');
    }
  };

  const filteredServices = useMemo(() => {
    const q = searchQuery.toLowerCase();
    if (!q) return services;
    return services.filter(s => s.name.toLowerCase().includes(q) || (s.description && s.description.toLowerCase().includes(q)));
  }, [services, searchQuery]);

  const groupedData = useMemo(() => {
    if (sortBy === 'name') return [];
    const multiplier = sortOrder === 'asc' ? 1 : -1;
    const sortedCategories = [...categories].sort((a, b) => a.name.localeCompare(b.name) * multiplier);
    
    return sortedCategories.map(cat => ({
      category: cat,
      services: filteredServices.filter(s => s.categoryId === cat.id)
    })).filter(g => g.services.length > 0 || !searchQuery);
  }, [categories, filteredServices, sortBy, searchQuery, sortOrder]);

  const sortedFlatServices = useMemo(() => {
    if (sortBy === 'category') return [];
    const multiplier = sortOrder === 'asc' ? 1 : -1;
    return [...filteredServices].sort((a, b) => a.name.localeCompare(b.name) * multiplier);
  }, [filteredServices, sortBy, sortOrder]);

  const renderServiceCard = useCallback((srv: ServiceDto) => (
    <View key={srv.id} style={styles.card}>
      <View style={{flex: 1}}>
        <Text style={styles.name}>{srv.name}</Text>
        {srv.description ? <Text style={styles.desc}>{srv.description}</Text> : null}
        <View style={styles.footer}>
          <View style={styles.infoRow}>
            <Clock size={14} color="#64748b" style={{marginRight: 4}} />
            <Text style={styles.infoText}>{srv.durationMinutes} min</Text>
          </View>
          <View style={styles.infoRow}>
            <Banknote size={14} color="#10b981" style={{marginRight: 4}} />
            <Text style={styles.priceText}>{srv.price} PLN</Text>
          </View>
        </View>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity onPress={() => handleEditServiceInit(srv)} style={styles.iconBtn}>
          <Edit3 color="#64748b" size={20} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleDeleteService(srv.id)} style={[styles.iconBtn, styles.deleteBtn]}>
          <Trash2 color="#ef4444" size={20} />
        </TouchableOpacity>
      </View>
    </View>
  ), [handleDeleteService, handleEditServiceInit]);

  const renderCategory = useCallback(({ item }: { item: typeof groupedData[0] }) => (
    <View style={styles.categorySection}>
      <View style={styles.categoryHeader}>
        <Tag color="#3b82f6" size={20} style={{marginRight: 8}} />
        <Text style={styles.categoryTitle}>{item.category.name}</Text>
      </View>
      {item.services.length === 0 ? (
        <Text style={styles.emptyCatText}>Brak usług w tej kategorii</Text>
      ) : (
        item.services.map(srv => renderServiceCard(srv))
      )}
    </View>
  ), [renderServiceCard]);

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
        <Text style={styles.title}>Usługi Salonu</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.addButton} onPress={() => setCategoryModalVisible(true)}>
            <Tag color="#ffffff" size={16} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.addButton, {marginLeft: 8}]} onPress={openNewServiceModal}>
            <Plus color="#ffffff" size={16} />
            <Text style={styles.addButtonText}>Dodaj</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.toolsContainer}>
        <View style={styles.searchBox}>
          <Search color="#94a3b8" size={20} />
          <TextInput 
            style={styles.searchInput}
            placeholder="Szukaj usługi..."
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
            style={[styles.sortBtn, sortBy === 'category' && styles.sortBtnActive]} 
            onPress={() => handleSortToggle('category')}
          >
            <LayoutList size={14} color={sortBy === 'category' ? '#ffffff' : '#64748b'} style={{marginRight: 4}} />
            <Text style={[styles.sortText, sortBy === 'category' && styles.sortTextActive]}>Kategoriami</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.sortBtn, sortBy === 'name' && styles.sortBtnActive]} 
            onPress={() => handleSortToggle('name')}
          >
            <ArrowDownAZ size={14} color={sortBy === 'name' ? '#ffffff' : '#64748b'} style={{marginRight: 4, transform: [{rotate: sortBy === 'name' && sortOrder === 'desc' ? '180deg' : '0deg'}]}} />
            <Text style={[styles.sortText, sortBy === 'name' && styles.sortTextActive]}>Alfabetycznie</Text>
          </TouchableOpacity>
        </View>
      </View>

      {sortBy === 'category' ? (
        <FlatList
          data={groupedData}
          keyExtractor={item => item.category.id}
          renderItem={renderCategory}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <View style={{marginTop: 40, alignItems: 'center'}}>
              <Text style={styles.emptyText}>Brak kategorii i usług.</Text>
              <TouchableOpacity style={[styles.addButton, {marginTop: 16}]} onPress={() => setCategoryModalVisible(true)}>
                <Text style={styles.addButtonText}>Dodaj pierwszą kategorię</Text>
              </TouchableOpacity>
            </View>
          }
        />
      ) : (
        <FlatList
          data={sortedFlatServices}
          keyExtractor={item => item.id}
          renderItem={({ item }) => renderServiceCard(item)}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <View style={{marginTop: 40, alignItems: 'center'}}>
              <Text style={styles.emptyText}>Brak usług spełniających kryteria.</Text>
            </View>
          }
        />
      )}

      {/* Modal - Dodaj Kategorię */}
      <Modal visible={categoryModalVisible} animationType="fade" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Nowa Kategoria</Text>
              <TouchableOpacity onPress={() => setCategoryModalVisible(false)}><X color="#64748b" size={24} /></TouchableOpacity>
            </View>
            <Text style={styles.label}>Nazwa kategorii *</Text>
            <TextInput style={styles.input} value={cName} onChangeText={setCName} placeholder="np. Strzyżenie" />
            <Text style={styles.label}>Opis</Text>
            <TextInput style={styles.input} value={cDesc} onChangeText={setCDesc} placeholder="Krótki opis" />
            <TouchableOpacity style={styles.submitBtn} onPress={handleAddCategory} disabled={submitting}>
              {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>Zapisz Kategorie</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal - Dodaj/Edytuj Usługę */}
      <Modal visible={serviceModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{isEditing ? 'Edytuj Usługę' : 'Nowa Usługa'}</Text>
                <TouchableOpacity onPress={() => setServiceModalVisible(false)}><X color="#64748b" size={24} /></TouchableOpacity>
              </View>
              
              <Text style={styles.label}>Wybierz Kategorie *</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{marginBottom: 16}}>
                {categories.map(c => (
                  <TouchableOpacity 
                    key={c.id} 
                    style={[styles.catPill, sCatId === c.id && styles.catPillActive]}
                    onPress={() => setSCatId(c.id)}
                  >
                    <Text style={[styles.catPillText, sCatId === c.id && styles.catPillTextActive]}>{c.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={styles.label}>Nazwa usługi *</Text>
              <TextInput style={styles.input} value={sName} onChangeText={setSName} placeholder="np. Strzyżenie męskie" />
              
              <Text style={styles.label}>Cena (PLN) *</Text>
              <TextInput style={styles.input} value={sPrice} onChangeText={setSPrice} keyboardType="numeric" />
              
              <Text style={styles.label}>Czas trwania (min) *</Text>
              <TextInput style={styles.input} value={sDuration} onChangeText={setSDuration} keyboardType="numeric" />
              
              <Text style={styles.label}>Opis</Text>
              <TextInput style={styles.input} value={sDesc} onChangeText={setSDesc} placeholder="Opcjonalny opis" multiline />

              <TouchableOpacity style={styles.submitBtn} onPress={handleSaveService} disabled={submitting}>
                {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>Zapisz Usługę</Text>}
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
  header: { padding: 20, backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerActions: { flexDirection: 'row' },
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
  
  categorySection: { marginBottom: 24 },
  categoryHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, marginLeft: 4 },
  categoryTitle: { fontSize: 18, fontWeight: 'bold', color: '#1e293b' },
  emptyCatText: { color: '#94a3b8', fontStyle: 'italic', marginLeft: 8 },

  card: { backgroundColor: '#ffffff', borderRadius: 12, padding: 16, marginBottom: 12, flexDirection: 'row', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  name: { fontSize: 16, fontWeight: 'bold', color: '#1e293b', marginBottom: 4 },
  desc: { fontSize: 14, color: '#64748b', marginBottom: 12 },
  footer: { flexDirection: 'row', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 12, marginTop: 4 },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginRight: 16 },
  infoText: { fontSize: 14, color: '#475569', fontWeight: '500' },
  priceText: { fontSize: 14, color: '#10b981', fontWeight: 'bold' },
  actions: { flexDirection: 'row', alignItems: 'center' },
  iconBtn: { padding: 8, backgroundColor: '#f1f5f9', borderRadius: 8, marginLeft: 8 },
  deleteBtn: { backgroundColor: '#fef2f2' },
  emptyText: { textAlign: 'center', color: '#94a3b8' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#ffffff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, paddingBottom: 40, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#0f172a' },
  label: { fontSize: 14, fontWeight: '600', color: '#334155', marginBottom: 8, marginTop: 12 },
  input: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8, padding: 12, fontSize: 16, color: '#0f172a' },
  submitBtn: { backgroundColor: '#0f172a', borderRadius: 8, padding: 16, alignItems: 'center', marginTop: 24 },
  submitBtnText: { color: '#ffffff', fontSize: 16, fontWeight: '600' },
  
  catPill: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#f1f5f9', marginRight: 8, borderWidth: 1, borderColor: '#e2e8f0' },
  catPillActive: { backgroundColor: '#eff6ff', borderColor: '#3b82f6' },
  catPillText: { color: '#64748b', fontWeight: '500' },
  catPillTextActive: { color: '#3b82f6', fontWeight: 'bold' }
});
