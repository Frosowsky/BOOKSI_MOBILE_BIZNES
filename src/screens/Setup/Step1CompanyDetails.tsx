import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { Button } from '../../components/Button';
import { useThemeColors } from '../../theme/useThemeColors';
import api from '../../api/client';

export const Step1CompanyDetails = ({ navigation }: any) => {
  const { colors } = useThemeColors();
  const [name, setName] = useState('');
  const [nip, setNip] = useState('');
  const [address, setAddress] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Fetch current details
    const fetchDetails = async () => {
      try {
        const res = await api.get('/Salons/me');
        if (res.data) {
          setName(res.data.name || '');
          setNip(res.data.nip || '');
          setAddress(res.data.address || '');
        }
      } catch (e) {
        console.log(e);
      }
    };
    fetchDetails();
  }, []);

  const handleNext = async () => {
    if (!name.trim()) {
      Alert.alert('Błąd', 'Nazwa salonu jest wymagana.');
      return;
    }
    
    // Basic NIP validation (10 digits) if provided
    if (nip && !/^\d{10}$/.test(nip.replace(/-/g, ''))) {
      Alert.alert('Błąd', 'Podano niepoprawny NIP.');
      return;
    }

    setIsLoading(true);
    try {
      await api.put('/Setup/company', {
        name,
        nip: nip.replace(/-/g, ''),
        address
      });
      navigation.navigate('Step2Hours');
    } catch (e) {
      Alert.alert('Błąd', 'Nie udało się zapisać danych.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.title, { color: colors.text }]}>Witaj w kreatorze!</Text>
        <Text style={[styles.subtitle, { color: colors.text + '80' }]}>
          Uzupełnij podstawowe dane swojej firmy.
        </Text>

        <View style={styles.inputContainer}>
          <Text style={[styles.label, { color: colors.text }]}>Nazwa salonu *</Text>
          <TextInput
            style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface }]}
            value={name}
            onChangeText={setName}
            placeholder="np. Salon Piękności Anna"
            placeholderTextColor={colors.text + '50'}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={[styles.label, { color: colors.text }]}>NIP</Text>
          <TextInput
            style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface }]}
            value={nip}
            onChangeText={setNip}
            placeholder="Wpisz 10 cyfr"
            keyboardType="numeric"
            placeholderTextColor={colors.text + '50'}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={[styles.label, { color: colors.text }]}>Adres firmy</Text>
          <TextInput
            style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface }]}
            value={address}
            onChangeText={setAddress}
            placeholder="np. ul. Kwiatowa 1/2, 00-001 Warszawa"
            placeholderTextColor={colors.text + '50'}
          />
        </View>

        <View style={{ marginTop: 40 }}>
          <Button title="Zapisz i kontynuuj" onPress={handleNext} loading={isLoading} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 30,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
});
