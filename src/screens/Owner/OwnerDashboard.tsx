import React, { useEffect, useState, useCallback, memo, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { LogOut, TrendingUp, Users, Calendar as CalendarIcon, Clock, Megaphone, MessageSquare, CreditCard, ClipboardList, BarChart2, Settings } from 'lucide-react-native';
import api from '../../api/client';
import { StatCard } from '../../components/StatCard';
import { CallerIdService } from '../../services/CallerIdService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useThemeColors } from '../../theme/useThemeColors';
import { AppointmentBottomSheet } from '../../components/AppointmentBottomSheet';

interface Stats {
  revenueToday: number;
  potentialRevenueToday: number;
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

const EmployeeCard = memo(({ emp, onTaskPress }: { emp: EmployeeSchedule, onTaskPress: (task: EmployeeTask) => void }) => {
  const { colors, isDark } = useThemeColors();
  return (
    <View style={[styles.employeeCard, { backgroundColor: colors.surface, shadowColor: colors.cardShadow }]}>
      <Text style={[styles.employeeName, { color: colors.text }]}>{emp.employeeName}</Text>
      {emp.tasks.length === 0 ? (
        <Text style={[styles.noTasks, { color: colors.textMuted }]}>Brak wizyt na dziś</Text>
      ) : (
        emp.tasks.map(task => (
          <TouchableOpacity 
            key={task.id} 
            style={[styles.taskItem, { borderTopColor: colors.border }]}
            onPress={() => onTaskPress(task)}
            disabled={task.isCustom}
          >
            <View style={styles.taskTimeBox}>
              <Clock size={14} color={colors.textMuted} style={{marginRight: 4}}/>
              <Text style={[styles.taskTime, { color: colors.textMuted }]}>{task.time}</Text>
            </View>
            <View style={styles.taskInfo}>
              <Text style={[styles.taskTitle, { color: colors.text }]}>{task.title}</Text>
              {task.client && <Text style={[styles.taskClient, { color: colors.textMuted }]}>{task.client}</Text>}
            </View>
            <Text style={[styles.taskDuration, { color: colors.textMuted }]}>{task.duration} min</Text>
          </TouchableOpacity>
        ))
      )}
    </View>
  );
});

export const OwnerDashboard = () => {
  const { colors, isDark } = useThemeColors();
  const { signOut } = useAuth();
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const [stats, setStats] = useState<Stats | null>(null);
  const [schedules, setSchedules] = useState<EmployeeSchedule[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [selectedAppointment, setSelectedAppointment] = useState<any | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      const [statsRes, apptsRes, fullApptsRes] = await Promise.all([
        api.get('/CompanyDashboard/stats'),
        api.get('/CompanyDashboard/appointments'),
        api.get('/Appointments')
      ]);
      setStats(statsRes.data);
      const schedulesWithLocalTime = apptsRes.data.map((emp: EmployeeSchedule) => {
        return {
          ...emp,
          tasks: emp.tasks.map(task => {
            if (task.time.includes('T')) {
              const d = new Date(task.time);
              const hh = d.getHours().toString().padStart(2, '0');
              const mm = d.getMinutes().toString().padStart(2, '0');
              return { ...task, time: `${hh}:${mm}` };
            }
            return task;
          })
        };
      });
      setSchedules(schedulesWithLocalTime);
      setAppointments(fullApptsRes.data);
    } catch (e) {
      console.error('Error fetching owner dashboard data:', e);
    }
  };

  const handleTaskPress = (task: EmployeeTask) => {
    if (!task.isCustom) {
      const appt = appointments.find(a => a.id === task.id);
      if (appt) {
        setSelectedAppointment(appt);
        setIsModalVisible(true);
      }
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await api.post(`/Appointments/${id}/approve`);
      fetchData();
    } catch (e) {
      Alert.alert('Błąd', 'Nie udało się zatwierdzić wizyty.');
    }
  };

  const handleReject = async (id: string) => {
    try {
      await api.post(`/Appointments/${id}/reject`);
      fetchData();
    } catch (e) {
      Alert.alert('Błąd', 'Nie udało się odrzucić wizyty.');
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

      // Check caller id local settings and start service if enabled
      try {
        const callerIdStr = await AsyncStorage.getItem('@caller_id_enabled');
        if (callerIdStr === 'true') {
          CallerIdService.startListening((client) => {
             Alert.alert('Dzwoni klient', `Dzwoni klient salonu: ${client.firstName} ${client.lastName} (${client.phone})`);
             // W pełnej wersji nawigacja do karty klienta
             // navigation.navigate('ClientDetails', { clientId: client.id });
          });
        }
      } catch(err) {
        console.error('Error fetching local settings for caller id', err);
      }

      setLoading(false);
    };
    init();

    return () => {
      CallerIdService.stopListening();
    };
  }, []);

  const currentOrNextTask = useMemo(() => {
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    
    let closestTask: EmployeeTask | null = null;
    let closestEmpName: string | null = null;
    let minDiff = Infinity;

    schedules.forEach(emp => {
      emp.tasks.forEach(task => {
        if (task.isCustom) return;
        const [h, m] = task.time.split(':').map(Number);
        const startMins = h * 60 + m;
        const endMins = startMins + task.duration;

        if (currentMinutes >= startMins && currentMinutes < endMins) {
          const diff = -1;
          if (diff < minDiff) {
            minDiff = diff;
            closestTask = task;
            closestEmpName = emp.employeeName;
          }
        } else if (startMins >= currentMinutes) {
          const diff = startMins - currentMinutes;
          if (diff < minDiff) {
            minDiff = diff;
            closestTask = task;
            closestEmpName = emp.employeeName;
          }
        }
      });
    });
    
    return closestTask ? { task: closestTask, employeeName: closestEmpName } : null;
  }, [schedules]);

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
        <Text style={[styles.title, { color: colors.text }]}>Panel Właściciela</Text>
        <TouchableOpacity onPress={signOut}>
          <LogOut color={colors.error} size={24} />
        </TouchableOpacity>
      </View>
      <ScrollView 
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Narzędzia</Text>
        <View style={styles.toolsGrid}>
          <TouchableOpacity style={styles.toolTile} onPress={() => navigation.navigate('Marketing')}>
            <View style={[styles.iconWrapper, { backgroundColor: isDark ? '#1e3a8a' : '#eff6ff' }]}>
              <Megaphone size={24} color={isDark ? '#93c5fd' : '#3b82f6'} />
            </View>
            <Text style={[styles.toolTitle, { color: colors.textMuted }]}>Marketing</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.toolTile} onPress={() => navigation.navigate('Messages')}>
            <View style={[styles.iconWrapper, { backgroundColor: isDark ? '#064e3b' : '#f0fdf4' }]}>
              <MessageSquare size={24} color={isDark ? '#6ee7b7' : '#10b981'} />
            </View>
            <Text style={[styles.toolTitle, { color: colors.textMuted }]}>Wiadomości</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.toolTile} onPress={() => navigation.navigate('LoyaltyCards')}>
            <View style={[styles.iconWrapper, { backgroundColor: isDark ? '#78350f' : '#fef3c7' }]}>
              <CreditCard size={24} color={isDark ? '#fcd34d' : '#f59e0b'} />
            </View>
            <Text style={[styles.toolTitle, { color: colors.textMuted }]}>Lojalność</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.toolTile} onPress={() => navigation.navigate('Waitlist')}>
            <View style={[styles.iconWrapper, { backgroundColor: isDark ? '#831843' : '#fce7f3' }]}>
              <ClipboardList size={24} color={isDark ? '#f9a8d4' : '#ec4899'} />
            </View>
            <Text style={[styles.toolTitle, { color: colors.textMuted }]}>Rezerwy</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.toolTile} onPress={() => navigation.navigate('Statistics')}>
            <View style={[styles.iconWrapper, { backgroundColor: isDark ? '#4c1d95' : '#f3e8ff' }]}>
              <BarChart2 size={24} color={isDark ? '#c4b5fd' : '#8b5cf6'} />
            </View>
            <Text style={[styles.toolTitle, { color: colors.textMuted }]}>Statystyki</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.toolTile} onPress={() => navigation.navigate('Settings')}>
            <View style={[styles.iconWrapper, { backgroundColor: isDark ? '#334155' : '#e2e8f0' }]}>
              <Settings size={24} color={isDark ? '#cbd5e1' : '#475569'} />
            </View>
            <Text style={[styles.toolTitle, { color: colors.textMuted }]}>Ustawienia</Text>
          </TouchableOpacity>
        </View>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>Dzisiejsze podsumowanie</Text>
        <View style={styles.statsRow}>
          <StatCard 
            title="Przychód dziś" 
            value={`${stats?.revenueToday || 0} PLN`} 
            icon={TrendingUp} 
            color="#10b981" 
          />
          <StatCard 
            title="Potencjalny dziś" 
            value={`${stats?.potentialRevenueToday || 0} PLN`} 
            icon={TrendingUp} 
            color="#3b82f6" 
          />
        </View>
        <View style={[styles.statsRow, { marginTop: 12 }]}>
          <StatCard 
            title="Wizyty dziś" 
            value={stats?.appointmentsToday || 0} 
            icon={CalendarIcon} 
            color="#8b5cf6" 
          />
          <StatCard 
            title="Nowi Klienci" 
            value={stats?.newClients || 0} 
            icon={Users} 
            color="#f59e0b" 
          />
        </View>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>Grafik na dziś</Text>
        
        {currentOrNextTask && (
          <View style={{ marginBottom: 16 }}>
            <Text style={{ fontSize: 14, fontWeight: '600', color: colors.primary, marginBottom: 8 }}>Trwająca / Następna Wizyta ({currentOrNextTask.employeeName})</Text>
            <TouchableOpacity 
              style={[styles.taskItem, { backgroundColor: isDark ? '#1e3a8a' : '#eff6ff', borderRadius: 12, padding: 16, borderTopWidth: 0, shadowColor: colors.primary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 }]}
              onPress={() => handleTaskPress(currentOrNextTask.task)}
            >
              <View style={styles.taskTimeBox}>
                <Clock size={14} color={colors.primary} style={{marginRight: 4}}/>
                <Text style={[styles.taskTime, { color: colors.primary }]}>{currentOrNextTask.task.time}</Text>
              </View>
              <View style={styles.taskInfo}>
                <Text style={[styles.taskTitle, { color: colors.text, fontWeight: '700' }]}>{currentOrNextTask.task.title}</Text>
                {currentOrNextTask.task.client && <Text style={[styles.taskClient, { color: colors.textMuted }]}>{currentOrNextTask.task.client}</Text>}
              </View>
              <Text style={[styles.taskDuration, { color: colors.primary }]}>{currentOrNextTask.task.duration} min</Text>
            </TouchableOpacity>
          </View>
        )}

        {schedules.map((emp) => (
          <EmployeeCard key={emp.employeeId} emp={emp} onTaskPress={handleTaskPress} />
        ))}
        <View style={{height: 20}} />
      </ScrollView>

      <AppointmentBottomSheet
        isVisible={isModalVisible}
        onClose={() => setIsModalVisible(false)}
        appointment={selectedAppointment}
        onApprove={handleApprove}
        onReject={handleReject}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  content: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
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
    fontWeight: '500',
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  employeeCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  employeeName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  noTasks: {
    fontStyle: 'italic',
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  taskTimeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 70,
  },
  taskTime: {
    fontSize: 14,
    fontWeight: '500',
  },
  taskInfo: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  taskClient: {
    fontSize: 13,
    marginTop: 2,
  },
  taskDuration: {
    fontSize: 13,
    fontWeight: '500',
  }
});
