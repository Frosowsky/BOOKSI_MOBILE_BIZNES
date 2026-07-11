import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Save, Settings } from 'lucide-react-native';
import api from '../../api/client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CallerIdService } from '../../services/CallerIdService';
import { useThemeColors } from '../../theme/useThemeColors';

interface SalonSettings {
  autoConfirmAppointments: boolean;
  isCallerIdEnabled: boolean;
  isWaitlistAutoFillEnabled: boolean;
  waitlistMatchingStrategy: number;
}

export const SettingsScreen = () => {
  const { colors, isDark, mode, setThemeMode } = useThemeColors();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<SalonSettings>({
    autoConfirmAppointments: true,
    isCallerIdEnabled: false,
    isWaitlistAutoFillEnabled: false,
    waitlistMatchingStrategy: 0
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await api.get('/salons/me');
      const callerIdStr = await AsyncStorage.getItem('@caller_id_enabled');
      
      if (res.data) {
        setSettings({
          autoConfirmAppointments: res.data.autoConfirmAppointments !== undefined ? res.data.autoConfirmAppointments : true,
          isCallerIdEnabled: callerIdStr === 'true',
          isWaitlistAutoFillEnabled: res.data.isWaitlistAutoFillEnabled || false,
          waitlistMatchingStrategy: res.data.waitlistMatchingStrategy || 0
        });
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      Alert.alert('Błąd', 'Nie udało się pobrać ustawień');
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    try {
      setSaving(true);
      
      // Save local setting
      await AsyncStorage.setItem('@caller_id_enabled', settings.isCallerIdEnabled ? 'true' : 'false');
      
      if (settings.isCallerIdEnabled) {
          CallerIdService.startListening((client) => {
             Alert.alert('Dzwoni klient', `Dzwoni klient salonu: ${client.firstName} ${client.lastName} (${client.phone})`);
          });
      } else {
          CallerIdService.stopListening();
      }

      // Save remote settings
      const remoteSettings = {
        autoConfirmAppointments: settings.autoConfirmAppointments,
        isWaitlistAutoFillEnabled: settings.isWaitlistAutoFillEnabled,
        waitlistMatchingStrategy: settings.waitlistMatchingStrategy
      };
      await api.put('/salons/me/settings', remoteSettings);
      
      Alert.alert('Sukces', 'Ustawienia zostały zapisane');
    } catch (error) {
      console.error('Error saving settings:', error);
      Alert.alert('Błąd', 'Wystąpił problem podczas zapisywania');
    } finally {
      setSaving(false);
    }
  };

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
        <Settings color={colors.text} size={24} style={{ marginRight: 8 }} />
        <Text style={[styles.title, { color: colors.text }]}>Ustawienia Salonu</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.card, { backgroundColor: colors.surface, shadowColor: colors.cardShadow }]}>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingTitle, { color: colors.text }]}>Auto-Akceptacja</Text>
              <Text style={[styles.settingDesc, { color: colors.textMuted }]}>Automatycznie akceptuj nowe wizyty od klientów.</Text>
            </View>
            <Switch
              value={settings.autoConfirmAppointments}
              onValueChange={(val) => setSettings({ ...settings, autoConfirmAppointments: val })}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={colors.surface}
            />
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: colors.surface, shadowColor: colors.cardShadow }]}>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingTitle, { color: colors.text }]}>Integracja Caller ID</Text>
              <Text style={[styles.settingDesc, { color: colors.textMuted }]}>Identyfikuj dzwoniących klientów na podstawie bazy salonu.</Text>
            </View>
            <Switch
              value={settings.isCallerIdEnabled}
              onValueChange={(val) => setSettings({ ...settings, isCallerIdEnabled: val })}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={colors.surface}
            />
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: colors.surface, shadowColor: colors.cardShadow }]}>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingTitle, { color: colors.text }]}>Lista Rezerwowa Auto-Wypełnianie</Text>
              <Text style={[styles.settingDesc, { color: colors.textMuted }]}>Automatycznie powiadamiaj i wypełniaj luki z listy rezerwowej.</Text>
            </View>
            <Switch
              value={settings.isWaitlistAutoFillEnabled}
              onValueChange={(val) => setSettings({ ...settings, isWaitlistAutoFillEnabled: val })}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={colors.surface}
            />
          </View>
          
          {settings.isWaitlistAutoFillEnabled && (
            <View style={[styles.strategyContainer, { borderTopColor: colors.border }]}>
              <Text style={[styles.strategyLabel, { color: colors.text }]}>Tryb dopasowania usługi:</Text>
              
              <TouchableOpacity 
                style={[
                  styles.strategyOption, 
                  { borderColor: colors.border },
                  settings.waitlistMatchingStrategy === 0 && { borderColor: colors.primary, backgroundColor: isDark ? '#1e3a8a' : '#eff6ff' }
                ]}
                onPress={() => setSettings({ ...settings, waitlistMatchingStrategy: 0 })}
              >
                <Text style={[
                  styles.strategyText, { color: colors.textMuted },
                  settings.waitlistMatchingStrategy === 0 && { color: isDark ? '#93c5fd' : '#1e3a8a', fontWeight: '500' }
                ]}>Ścisły (Tylko identyczna usługa)</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[
                  styles.strategyOption, 
                  { borderColor: colors.border },
                  settings.waitlistMatchingStrategy === 1 && { borderColor: colors.primary, backgroundColor: isDark ? '#1e3a8a' : '#eff6ff' }
                ]}
                onPress={() => setSettings({ ...settings, waitlistMatchingStrategy: 1 })}
              >
                <Text style={[
                  styles.strategyText, { color: colors.textMuted },
                  settings.waitlistMatchingStrategy === 1 && { color: isDark ? '#93c5fd' : '#1e3a8a', fontWeight: '500' }
                ]}>Elastyczny (Czas usługi i pracownik)</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={[styles.card, { backgroundColor: colors.surface, shadowColor: colors.cardShadow }]}>
          <Text style={[styles.settingTitle, { color: colors.text, marginBottom: 12 }]}>Motyw Aplikacji</Text>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <TouchableOpacity 
              style={[
                styles.themeOption, 
                { borderColor: colors.border },
                mode === 'system' && { borderColor: colors.primary, backgroundColor: isDark ? '#1e3a8a' : '#eff6ff' }
              ]}
              onPress={() => setThemeMode('system')}
            >
              <Text style={[styles.themeText, { color: colors.textMuted }, mode === 'system' && { color: isDark ? '#93c5fd' : '#1e3a8a', fontWeight: 'bold' }]}>Systemowy</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[
                styles.themeOption, 
                { borderColor: colors.border },
                mode === 'light' && { borderColor: colors.primary, backgroundColor: '#eff6ff' }
              ]}
              onPress={() => setThemeMode('light')}
            >
              <Text style={[styles.themeText, { color: colors.textMuted }, mode === 'light' && { color: '#1e3a8a', fontWeight: 'bold' }]}>Jasny</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[
                styles.themeOption, 
                { borderColor: colors.border },
                mode === 'dark' && { borderColor: colors.primary, backgroundColor: '#1e3a8a' }
              ]}
              onPress={() => setThemeMode('dark')}
            >
              <Text style={[styles.themeText, { color: colors.textMuted }, mode === 'dark' && { color: '#93c5fd', fontWeight: 'bold' }]}>Ciemny</Text>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity 
          style={[styles.saveBtn, { backgroundColor: isDark ? colors.primary : '#0f172a' }]} 
          onPress={saveSettings} 
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color={colors.buttonText} />
          ) : (
            <>
              <Save color={colors.buttonText} size={20} style={{ marginRight: 8 }} />
              <Text style={[styles.saveBtnText, { color: colors.buttonText }]}>Zapisz Ustawienia</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { justifyContent: 'center', alignItems: 'center' },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 20, 
    borderBottomWidth: 1, 
  },
  title: { fontSize: 20, fontWeight: 'bold' },
  content: { padding: 16 },
  card: { 
    borderRadius: 12, 
    padding: 16, 
    marginBottom: 16, 
    shadowOffset: { width: 0, height: 2 }, 
    shadowOpacity: 0.05, 
    shadowRadius: 4, 
    elevation: 2 
  },
  settingRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center' 
  },
  settingInfo: { flex: 1, paddingRight: 16 },
  settingTitle: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
  settingDesc: { fontSize: 13, lineHeight: 18 },
  saveBtn: { 
    borderRadius: 8, 
    paddingVertical: 16, 
    flexDirection: 'row', 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginTop: 16 
  },
  saveBtnText: { fontSize: 16, fontWeight: 'bold' },
  strategyContainer: { marginTop: 16, borderTopWidth: 1, paddingTop: 16 },
  strategyLabel: { fontSize: 14, fontWeight: '600', marginBottom: 12 },
  strategyOption: { padding: 12, borderRadius: 8, borderWidth: 1, marginBottom: 8 },
  strategyText: { fontSize: 13 },
  themeOption: { flex: 1, paddingVertical: 10, borderRadius: 8, borderWidth: 1, marginHorizontal: 4, alignItems: 'center' },
  themeText: { fontSize: 14 },
});
