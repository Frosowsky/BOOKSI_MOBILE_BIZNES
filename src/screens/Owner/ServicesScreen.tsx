import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, RefreshControl, TouchableOpacity, Modal, TextInput, Alert, ScrollView } from 'react-native';
import api from '../../api/client';
import { Clock, Plus, X, Trash2, Tag, Banknote, Edit3, Search, ArrowDownAZ, LayoutList } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemeColors } from '../../theme/useThemeColors';

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
  standardServiceCategoryId?: string;
}

export const ServicesScreen = () => {
  const { colors, isDark } = useThemeColors();
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
  const [sStandardServiceId, setSStandardServiceId] = useState<string | undefined>(undefined);
  
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Category form
  const [cName, setCName] = useState('');
  const [cDesc, setCDesc] = useState('');
  const [cStandardServiceCategoryId, setCStandardServiceCategoryId] = useState<string | undefined>(undefined);

  const [standardServices, setStandardServices] = useState<any[]>([]);
  const [standardCategories, setStandardCategories] = useState<any[]>([]);

  const [catSuggestions, setCatSuggestions] = useState<any[]>([]);
  const [showCatSuggestions, setShowCatSuggestions] = useState(false);

  // Search & Sort state
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'category' | 'name'>('category');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const fetchData = async () => {
    try {
      const [srvRes, catRes, stdSrvRes, stdCatRes] = await Promise.all([
        api.get('/Services'),
        api.get('/ServiceCategories'),
        api.get('/StandardServices/all'),
        api.get('/StandardServiceCategories/all')
      ]);
      setServices(srvRes.data);
      setCategories(catRes.data);
      setStandardServices(stdSrvRes.data);
      setStandardCategories(stdCatRes.data);
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
    setSStandardServiceId(undefined); // Could pass from API if available
    setServiceModalVisible(true);
  }, []);

  const handleAddCategory = async () => {
    if (!cName) return Alert.alert('Błąd', 'Nazwa jest wymagana');
    setSubmitting(true);
    try {
      await api.post('/ServiceCategories', { 
        name: cName, 
        description: cDesc,
        standardServiceCategoryId: cStandardServiceCategoryId 
      });
      setCategoryModalVisible(false);
      setCName('');
      setCDesc('');
      setCStandardServiceCategoryId(undefined);
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
        categoryId: sCatId,
        standardServiceId: sStandardServiceId
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
      setSStandardServiceId(undefined);
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
    setSStandardServiceId(undefined);
    if(!sCatId && categories.length > 0) setSCatId(categories[0].id);
    setServiceModalVisible(true);
  };

  const handleSNameChange = (val: string) => {
    setSName(val);
    setSStandardServiceId(undefined);
    if (val.length >= 2) {
      const filtered = standardServices.filter(s => s.name.toLowerCase().includes(val.toLowerCase()));
      setSuggestions(filtered.slice(0, 10));
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleCNameChange = (val: string) => {
    setCName(val);
    setCStandardServiceCategoryId(undefined);
    if (val.length >= 2) {
      const filtered = standardCategories.filter(c => c.name.toLowerCase().includes(val.toLowerCase()));
      setCatSuggestions(filtered.slice(0, 10));
      setShowCatSuggestions(true);
    } else {
      setCatSuggestions([]);
      setShowCatSuggestions(false);
    }
  };

  const selectCatSuggestion = (id: string, name: string) => {
    setCName(name);
    setCStandardServiceCategoryId(id);
    setShowCatSuggestions(false);
  };



  const selectSuggestion = (id: string, name: string) => {
    setSName(name);
    setSStandardServiceId(id);
    
    const stdService = standardServices.find(s => s.id === id);
    if (stdService && stdService.standardServiceCategoryId) {
      const localCat = categories.find(c => c.standardServiceCategoryId === stdService.standardServiceCategoryId);
      if (localCat) {
        setSCatId(localCat.id);
      }
    }
    
    setShowSuggestions(false);
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
    <View key={srv.id} style={[styles.card, { backgroundColor: colors.surface, shadowColor: colors.cardShadow }]}>
      <View style={{flex: 1}}>
        <Text style={[styles.name, { color: colors.text }]}>{srv.name}</Text>
        {srv.description ? <Text style={[styles.desc, { color: colors.textMuted }]}>{srv.description}</Text> : null}
        <View style={[styles.footer, { borderTopColor: colors.border }]}>
          <View style={styles.infoRow}>
            <Clock size={14} color={colors.textMuted} style={{marginRight: 4}} />
            <Text style={[styles.infoText, { color: colors.textMuted }]}>{srv.durationMinutes} min</Text>
          </View>
          <View style={styles.infoRow}>
            <Banknote size={14} color={colors.success} style={{marginRight: 4}} />
            <Text style={[styles.priceText, { color: colors.success }]}>{srv.price} PLN</Text>
          </View>
        </View>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity onPress={() => handleEditServiceInit(srv)} style={[styles.iconBtn, { backgroundColor: colors.background }]}>
          <Edit3 color={colors.textMuted} size={20} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleDeleteService(srv.id)} style={[styles.iconBtn, styles.deleteBtn]}>
          <Trash2 color={colors.error} size={20} />
        </TouchableOpacity>
      </View>
    </View>
  ), [handleDeleteService, handleEditServiceInit, colors, isDark]);

  const renderCategory = useCallback(({ item }: { item: typeof groupedData[0] }) => (
    <View style={styles.categorySection}>
      <View style={styles.categoryHeader}>
        <Tag color={colors.primary} size={20} style={{marginRight: 8}} />
        <Text style={[styles.categoryTitle, { color: colors.text }]}>{item.category.name}</Text>
      </View>
      {item.services.length === 0 ? (
        <Text style={[styles.emptyCatText, { color: colors.textMuted }]}>Brak usług w tej kategorii</Text>
      ) : (
        item.services.map(srv => renderServiceCard(srv))
      )}
    </View>
  ), [renderServiceCard, colors, isDark]);

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
        <Text style={[styles.title, { color: colors.text }]}>Usługi Salonu</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity style={[styles.addButton, { backgroundColor: colors.primary }]} onPress={() => setCategoryModalVisible(true)}>
            <Tag color="#ffffff" size={16} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.addButton, {marginLeft: 8, backgroundColor: colors.primary}]} onPress={openNewServiceModal}>
            <Plus color="#ffffff" size={16} />
            <Text style={styles.addButtonText}>Dodaj</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={[styles.toolsContainer, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <View style={[styles.searchBox, { backgroundColor: isDark ? '#334155' : '#f1f5f9' }]}>
          <Search color={colors.textMuted} size={20} />
          <TextInput 
            style={[styles.searchInput, { color: colors.text }]}
            placeholderTextColor={colors.textMuted}
            placeholder="Szukaj usługi..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <X color={colors.textMuted} size={16} />
            </TouchableOpacity>
          )}
        </View>
        <View style={styles.sortRow}>
          <Text style={[styles.sortLabel, { color: colors.textMuted }]}>Sortuj:</Text>
          <TouchableOpacity 
            style={[styles.sortBtn, { backgroundColor: isDark ? '#334155' : '#f1f5f9' }, sortBy === 'category' && { backgroundColor: colors.primary }]} 
            onPress={() => handleSortToggle('category')}
          >
            <LayoutList size={14} color={sortBy === 'category' ? '#ffffff' : colors.textMuted} style={{marginRight: 4}} />
            <Text style={[styles.sortText, { color: colors.textMuted }, sortBy === 'category' && styles.sortTextActive]}>Kategoriami</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.sortBtn, { backgroundColor: isDark ? '#334155' : '#f1f5f9' }, sortBy === 'name' && { backgroundColor: colors.primary }]} 
            onPress={() => handleSortToggle('name')}
          >
            <ArrowDownAZ size={14} color={sortBy === 'name' ? '#ffffff' : colors.textMuted} style={{marginRight: 4, transform: [{rotate: sortBy === 'name' && sortOrder === 'desc' ? '180deg' : '0deg'}]}} />
            <Text style={[styles.sortText, { color: colors.textMuted }, sortBy === 'name' && styles.sortTextActive]}>Alfabetycznie</Text>
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
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Nowa Kategoria</Text>
              <TouchableOpacity onPress={() => setCategoryModalVisible(false)}><X color={colors.textMuted} size={24} /></TouchableOpacity>
            </View>
            <View style={{ zIndex: 10 }}>
              <Text style={[styles.label, { color: colors.text }]}>Nazwa kategorii *</Text>
              <TextInput 
                style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]} 
                placeholderTextColor={colors.textMuted} 
                value={cName} 
                onChangeText={handleCNameChange} 
                onFocus={() => { if(catSuggestions.length > 0) setShowCatSuggestions(true); }}
                placeholder="np. Strzyżenie" 
              />
              {showCatSuggestions && catSuggestions.length > 0 && (
                <View style={[styles.suggestionsContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  {catSuggestions.map(s => (
                    <TouchableOpacity 
                      key={s.id} 
                      style={[styles.suggestionItem, { borderBottomColor: colors.border }]}
                      onPress={() => selectCatSuggestion(s.id, s.name)}
                    >
                      <Text style={{ color: colors.text }}>{s.name}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
            <Text style={[styles.label, { color: colors.text }]}>Opis</Text>
            <TextInput style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]} placeholderTextColor={colors.textMuted} value={cDesc} onChangeText={setCDesc} placeholder="Krótki opis" />
            <TouchableOpacity style={styles.submitBtn} onPress={handleAddCategory} disabled={submitting}>
              {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>Zapisz Kategorie</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal - Dodaj/Edytuj Usługę */}
      <Modal visible={serviceModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>{isEditing ? 'Edytuj Usługę' : 'Nowa Usługa'}</Text>
                <TouchableOpacity onPress={() => setServiceModalVisible(false)}><X color={colors.textMuted} size={24} /></TouchableOpacity>
              </View>
              
              <Text style={[styles.label, { color: colors.text }]}>Wybierz Kategorie *</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{marginBottom: 16}}>
                {categories.map(c => (
                  <TouchableOpacity 
                    key={c.id} 
                    style={[styles.catPill, { backgroundColor: colors.background, borderColor: colors.border }, sCatId === c.id && { backgroundColor: isDark ? '#1e3a8a' : '#eff6ff', borderColor: colors.primary }]}
                    onPress={() => setSCatId(c.id)}
                  >
                    <Text style={[styles.catPillText, { color: colors.textMuted }, sCatId === c.id && { color: isDark ? '#93c5fd' : '#3b82f6', fontWeight: 'bold' }]}>{c.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <View style={{ zIndex: 10 }}>
                <Text style={[styles.label, { color: colors.text }]}>Nazwa usługi *</Text>
                <TextInput 
                  style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]} 
                  placeholderTextColor={colors.textMuted} 
                  value={sName} 
                  onChangeText={handleSNameChange} 
                  onFocus={() => { if(suggestions.length > 0) setShowSuggestions(true); }}
                  placeholder="np. Strzyżenie męskie" 
                />
                
                {showSuggestions && suggestions.length > 0 && (
                  <View style={{ position: 'absolute', top: 80, left: 0, right: 0, backgroundColor: colors.surface, borderRadius: 8, borderWidth: 1, borderColor: colors.border, maxHeight: 150, zIndex: 20, elevation: 5, shadowColor: '#000', shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.1, shadowRadius: 4 }}>
                    <ScrollView nestedScrollEnabled keyboardShouldPersistTaps="handled">
                      {suggestions.map(s => (
                        <TouchableOpacity 
                          key={s.id} 
                          style={{ padding: 12, borderBottomWidth: 1, borderBottomColor: colors.border }}
                          onPress={() => selectSuggestion(s.id, s.name)}
                        >
                          <Text style={{ color: colors.text }}>{s.name}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </View>
              
              <Text style={[styles.label, { color: colors.text }]}>Cena (PLN) *</Text>
              <TextInput style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]} placeholderTextColor={colors.textMuted} value={sPrice} onChangeText={setSPrice} keyboardType="numeric" />
              
              <Text style={[styles.label, { color: colors.text }]}>Czas trwania (min) *</Text>
              <TextInput style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]} placeholderTextColor={colors.textMuted} value={sDuration} onChangeText={setSDuration} keyboardType="numeric" />
              
              <Text style={[styles.label, { color: colors.text }]}>Opis</Text>
              <TextInput style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]} placeholderTextColor={colors.textMuted} value={sDesc} onChangeText={setSDesc} placeholder="Opcjonalny opis" multiline />

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
  catPillTextActive: { color: '#3b82f6', fontWeight: 'bold' },
  
  suggestionsContainer: { position: 'absolute', top: '100%', left: 0, right: 0, borderWidth: 1, borderRadius: 8, maxHeight: 150, overflow: 'hidden', marginTop: 4, elevation: 4, zIndex: 10 },
  suggestionItem: { padding: 12, borderBottomWidth: 1 }
});
