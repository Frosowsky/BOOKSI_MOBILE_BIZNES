import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, Alert, FlatList, TouchableOpacity } from 'react-native';
import { Button } from '../../components/Button';
import { useThemeColors } from '../../theme/useThemeColors';
import api from '../../api/client';
import { Trash2 } from 'lucide-react-native';
import { Picker } from '@react-native-picker/picker';

export const Step4Services = ({ navigation }: any) => {
  const { colors } = useThemeColors();
  const [categories, setCategories] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  
  const [newName, setNewName] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newDuration, setNewDuration] = useState('60');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [standardServiceId, setStandardServiceId] = useState<string | undefined>(undefined);
  
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const catRes = await api.get('/ServiceCategories');
      setCategories(catRes.data);
      if (catRes.data.length > 0 && !selectedCategory) {
        setSelectedCategory(catRes.data[0].id);
      }

      const serRes = await api.get('/Services');
      setServices(serRes.data);
    } catch (e) {
      console.log('Failed to fetch data', e);
    }
  };

  const addService = async () => {
    if (!newName.trim() || !newPrice.trim() || !newDuration.trim() || !selectedCategory) {
      Alert.alert('Błąd', 'Wypełnij wszystkie pola.');
      return;
    }
    try {
      await api.post('/Services', {
        name: newName,
        description: '',
        price: parseFloat(newPrice),
        durationMinutes: parseInt(newDuration, 10),
        categoryId: selectedCategory,
        standardServiceId: standardServiceId
      });
      setNewName('');
      setNewPrice('');
      setNewDuration('60');
      setStandardServiceId(undefined);
      fetchData();
    } catch (e) {
      Alert.alert('Błąd', 'Nie udało się dodać usługi.');
    }
  };

  const fetchSuggestions = async (val: string) => {
    if (val.length >= 2) {
      try {
        const res = await api.get(`/StandardServices/suggest?q=${encodeURIComponent(val)}`);
        setSuggestions(res.data);
        setShowSuggestions(true);
      } catch (e) { }
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleNameChange = (val: string) => {
    setNewName(val);
    setStandardServiceId(undefined);
    fetchSuggestions(val);
  };

  const selectSuggestion = (id: string, name: string) => {
    setNewName(name);
    setStandardServiceId(id);
    setShowSuggestions(false);
  };

  const deleteService = async (id: string) => {
    try {
      await api.delete(`/Services/${id}`);
      fetchData();
    } catch (e) {
      Alert.alert('Błąd', 'Nie udało się usunąć usługi.');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>Lista Usług</Text>
      
      <View style={[styles.addForm, { backgroundColor: colors.surface, borderColor: colors.border, zIndex: 10 }]}>
        <View style={{ zIndex: 20 }}>
          <TextInput
            style={[styles.input, { color: colors.text, borderColor: colors.border }]}
            value={newName}
            onChangeText={handleNameChange}
            onFocus={() => { if(suggestions.length > 0) setShowSuggestions(true); }}
            placeholder="Nazwa usługi"
            placeholderTextColor={colors.text + '50'}
          />
          {showSuggestions && suggestions.length > 0 && (
            <View style={{ position: 'absolute', top: 50, left: 0, right: 0, backgroundColor: colors.surface, borderRadius: 8, borderWidth: 1, borderColor: colors.border, maxHeight: 150, zIndex: 30, elevation: 5, shadowColor: '#000', shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.1, shadowRadius: 4 }}>
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
        <View style={styles.row}>
          <TextInput
            style={[styles.input, { flex: 1, color: colors.text, borderColor: colors.border, marginRight: 5 }]}
            value={newPrice}
            onChangeText={setNewPrice}
            placeholder="Cena (zł)"
            keyboardType="numeric"
            placeholderTextColor={colors.text + '50'}
          />
          <TextInput
            style={[styles.input, { flex: 1, color: colors.text, borderColor: colors.border, marginLeft: 5 }]}
            value={newDuration}
            onChangeText={setNewDuration}
            placeholder="Czas (min)"
            keyboardType="numeric"
            placeholderTextColor={colors.text + '50'}
          />
        </View>
        <View style={[styles.pickerContainer, { borderColor: colors.border }]}>
          <Picker
            selectedValue={selectedCategory}
            onValueChange={(val) => setSelectedCategory(val)}
            style={{ color: colors.text }}
            dropdownIconColor={colors.text}
          >
            {categories.map(cat => (
              <Picker.Item key={cat.id} label={cat.name} value={cat.id} color={colors.text} />
            ))}
          </Picker>
        </View>
        
        <Button title="Dodaj usługę" onPress={addService} />
      </View>

      <FlatList
        data={services}
        keyExtractor={(item) => item.id}
        style={{ marginTop: 20 }}
        renderItem={({ item }) => (
          <View style={[styles.serviceItem, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View>
              <Text style={{ color: colors.text, fontSize: 16, fontWeight: 'bold' }}>{item.name}</Text>
              <Text style={{ color: colors.text + '90', fontSize: 14 }}>{item.price} zł • {item.durationMinutes} min</Text>
            </View>
            <Trash2 color={colors.error} size={24} onPress={() => deleteService(item.id)} />
          </View>
        )}
        ListEmptyComponent={<Text style={{ color: colors.text, textAlign: 'center', marginTop: 20 }}>Brak usług.</Text>}
      />

      <View style={{ marginTop: 30, flexDirection: 'row', gap: 10, marginBottom: 40 }}>
        <TouchableOpacity 
          style={{ flex: 1, paddingVertical: 12, borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }} 
          onPress={() => navigation.goBack()}
        >
          <Text style={{ color: colors.text, fontSize: 16, fontWeight: '600' }}>Wstecz</Text>
        </TouchableOpacity>
        <Button title="Dalej: Pracownicy" onPress={() => navigation.navigate('Step5Employees')} style={{ flex: 1 }} />
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
    marginBottom: 20,
  },
  addForm: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 15,
  },
  row: {
    flexDirection: 'row',
    marginTop: 10,
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  pickerContainer: {
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 15,
  },
  serviceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 10,
  }
});
