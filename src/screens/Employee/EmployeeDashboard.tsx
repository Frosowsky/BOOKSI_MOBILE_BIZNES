import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { LogOut, Calendar as CalendarIcon, Clock } from 'lucide-react-native';
import api from '../../api/client';
import { SafeAreaView } from 'react-native-safe-area-context';

interface EmployeeTask {
  id: string;
  time: string;
  duration: number;
  title: string;
  client: string | null;
  isCustom: boolean;
  price?: number;
}

interface EmployeeSchedule {
  employeeId: string;
  employeeName: string;
  tasks: EmployeeTask[];
}

export const EmployeeDashboard = () => {
  const { signOut } = useAuth();
  const [schedules, setSchedules] = useState<EmployeeSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      const res = await api.get('/CompanyDashboard/appointments');
      setSchedules(res.data);
    } catch (e) {
      console.error('Error fetching employee dashboard data:', e);
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
        <Text style={styles.title}>Panel Pracownika</Text>
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
        <View style={styles.welcomeBox}>
          <CalendarIcon size={32} color="#3b82f6" style={{marginBottom: 12}} />
          <Text style={styles.welcomeTitle}>Twój plan dnia</Text>
          <Text style={styles.welcomeSubtitle}>Poniżej znajduje się lista wszystkich dzisiejszych wizyt w salonie.</Text>
        </View>

        <Text style={styles.sectionTitle}>Grafik na dziś</Text>
        {schedules.map((emp) => (
          <View key={emp.employeeId} style={styles.employeeCard}>
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
                    <Text style={styles.taskTitle}>
                      {task.title}
                      {task.price != null && task.price > 0 ? ` (${task.price} zł)` : ''}
                    </Text>
                    {task.client && <Text style={styles.taskClient}>{task.client}</Text>}
                  </View>
                  <Text style={styles.taskDuration}>{task.duration} min</Text>
                </View>
              ))
            )}
          </View>
        ))}
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
  welcomeBox: { backgroundColor: '#ffffff', borderRadius: 16, padding: 20, marginBottom: 20, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12, elevation: 3 },
  welcomeTitle: { fontSize: 18, fontWeight: 'bold', color: '#1e293b', marginBottom: 8 },
  welcomeSubtitle: { fontSize: 14, color: '#64748b', textAlign: 'center' },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#1e293b', marginTop: 8, marginBottom: 12 },
  employeeCard: { backgroundColor: '#ffffff', borderRadius: 12, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  employeeName: { fontSize: 16, fontWeight: '600', color: '#0f172a', marginBottom: 12 },
  noTasks: { color: '#94a3b8', fontStyle: 'italic' },
  taskItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  taskTimeBox: { flexDirection: 'row', alignItems: 'center', width: 70 },
  taskTime: { fontSize: 14, fontWeight: '500', color: '#475569' },
  taskInfo: { flex: 1 },
  taskTitle: { fontSize: 14, fontWeight: '600', color: '#1e293b' },
  taskClient: { fontSize: 13, color: '#64748b', marginTop: 2 },
  taskDuration: { fontSize: 13, color: '#94a3b8', fontWeight: '500' }
});
