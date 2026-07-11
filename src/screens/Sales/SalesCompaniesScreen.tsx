import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import api from '../../api/client';
import { Building, Phone } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface SalesCompany {
  id: string;
  name: string;
  identifier: string;
  status: string;
  monthlyPrice: number;
  commission: number;
  phoneNumber: string | null;
  subscriptionValidUntil: string | null;
}

export const SalesCompaniesScreen = () => {
  const [companies, setCompanies] = useState<SalesCompany[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchCompanies = async () => {
    try {
      const res = await api.get('/SalesDashboard/companies');
      setCompanies(res.data);
    } catch (e) {
      console.error('Error fetching companies:', e);
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await fetchCompanies();
      setLoading(false);
    };
    init();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchCompanies();
    setRefreshing(false);
  };

  const renderItem = ({ item }: { item: SalesCompany }) => {
    return (
      <View style={styles.companyCard}>
        <View style={styles.companyHeader}>
          <Text style={styles.companyName}>{item.name}</Text>
          <View style={[styles.statusBadge, { backgroundColor: item.status === 'Active' ? '#dcfce7' : '#fef3c7' }]}>
            <Text style={[styles.statusText, { color: item.status === 'Active' ? '#166534' : '#92400e' }]}>
              {item.status === 'Active' ? 'Aktywny' : 'Demo'}
            </Text>
          </View>
        </View>
        <Text style={styles.companyId}>ID: {item.identifier}</Text>

        <View style={styles.detailsRow}>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Abonament</Text>
            <Text style={styles.detailValue}>{item.monthlyPrice} PLN</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Prowizja</Text>
            <Text style={styles.detailValue}>{item.commission} PLN</Text>
          </View>
        </View>

        {item.phoneNumber && (
          <View style={styles.contactRow}>
            <Phone size={14} color="#64748b" style={{marginRight: 6}} />
            <Text style={styles.contactText}>{item.phoneNumber}</Text>
          </View>
        )}
      </View>
    );
  };

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
        <Text style={styles.title}>Moje Salony</Text>
      </View>
      <FlatList
        data={companies}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <Text style={styles.emptyText}>Brak pozyskanych salonów.</Text>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  center: { justifyContent: 'center', alignItems: 'center' },
  header: { padding: 20, backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  title: { fontSize: 20, fontWeight: 'bold', color: '#0f172a' },
  list: { padding: 16 },
  companyCard: { backgroundColor: '#ffffff', borderRadius: 12, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  companyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 },
  companyName: { fontSize: 16, fontWeight: '600', color: '#0f172a', flex: 1, marginRight: 8 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontSize: 12, fontWeight: '600' },
  companyId: { fontSize: 13, color: '#64748b', marginBottom: 16 },
  detailsRow: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 12, marginBottom: 12 },
  detailItem: { flex: 1 },
  detailLabel: { fontSize: 12, color: '#64748b', marginBottom: 2 },
  detailValue: { fontSize: 14, fontWeight: '600', color: '#1e293b' },
  contactRow: { flexDirection: 'row', alignItems: 'center' },
  contactText: { fontSize: 13, color: '#475569' },
  emptyText: { textAlign: 'center', color: '#94a3b8', marginTop: 40 }
});
