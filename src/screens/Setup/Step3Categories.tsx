import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, FlatList, Alert, TouchableOpacity } from 'react-native';
import { Button } from '../../components/Button';
import { useThemeColors } from '../../theme/useThemeColors';
import api from '../../api/client';
import { Plus, Trash2 } from 'lucide-react-native';

const PREDEFINED_CATEGORIES = [
  'Fryzjer', 'Barber', 'Kosmetyczka', 'Manicure', 'Pedicure', 'Masaż', 'SPA', 
  'Makijaż', 'Stylizacja brwi', 'Rzęsy', 'Depilacja', 'Studio tatuażu', 'Solarium', 
  'Trener personalny', 'Dietetyk', 'Szkoła tańca', 'Warsztat samochodowy', 'Wulkanizacja', 
  'Myjnia samochodowa', 'Groomer', 'Serwis rowerowy', 'Fotografia', 'Usługi sprzątające', 'Złota rączka'
];

export const Step3Categories = ({ navigation }: any) => {
  const { colors } = useThemeColors();
  const [categories, setCategories] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await api.get('/ServiceCategories');
      setCategories(res.data);
    } catch (e) {
      console.log('Failed to fetch categories', e);
    }
  };

  const addCategory = async (name: string) => {
    if (!name.trim()) return;
    if (categories.some(c => c.name.toLowerCase() === name.toLowerCase())) {
        Alert.alert('Uwaga', 'Ta kategoria jest już dodana.');
        return;
    }
    try {
      await api.post('/ServiceCategories', { name, description: '' });
      setSearchQuery('');
      fetchCategories();
    } catch (e) {
      Alert.alert('Błąd', 'Nie udało się dodać kategorii.');
    }
  };

  const deleteCategory = async (id: string) => {
    try {
      await api.delete(`/ServiceCategories/${id}`);
      fetchCategories();
    } catch (e) {
      Alert.alert('Błąd', 'Nie udało się usunąć kategorii.');
    }
  };

  const handleNext = () => {
    if (categories.length === 0) {
      Alert.alert('Uwaga', 'Czy na pewno chcesz przejść dalej bez żadnej kategorii usług? Utrudni to dodawanie usług.', [
        { text: 'Anuluj', style: 'cancel' },
        { text: 'Tak, pomiń', onPress: () => navigation.navigate('Step4Services') }
      ]);
    } else {
      navigation.navigate('Step4Services');
    }
  };

  const filteredPredefined = PREDEFINED_CATEGORIES.filter(c => 
    c.toLowerCase().includes(searchQuery.toLowerCase()) && 
    !categories.some(existing => existing.name.toLowerCase() === c.toLowerCase())
  );

  const showCustomAdd = searchQuery.trim().length > 0 && 
    !PREDEFINED_CATEGORIES.some(c => c.toLowerCase() === searchQuery.trim().toLowerCase()) &&
    !categories.some(c => c.name.toLowerCase() === searchQuery.trim().toLowerCase());

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>Kategorie Usług</Text>
      <Text style={[styles.subtitle, { color: colors.text + '80' }]}>
        Wybierz z listy lub wpisz własne kategorie (np. Włosy, Paznokcie, Masaże), w których pogrupujesz swoje usługi.
      </Text>

      <View style={{ marginBottom: 20 }}>
        <TextInput
          style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface, marginBottom: 10 }]}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Wyszukaj lub wpisz własną..."
          placeholderTextColor={colors.text + '50'}
        />
        
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {filteredPredefined.slice(0, 10).map(cat => (
                <TouchableOpacity 
                    key={cat}
                    onPress={() => addCategory(cat)}
                    style={[styles.chip, { backgroundColor: colors.surface, borderColor: colors.border }]}
                >
                    <Plus size={14} color={colors.text} />
                    <Text style={{ color: colors.text, marginLeft: 6, fontSize: 13 }}>{cat}</Text>
                </TouchableOpacity>
            ))}
            {showCustomAdd && (
                <TouchableOpacity 
                    onPress={() => addCategory(searchQuery.trim())}
                    style={[styles.chip, { backgroundColor: colors.primary, borderColor: colors.primary }]}
                >
                    <Plus size={14} color="#fff" />
                    <Text style={{ color: '#fff', marginLeft: 6, fontSize: 13 }}>Dodaj: "{searchQuery.trim()}"</Text>
                </TouchableOpacity>
            )}
        </View>
      </View>

      <Text style={{ color: colors.text + '80', marginBottom: 10 }}>Dodane kategorie:</Text>
      <FlatList
        data={categories}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={[styles.categoryItem, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={{ color: colors.text, fontSize: 16 }}>{item.name}</Text>
            <TouchableOpacity onPress={() => deleteCategory(item.id)}>
                <Trash2 color={colors.error} size={24} />
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={<Text style={{ color: colors.text, textAlign: 'center', marginTop: 20 }}>Brak kategorii. Wybierz z listy powyżej!</Text>}
        contentContainerStyle={{ paddingBottom: 20 }}
      />

      <View style={{ marginTop: 10, flexDirection: 'row', gap: 10, marginBottom: 40 }}>
        <TouchableOpacity 
          style={{ flex: 1, paddingVertical: 12, borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }} 
          onPress={() => navigation.goBack()}
        >
          <Text style={{ color: colors.text, fontSize: 16, fontWeight: '600' }}>Wstecz</Text>
        </TouchableOpacity>
        <Button title="Dalej" onPress={handleNext} style={{ flex: 1 }} loading={isLoading} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 4,
  },
  categoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 10,
  }
});
