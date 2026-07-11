import React, { useEffect, useState, useCallback, memo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { LogOut, TrendingUp, Users, Calendar as CalendarIcon, Clock, Megaphone, MessageSquare, CreditCard, ClipboardList, BarChart2 } from 'lucide-react-native';
import api from '../../api/client';
import { StatCard } from '../../components/StatCard';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

interface Stats {
  revenueToday: number;
  newClients: number;
  appointmentsToday: number;
}

interface EmployeeTask {
  id: string;
  time: string;
  duration: number;
  title: string;
  client: string | null;
  isCustom: boolean;
}

interface EmployeeSchedule {
  employeeId: string;
  employeeName: string;
  tasks: EmployeeTask[];
}

const EmployeeCard = memo(({ emp }: { emp: EmployeeSchedule }) => {
  return (
    <View style={styles.employeeCard}>
      <Text style={styles.employeeName}>{emp.employeeName}</Text>
      {emp.tasks.length === 0 ? (
        <Text style={styles.noTasks}>Brak wizyt na dziś</Text>
      ) : (
        emp.tasks.map(task => (
          <View key={task.id} style={styles.taskItem}>
            <View style={styles.taskTimeBox}>
              <Clock size={14} color="#64748b" style={{marginRight: 4}}/>
              <Text style={styles.taskTime}>{task.time}</Text>
            </View>
            <View style={styles.taskInfo}>
              <Text style={styles.taskTitle}>{task.title}</Text>
              {task.client && <Text style={styles.taskClient}>{task.client}</Text>}
            </View>
            <Text style={styles.taskDuration}>{task.duration} min</Text>
          </View>
        ))
      )}
    </View>
  );
});

export const OwnerDashboard = () => {
  const { signOut } = useAuth();
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const [stats, setStats] = useState<Stats | null>(null);
  const [schedules, setSchedules] = useState<EmployeeSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      const [statsRes, apptsRes] = await Promise.all([
        api.get('/CompanyDashboard/stats'),
        api.get('/CompanyDashboard/appointments')
      ]);
      setStats(statsRes.data);
      setSchedules(apptsRes.data);
    } catch (e) {
      console.error('Error fetching owner dashboard data:', e);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, []);

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
        <Text style={styles.title}>Panel Właściciela</Text>
        <TouchableOpacity onPress={signOut}>
          <LogOut color="#ef4444" size={24} />
        </TouchableOpacity>
      </View>
      <ScrollView 
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionTitle}>Narzędzia</Text>
        <View style={styles.toolsGrid}>
          <TouchableOpacity style={styles.toolTile} onPress={() => navigation.navigate('Marketing')}>
            <View style={[styles.iconWrapper, { backgroundColor: '#eff6ff' }]}>
              <Megaphone size={24} color="#3b82f6" />
            </View>
            <Text style={styles.toolTitle}>Marketing</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.toolTile} onPress={() => navigation.navigate('Messages')}>
            <View style={[styles.iconWrapper, { backgroundColor: '#f0fdf4' }]}>
              <MessageSquare size={24} color="#10b981" />
            </View>
            <Text style={styles.toolTitle}>Wiadomości</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.toolTile} onPress={() => navigation.navigate('LoyaltyCards')}>
            <View style={[styles.iconWrapper, { backgroundColor: '#fef3c7' }]}>
              <CreditCard size={24} color="#f59e0b" />
            </View>
            <Text style={styles.toolTitle}>Lojalność</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.toolTile} onPress={() => navigation.navigate('Waitlist')}>
            <View style={[styles.iconWrapper, { backgroundColor: '#fce7f3' }]}>
              <ClipboardList size={24} color="#ec4899" />
            </View>
            <Text style={styles.toolTitle}>Rezerwy</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.toolTile} onPress={() => navigation.navigate('Statistics')}>
            <View style={[styles.iconWrapper, { backgroundColor: '#f3e8ff' }]}>
              <BarChart2 size={24} color="#8b5cf6" />
            </View>
            <Text style={styles.toolTitle}>Statystyki</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>Dzisiejsze podsumowanie</Text>
        <View style={styles.statsRow}>
          <StatCard 
            title="Przychód dziś" 
            value={`${stats?.revenueToday || 0} PLN`} 
            icon={TrendingUp} 
            color="#10b981" 
          />
          <StatCard 
            title="Wizyty dziś" 
            value={stats?.appointmentsToday || 0} 
            icon={CalendarIcon} 
            color="#3b82f6" 
          />
        </View>
        <View style={styles.statsRow}>
          <StatCard 
            title="Nowi Klienci" 
            value={stats?.newClients || 0} 
            icon={Users} 
            color="#f59e0b" 
          />
        </View>

        <Text style={styles.sectionTitle}>Grafik na dziś</Text>
        {schedules.map((emp) => (
          <EmployeeCard key={emp.employeeId} emp={emp} />
        ))}
        <View style={{height: 20}} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  content: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginTop: 16,
    marginBottom: 12,
  },
  toolsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    marginHorizontal: -6,
  },
  toolTile: {
    width: '33.33%',
    padding: 6,
    alignItems: 'center',
    marginBottom: 12,
  },
  iconWrapper: {
    width: 60,
    height: 60,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  toolTitle: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '500',
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  employeeCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  employeeName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 12,
  },
  noTasks: {
    color: '#94a3b8',
    fontStyle: 'italic',
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  taskTimeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 70,
  },
  taskTime: {
    fontSize: 14,
    fontWeight: '500',
    color: '#475569',
  },
  taskInfo: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
  },
  taskClient: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 2,
  },
  taskDuration: {
    fontSize: 13,
    color: '#94a3b8',
    fontWeight: '500',
  }
});
