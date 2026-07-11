import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, FlatList, Alert } from 'react-native';
import { Button } from '../../components/Button';
import { useThemeColors } from '../../theme/useThemeColors';
import api from '../../api/client';
import { Plus, Trash2 } from 'lucide-react-native';

export const Step3Categories = ({ navigation }: any) => {
  const { colors } = useThemeColors();
  const [categories, setCategories] = useState<any[]>([]);
  const [newCategoryName, setNewCategoryName] = useState('');
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

  const addCategory = async () => {
    if (!newCategoryName.trim()) return;
    try {
      await api.post('/ServiceCategories', { name: newCategoryName, description: '' });
      setNewCategoryName('');
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

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>Kategorie Usług</Text>
      <Text style={[styles.subtitle, { color: colors.text + '80' }]}>
        Stwórz kategorie (np. Włosy, Paznokcie, Masaże), w których pogrupujesz swoje usługi.
      </Text>

      <View style={styles.addForm}>
        <TextInput
          style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface }]}
          value={newCategoryName}
          onChangeText={setNewCategoryName}
          placeholder="Nowa kategoria"
          placeholderTextColor={colors.text + '50'}
        />
        <View style={{ marginLeft: 10 }}>
          <Button title="Dodaj" onPress={addCategory} />
        </View>
      </View>

      <FlatList
        data={categories}
        keyExtractor={(item) => item.id}
        style={{ marginTop: 20 }}
        renderItem={({ item }) => (
          <View style={[styles.categoryItem, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={{ color: colors.text, fontSize: 16 }}>{item.name}</Text>
            <Trash2 color={colors.error} size={24} onPress={() => deleteCategory(item.id)} />
          </View>
        )}
        ListEmptyComponent={<Text style={{ color: colors.text, textAlign: 'center', marginTop: 20 }}>Brak kategorii.</Text>}
      />

      <View style={{ marginTop: 20, marginBottom: 40 }}>
        <Button title="Przejdź do usług" onPress={handleNext} loading={isLoading} />
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
  addForm: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
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
