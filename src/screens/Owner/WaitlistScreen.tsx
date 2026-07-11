import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, Clock, Calendar, User, X } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import api from '../../api/client';

interface WaitlistEntry {
  id: string;
  clientId: string;
  client: { firstName: string; lastName: string; phoneNumber?: string };
  serviceId: string;
  service: { name: string; price: number };
  date: string;
  timeStart: string;
  timeEnd: string;
  isNotified: boolean;
  isExpired: boolean;
  proposedDate?: string;
  proposedTimeStart?: string;
  proposedTimeEnd?: string;
}

export const WaitlistScreen = () => {
  const navigation = useNavigation();
  const [entries, setEntries] = useState<WaitlistEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchWaitlist = async () => {
    setLoading(true);
    try {
      const res = await api.get('/Waitlist');
      setEntries(res.data);
    } catch (error) {
      console.error(error);
      Alert.alert('Błąd', 'Nie udało się pobrać listy rezerwowej.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWaitlist();
  }, []);

  const handleDelete = (id: string) => {
    Alert.alert('Potwierdzenie', 'Czy usunąć tego klienta z listy rezerwowej?', [
      { text: 'Anuluj', style: 'cancel' },
      { text: 'Usuń', style: 'destructive', onPress: async () => {
        try {
          await api.delete(`/Waitlist/${id}`);
          fetchWaitlist();
        } catch (e) {
          Alert.alert('Błąd', 'Nie udało się usunąć wpisu.');
        }
      }}
    ]);
  };

  const renderItem = ({ item }: { item: WaitlistEntry }) => {
    const isProposed = !!item.proposedDate;
    
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.clientInfo}>
            <User color="#4F46E5" size={20} />
            <Text style={styles.clientName}>{item.client?.firstName} {item.client?.lastName}</Text>
          </View>
          <TouchableOpacity onPress={() => handleDelete(item.id)}>
            <X color="#EF4444" size={24} />
          </TouchableOpacity>
        </View>

        <Text style={styles.serviceName}>{item.service?.name}</Text>
        
        <View style={styles.detailsRow}>
          <View style={styles.detailItem}>
            <Calendar color="#6B7280" size={16} />
            <Text style={styles.detailText}>{new Date(item.date).toLocaleDateString()}</Text>
          </View>
          <View style={styles.detailItem}>
            <Clock color="#6B7280" size={16} />
            <Text style={styles.detailText}>{item.timeStart.substring(0, 5)} - {item.timeEnd.substring(0, 5)}</Text>
          </View>
        </View>

        {isProposed ? (
          <View style={styles.proposedBox}>
            <Text style={styles.proposedText}>Zaproponowano inny termin:</Text>
            <Text style={styles.proposedValue}>
              {new Date(item.proposedDate!).toLocaleDateString()} {item.proposedTimeStart?.substring(0, 5)}
            </Text>
          </View>
        ) : (
          <View style={styles.actionsBox}>
            <TouchableOpacity style={styles.proposeBtn} onPress={() => {
                Alert.alert('Proponowanie', 'Ta funkcja otworzy formularz wyboru nowego terminu (wkrótce).');
            }}>
              <Text style={styles.proposeBtnText}>Zaproponuj Termin</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ChevronLeft color="#1F2937" size={28} />
        </TouchableOpacity>
        <Text style={styles.title}>Lista Rezerwowa</Text>
        <View style={{ width: 28 }} />
      </View>

      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color="#4F46E5" />
        </View>
      ) : (
        <FlatList
          data={entries}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <Text style={styles.emptyText}>Lista rezerwowa jest pusta.</Text>
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6'
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB'
  },
  backBtn: {
    padding: 4
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937'
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  listContent: {
    padding: 16
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  clientInfo: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  clientName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginLeft: 8
  },
  serviceName: {
    fontSize: 15,
    color: '#4F46E5',
    fontWeight: '600',
    marginBottom: 12
  },
  detailsRow: {
    flexDirection: 'row',
    marginBottom: 12
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16
  },
  detailText: {
    marginLeft: 6,
    color: '#4B5563',
    fontSize: 14
  },
  proposedBox: {
    backgroundColor: '#FEF3C7',
    padding: 12,
    borderRadius: 8,
    marginTop: 8
  },
  proposedText: {
    color: '#D97706',
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 4
  },
  proposedValue: {
    color: '#92400E',
    fontSize: 14,
    fontWeight: 'bold'
  },
  actionsBox: {
    marginTop: 8,
    alignItems: 'flex-start'
  },
  proposeBtn: {
    backgroundColor: '#F3F4F6',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB'
  },
  proposeBtnText: {
    color: '#4B5563',
    fontWeight: 'bold',
    fontSize: 14
  },
  emptyText: {
    textAlign: 'center',
    color: '#6B7280',
    marginTop: 40,
    fontSize: 16
  }
});
