import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Modal, Image, Pressable } from 'react-native';
import { LogIn, Fingerprint, X } from 'lucide-react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { SafeAreaView } from 'react-native-safe-area-context';

export const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isBiometricSupported, setIsBiometricSupported] = useState(false);
  const [hasBiometricRecord, setHasBiometricRecord] = useState(false);
  
  // Easter Egg state
  const [clickCount, setClickCount] = useState(0);
  const [showCat, setShowCat] = useState(false);

  const { signIn, enableBiometric } = useAuth();

  useEffect(() => {
    const checkBiometricSupport = async () => {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      if (compatible && enrolled) {
        setIsBiometricSupported(true);
        const storedRefreshToken = await SecureStore.getItemAsync('biometric_refresh_token');
        if (storedRefreshToken) {
          setHasBiometricRecord(true);
          handleBiometricLogin();
        }
      }
    };
    checkBiometricSupport();
  }, []);

  const handleBiometricLogin = async () => {
    try {
      const authResult = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Zaloguj się do RIVIE',
        fallbackLabel: 'Wprowadź hasło',
        cancelLabel: 'Anuluj',
      });

      if (authResult.success) {
        setLoading(true);
        const oldToken = await SecureStore.getItemAsync('biometric_token');
        const oldRefreshToken = await SecureStore.getItemAsync('biometric_refresh_token');

        if (oldToken && oldRefreshToken) {
          const response = await api.post('/auth/refresh', {
            token: oldToken,
            refreshToken: oldRefreshToken,
            isMobile: true
          });
          
          const { token, refreshToken } = response.data;
          await enableBiometric(token, refreshToken);
          await signIn(token, refreshToken, '', '');
        } else {
          Alert.alert('Błąd', 'Nie znaleziono zapisanych danych logowania. Zaloguj się tradycyjnie.');
        }
      }
    } catch (e: any) {
      console.error('Biometric auth error', e);
      if (e.response && e.response.status === 400) {
        Alert.alert('Sesja wygasła', 'Zaloguj się ponownie hasłem, aby odnowić dostęp.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Błąd', 'Wprowadź email i hasło');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/auth/login', { email, password, isMobile: true });
      
      const { token, refreshToken, salonId } = response.data;
      
      if (isBiometricSupported && !hasBiometricRecord) {
        Alert.alert(
          'Logowanie biometryczne',
          'Czy chcesz włączyć logowanie odciskiem palca / FaceID dla większej wygody?',
          [
            { 
              text: 'Nie', 
              style: 'cancel',
              onPress: () => signIn(token, refreshToken, salonId, salonId)
            },
            { 
              text: 'Tak', 
              onPress: async () => {
                await enableBiometric(token, refreshToken);
                setHasBiometricRecord(true);
                signIn(token, refreshToken, salonId, salonId);
              }
            }
          ]
        );
      } else {
        if (hasBiometricRecord) {
          await enableBiometric(token, refreshToken);
        }
        await signIn(token, refreshToken, salonId, salonId);
      }
      
    } catch (error: any) {
      console.error(error);
      Alert.alert('Błąd logowania', error.response?.data?.message || 'Nieprawidłowy email lub hasło.');
    } finally {
      setLoading(false);
    }
  };

  const handleVersionPress = () => {
    setClickCount(prev => {
      if (prev + 1 === 15) {
        setShowCat(true);
        return 0; // reset
      }
      return prev + 1;
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.content}
      >
        <View style={styles.headerContainer}>
          <Text style={styles.title}>RIVIE</Text>
          <Text style={styles.subtitle}>Panel Biznesowy</Text>
        </View>

        <View style={styles.formContainer}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="Wprowadź email"
              autoCapitalize="none"
              keyboardType="email-address"
              editable={!loading}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Hasło</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="Wprowadź hasło"
              secureTextEntry
              editable={!loading}
            />
          </View>

          <TouchableOpacity 
            style={[styles.button, loading && styles.buttonDisabled]} 
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <LogIn color="#fff" size={20} style={{ marginRight: 8 }} />
                <Text style={styles.buttonText}>Zaloguj się</Text>
              </>
            )}
          </TouchableOpacity>

          {isBiometricSupported && hasBiometricRecord && (
            <TouchableOpacity 
              style={styles.biometricButton} 
              onPress={handleBiometricLogin}
              disabled={loading}
            >
              <Fingerprint color="#0f172a" size={24} style={{ marginRight: 8 }} />
              <Text style={styles.biometricButtonText}>Zaloguj biometrycznie</Text>
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>

      <TouchableOpacity style={styles.versionContainer} activeOpacity={1} onPress={handleVersionPress}>
        <Text style={styles.versionText}>v1.0.3</Text>
      </TouchableOpacity>

      <Modal visible={showCat} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.catBox}>
            <TouchableOpacity style={styles.closeCat} onPress={() => setShowCat(false)}>
              <X color="#94a3b8" size={24} />
            </TouchableOpacity>
            <Text style={{fontSize: 24, fontWeight: 'bold', marginBottom: 16}}>Sekret Odkryty!</Text>
            <Image 
              source={require('../../../assets/dancing_cat.png')} 
              style={{ width: 250, height: 250, borderRadius: 12 }} 
            />
            <Text style={{marginTop: 16, fontSize: 16, color: '#64748b'}}>Tańczący kotek pozdrawia 🐱💃</Text>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 48,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#0f172a',
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b',
    marginTop: 8,
  },
  formContainer: {
    backgroundColor: '#fff',
    padding: 24,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 2,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#0f172a',
  },
  button: {
    backgroundColor: '#0f172a',
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  buttonDisabled: {
    backgroundColor: '#475569',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  biometricButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
  },
  biometricButtonText: {
    color: '#0f172a',
    fontSize: 16,
    fontWeight: '600',
  },
  versionContainer: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    padding: 10, // give it a larger tap target
  },
  versionText: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  catBox: {
    backgroundColor: '#fff',
    padding: 24,
    borderRadius: 16,
    alignItems: 'center'
  },
  closeCat: {
    position: 'absolute',
    top: 12,
    right: 12,
    padding: 4
  }
});
