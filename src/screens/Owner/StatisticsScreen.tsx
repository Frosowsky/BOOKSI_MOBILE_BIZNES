import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import api from '../../api/client';
import { ArrowLeft, TrendingUp, Users, CalendarX, CheckCircle } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useThemeColors } from '../../theme/useThemeColors';
import { StatCard } from '../../components/StatCard';

export const StatisticsScreen = () => {
  const { colors, isDark } = useThemeColors();
  const navigation = useNavigation();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [rangeType, setRangeType] = useState('day'); // day, week, month, year

  const fetchStats = async (start: string, end: string) => {
    setLoading(true);
    try {
      const res = await api.get(`/Reports/stats?startDate=${start}&endDate=${end}`);
      setStats(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const calculateDatesAndFetch = (type: string) => {
    setRangeType(type);
    const today = new Date();
    let start = new Date();
    let end = new Date();

    if (type === 'day') {
      // today
    } else if (type === 'week') {
      start.setDate(today.getDate() - 7);
    } else if (type === 'month') {
      start.setMonth(today.getMonth() - 1);
    } else if (type === 'year') {
      start.setFullYear(today.getFullYear() - 1);
    }

    const startStr = start.toISOString().split('T')[0];
    const endStr = end.toISOString().split('T')[0];

    fetchStats(startStr, endStr);
  };

  useEffect(() => {
    calculateDatesAndFetch('day');
  }, []);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{marginRight: 16}}>
          <ArrowLeft color={colors.text} size={24} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Zaawansowane Statystyki</Text>
      </View>

      <View style={[styles.filterBar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {['day', 'week', 'month', 'year'].map(type => (
            <TouchableOpacity 
              key={type} 
              style={[styles.filterBtn, { backgroundColor: colors.background, borderColor: colors.border }, rangeType === type && { backgroundColor: isDark ? '#3b216b' : '#f3e8ff', borderColor: '#8b5cf6' }]}
              onPress={() => calculateDatesAndFetch(type)}
            >
              <Text style={[styles.filterText, { color: colors.textMuted }, rangeType === type && { color: isDark ? '#c4b5fd' : '#8b5cf6', fontWeight: 'bold' }]}>
                {type === 'day' ? 'Dziś' : type === 'week' ? 'Ostatnie 7 dni' : type === 'month' ? 'Ostatni Miesiąc' : 'Ostatni Rok'}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {loading ? (
          <ActivityIndicator size="large" color="#8b5cf6" style={{marginTop: 40}} />
        ) : (
          stats ? (
            <>
              <View style={styles.statsRow}>
                <StatCard 
                  title="Całkowity Przychód" 
                  value={`${stats.totalRevenue || 0} PLN`} 
                  icon={TrendingUp} 
                  color="#10b981" 
                />
                <StatCard 
                  title="Zrealizowane Wizyty" 
                  value={stats.appointmentsCount || 0} 
                  icon={CheckCircle} 
                  color="#3b82f6" 
                />
              </View>
              <View style={styles.statsRow}>
                <StatCard 
                  title="Nowi Klienci" 
                  value={stats.newClientsCount || 0} 
                  icon={Users} 
                  color="#f59e0b" 
                />
                <StatCard 
                  title="Anulowane Wizyty" 
                  value={stats.cancelledAppointmentsCount || 0} 
                  icon={CalendarX} 
                  color="#ef4444" 
                />
              </View>
            </>
          ) : (
            <Text style={{textAlign: 'center', color: colors.textMuted, marginTop: 40}}>Wybierz zakres aby zobaczyć statystyki</Text>
          )
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  title: { fontSize: 20, fontWeight: 'bold', color: '#0f172a' },
  filterBar: { paddingVertical: 12, paddingHorizontal: 16, backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  filterBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#f1f5f9', marginRight: 8, borderWidth: 1, borderColor: '#e2e8f0' },
  filterBtnActive: { backgroundColor: '#f3e8ff', borderColor: '#8b5cf6' },
  filterText: { color: '#64748b', fontWeight: '500' },
  filterTextActive: { color: '#8b5cf6', fontWeight: 'bold' },
  content: { padding: 16 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between' }
});
