import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { LogOut, TrendingUp, Building, Percent, Clock } from 'lucide-react-native';
import api from '../../api/client';
import { StatCard } from '../../components/StatCard';
import { SafeAreaView } from 'react-native-safe-area-context';

interface SalesSummary {
  estimatedRevenue: number;
  commissionPercentage: number;
  demoCompaniesCount: number;
  activeCompaniesCount: number;
  totalCompanies: number;
}

export const SalespersonDashboard = () => {
  const { signOut } = useAuth();
  const [summary, setSummary] = useState<SalesSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      const summaryRes = await api.get('/SalesDashboard/summary');
      setSummary(summaryRes.data);
    } catch (e) {
      console.error('Error fetching sales dashboard summary:', e);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await fetchData();
      setLoading(false);
    };
    init();
  }, []);

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
        <Text style={styles.title}>Panel Handlowca</Text>
        <TouchableOpacity onPress={signOut}>
          <LogOut color="#ef4444" size={24} />
        </TouchableOpacity>
      </View>
      <ScrollView 
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <Text style={styles.sectionTitle}>Podsumowanie Sprzedaży</Text>
        <View style={styles.statsRow}>
          <StatCard 
            title="Szacowana Prowizja" 
            value={`${summary?.estimatedRevenue || 0} PLN`} 
            icon={TrendingUp} 
            color="#10b981" 
          />
          <StatCard 
            title="Twoja Stawka" 
            value={`${summary?.commissionPercentage || 0}%`} 
            icon={Percent} 
            color="#8b5cf6" 
          />
        </View>
        <View style={styles.statsRow}>
          <StatCard 
            title="Aktywne Salony" 
            value={summary?.activeCompaniesCount || 0} 
            icon={Building} 
            color="#3b82f6" 
          />
          <StatCard 
            title="Salony Demo" 
            value={summary?.demoCompaniesCount || 0} 
            icon={Clock} 
            color="#f59e0b" 
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  center: { justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  title: { fontSize: 20, fontWeight: 'bold', color: '#0f172a' },
  content: { padding: 16 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#1e293b', marginTop: 8, marginBottom: 12 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between' }
});
