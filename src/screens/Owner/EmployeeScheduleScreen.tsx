import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert, TextInput } from 'react-native';
import api from '../../api/client';
import { ArrowLeft, ChevronLeft, ChevronRight, Save } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';

type RouteParams = {
  EmployeeSchedule: {
    employeeId: string;
    employeeName: string;
  };
};

interface DaySchedule {
  day: number;
  dateStr: string; // YYYY-MM-DD
  isWorkingDay: boolean;
  startTime: string; // HH:mm
  endTime: string;   // HH:mm
}

export const EmployeeScheduleScreen = () => {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<RouteParams, 'EmployeeSchedule'>>();
  const { employeeId, employeeName } = route.params || { employeeId: '', employeeName: '' };

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // Start with current month
  const [currentDate, setCurrentDate] = useState(() => {
    const d = new Date();
    d.setDate(1); // Set to 1st of month to avoid overflow issues
    return d;
  });
  
  const [scheduleData, setScheduleData] = useState<DaySchedule[]>([]);

  const fetchMonthData = useCallback(async (date: Date) => {
    setLoading(true);
    try {
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const daysInMonth = new Date(year, month, 0).getDate();
      
      const startStr = `${year}-${String(month).padStart(2, '0')}-01`;
      const endStr = `${year}-${String(month).padStart(2, '0')}-${String(daysInMonth).padStart(2, '0')}`;
      
      const res = await api.get(`/Employees/schedules?start=${startStr}&end=${endStr}&employeeId=${employeeId}`);
      const existing = res.data || [];

      // Map to an array covering all days of the month
      const builtData: DaySchedule[] = [];
      for (let day = 1; day <= daysInMonth; day++) {
        const dStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const found = existing.find((e: any) => e.date?.startsWith(dStr));
        
        builtData.push({
          day,
          dateStr: dStr,
          isWorkingDay: found ? found.isWorkingDay : false,
          startTime: (found && found.start) ? found.start.substring(0, 5) : '08:00', // Take HH:mm
          endTime: (found && found.end) ? found.end.substring(0, 5) : '16:00',
        });
      }
      setScheduleData(builtData);
    } catch (e) {
      console.error(e);
      Alert.alert('Błąd', 'Nie udało się pobrać grafiku.');
    } finally {
      setLoading(false);
    }
  }, [employeeId]);

  useEffect(() => {
    fetchMonthData(currentDate);
  }, [currentDate, fetchMonthData]);

  const changeMonth = (diff: number) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + diff);
    setCurrentDate(newDate);
  };

  const handleUpdateDay = useCallback((dayIndex: number, field: keyof DaySchedule, value: any) => {
    setScheduleData(prev => {
      const newData = [...prev];
      newData[dayIndex] = { ...newData[dayIndex], [field]: value };
      return newData;
    });
  }, []);

  const handleSave = async () => {
    setSubmitting(true);
    try {
      const payload = {
        employeeId: employeeId,
        year: currentDate.getFullYear(),
        month: currentDate.getMonth() + 1,
        entries: scheduleData.map(d => ({
          dayOfWeek: null,
          specificDate: `${d.dateStr}T00:00:00Z`,
          isWorkingDay: d.isWorkingDay,
          startTime: d.isWorkingDay ? `${d.startTime}:00` : null,
          endTime: d.isWorkingDay ? `${d.endTime}:00` : null,
        }))
      };

      await api.post('/Schedules/schedule', payload);
      Alert.alert('Sukces', 'Grafik na ten miesiąc został zapisany.');
      navigation.goBack();
    } catch (e) {
      console.error(e);
      Alert.alert('Błąd', 'Nie udało się zapisać grafiku.');
    } finally {
      setSubmitting(false);
    }
  };

  const monthName = currentDate.toLocaleString('pl-PL', { month: 'long', year: 'numeric' });

  const renderItem = useCallback(({ item, index }: { item: DaySchedule; index: number }) => {
    // Check if it's weekend
    const dateObj = new Date(item.dateStr);
    const isWeekend = dateObj.getDay() === 0 || dateObj.getDay() === 6;

    return (
      <View style={[styles.dayCard, isWeekend && styles.weekendCard]}>
        <View style={styles.dayInfo}>
          <Text style={styles.dayNum}>{item.day}</Text>
          <Text style={styles.dayName}>{dateObj.toLocaleString('pl-PL', { weekday: 'short' })}</Text>
        </View>

        <TouchableOpacity 
          style={[styles.toggleBtn, item.isWorkingDay ? styles.toggleWorking : styles.toggleOff]}
          onPress={() => handleUpdateDay(index, 'isWorkingDay', !item.isWorkingDay)}
        >
          <Text style={[styles.toggleText, item.isWorkingDay ? styles.toggleWorkingText : styles.toggleOffText]}>
            {item.isWorkingDay ? 'Pracuje' : 'Wolne'}
          </Text>
        </TouchableOpacity>

        {item.isWorkingDay ? (
          <View style={styles.timeInputsBox}>
            <TextInput 
              style={styles.timeInput} 
              value={item.startTime} 
              onChangeText={(val) => handleUpdateDay(index, 'startTime', val)}
              keyboardType="numeric"
              maxLength={5}
            />
            <Text style={{marginHorizontal: 4}}>-</Text>
            <TextInput 
              style={styles.timeInput} 
              value={item.endTime} 
              onChangeText={(val) => handleUpdateDay(index, 'endTime', val)}
              keyboardType="numeric"
              maxLength={5}
            />
          </View>
        ) : (
          <View style={styles.timeInputsBoxPlaceholder} />
        )}
      </View>
    );
  }, [handleUpdateDay]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{marginRight: 16}}>
          <ArrowLeft color="#0f172a" size={24} />
        </TouchableOpacity>
        <Text style={styles.title} numberOfLines={1}>{employeeName} - Grafik</Text>
      </View>

      <View style={styles.monthSelector}>
        <TouchableOpacity style={styles.monthBtn} onPress={() => changeMonth(-1)}>
          <ChevronLeft color="#3b82f6" size={24} />
        </TouchableOpacity>
        <Text style={styles.monthText}>{monthName.charAt(0).toUpperCase() + monthName.slice(1)}</Text>
        <TouchableOpacity style={styles.monthBtn} onPress={() => changeMonth(1)}>
          <ChevronRight color="#3b82f6" size={24} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#3b82f6" />
        </View>
      ) : (
        <FlatList
          data={scheduleData}
          keyExtractor={item => item.dateStr}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          initialNumToRender={10}
          maxToRenderPerBatch={10}
        />
      )}

      <View style={styles.footer}>
        <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={submitting || loading}>
          {submitting ? <ActivityIndicator color="#fff" /> : (
            <>
              <Save color="#fff" size={20} style={{marginRight: 8}}/>
              <Text style={styles.saveBtnText}>Zapisz Miesiąc</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  title: { fontSize: 18, fontWeight: 'bold', color: '#0f172a', flex: 1 },
  monthSelector: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#ffffff', padding: 16, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  monthBtn: { padding: 4 },
  monthText: { fontSize: 16, fontWeight: '600', color: '#1e293b' },
  list: { padding: 16, paddingBottom: 40 },
  dayCard: { flexDirection: 'row', backgroundColor: '#ffffff', borderRadius: 8, padding: 12, marginBottom: 8, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  weekendCard: { backgroundColor: '#f1f5f9' },
  dayInfo: { width: 50, alignItems: 'center' },
  dayNum: { fontSize: 18, fontWeight: 'bold', color: '#0f172a' },
  dayName: { fontSize: 12, color: '#64748b' },
  toggleBtn: { flex: 1, paddingVertical: 8, borderRadius: 6, alignItems: 'center', marginHorizontal: 12, borderWidth: 1 },
  toggleText: { fontSize: 14 },
  toggleWorking: { backgroundColor: '#dcfce7', borderColor: '#86efac' },
  toggleWorkingText: { color: '#166534', fontWeight: '600' },
  toggleOff: { backgroundColor: '#fee2e2', borderColor: '#fca5a5' },
  toggleOffText: { color: '#991b1b', fontWeight: '600' },
  timeInputsBox: { flexDirection: 'row', alignItems: 'center', width: 120, justifyContent: 'flex-end' },
  timeInputsBoxPlaceholder: { width: 120 },
  timeInput: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4, width: 50, textAlign: 'center', fontSize: 13, color: '#0f172a' },
  footer: { backgroundColor: '#ffffff', padding: 16, borderTopWidth: 1, borderTopColor: '#e2e8f0' },
  saveBtn: { backgroundColor: '#3b82f6', borderRadius: 8, padding: 16, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  saveBtnText: { color: '#ffffff', fontSize: 16, fontWeight: 'bold' }
});
