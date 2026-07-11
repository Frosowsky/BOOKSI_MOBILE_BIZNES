import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert, TextInput } from 'react-native';
import api from '../../api/client';
import { ArrowLeft, ChevronLeft, ChevronRight, Save, Plus, X } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useThemeColors } from '../../theme/useThemeColors';

type RouteParams = {
  EmployeeSchedule: {
    employeeId: string;
    employeeName: string;
  };
};

interface TimeSlot {
  id: string; // purely for frontend keying
  startTime: string;
  endTime: string;
}

interface DaySchedule {
  day: number;
  dateStr: string; // YYYY-MM-DD
  isWorkingDay: boolean;
  slots: TimeSlot[];
}

export const EmployeeScheduleScreen = () => {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<RouteParams, 'EmployeeSchedule'>>();
  const { employeeId, employeeName } = route.params || { employeeId: '', employeeName: '' };
  const { colors, isDark } = useThemeColors();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  const [currentDate, setCurrentDate] = useState(() => {
    const d = new Date();
    d.setDate(1); 
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

      const builtData: DaySchedule[] = [];
      for (let day = 1; day <= daysInMonth; day++) {
        const dStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        
        // Find all records for this specific date
        const dayRecords = existing.filter((e: any) => e.date?.startsWith(dStr));
        
        const isWorking = dayRecords.length > 0 && dayRecords.some((e:any) => e.isWorkingDay);
        
        const slots: TimeSlot[] = [];
        if (isWorking) {
          dayRecords.forEach((r: any) => {
            if (r.start && r.end) {
              slots.push({
                id: Math.random().toString(36).substr(2, 9),
                startTime: r.start.substring(0, 5),
                endTime: r.end.substring(0, 5)
              });
            }
          });
          // If marked working but no valid slots returned, give a default slot
          if (slots.length === 0) {
            slots.push({ id: Math.random().toString(36).substr(2, 9), startTime: '08:00', endTime: '16:00' });
          }
        }

        builtData.push({
          day,
          dateStr: dStr,
          isWorkingDay: isWorking,
          slots: slots
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

  const handleToggleWorking = useCallback((dayIndex: number) => {
    setScheduleData(prev => {
      const newData = [...prev];
      const dayData = newData[dayIndex];
      const willWork = !dayData.isWorkingDay;
      
      newData[dayIndex] = { 
        ...dayData, 
        isWorkingDay: willWork,
        slots: willWork ? [{ id: Math.random().toString(36).substr(2, 9), startTime: '08:00', endTime: '16:00' }] : []
      };
      return newData;
    });
  }, []);

  const handleAddSlot = useCallback((dayIndex: number) => {
    setScheduleData(prev => {
      const newData = [...prev];
      newData[dayIndex].slots.push({ id: Math.random().toString(36).substr(2, 9), startTime: '16:00', endTime: '18:00' });
      return newData;
    });
  }, []);

  const handleRemoveSlot = useCallback((dayIndex: number, slotId: string) => {
    setScheduleData(prev => {
      const newData = [...prev];
      newData[dayIndex].slots = newData[dayIndex].slots.filter(s => s.id !== slotId);
      // If no slots left, mark as not working
      if (newData[dayIndex].slots.length === 0) {
        newData[dayIndex].isWorkingDay = false;
      }
      return newData;
    });
  }, []);

  const handleUpdateSlot = useCallback((dayIndex: number, slotId: string, field: 'startTime' | 'endTime', value: string) => {
    setScheduleData(prev => {
      const newData = [...prev];
      const slotIndex = newData[dayIndex].slots.findIndex(s => s.id === slotId);
      if (slotIndex > -1) {
        newData[dayIndex].slots[slotIndex] = { ...newData[dayIndex].slots[slotIndex], [field]: value };
      }
      return newData;
    });
  }, []);

  const handleSave = async () => {
    setSubmitting(true);
    try {
      const entries: any[] = [];
      
      scheduleData.forEach(d => {
        if (!d.isWorkingDay) {
          // Send a single entry saying this day is NOT a working day
          entries.push({
            dayOfWeek: null,
            specificDate: `${d.dateStr}T00:00:00Z`,
            isWorkingDay: false,
            startTime: null,
            endTime: null,
          });
        } else {
          // Send an entry for each slot
          d.slots.forEach(slot => {
            entries.push({
              dayOfWeek: null,
              specificDate: `${d.dateStr}T00:00:00Z`,
              isWorkingDay: true,
              startTime: `${slot.startTime}:00`,
              endTime: `${slot.endTime}:00`,
            });
          });
        }
      });

      const payload = {
        employeeId: employeeId,
        year: currentDate.getFullYear(),
        month: currentDate.getMonth() + 1,
        entries: entries
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
    const dateObj = new Date(item.dateStr);
    const isWeekend = dateObj.getDay() === 0 || dateObj.getDay() === 6;

    return (
      <View style={[styles.dayCard, { backgroundColor: colors.surface, shadowColor: colors.cardShadow }, isWeekend && { backgroundColor: isDark ? '#1e293b' : '#f1f5f9' }]}>
        <View style={styles.dayTopRow}>
          <View style={styles.dayInfo}>
            <Text style={[styles.dayNum, { color: colors.text }]}>{item.day}</Text>
            <Text style={[styles.dayName, { color: colors.textMuted }]}>{dateObj.toLocaleString('pl-PL', { weekday: 'short' })}</Text>
          </View>

          <TouchableOpacity 
            style={[styles.toggleBtn, item.isWorkingDay ? styles.toggleWorking : styles.toggleOff]}
            onPress={() => handleToggleWorking(index)}
          >
            <Text style={[styles.toggleText, item.isWorkingDay ? styles.toggleWorkingText : styles.toggleOffText]}>
              {item.isWorkingDay ? 'Pracuje' : 'Wolne'}
            </Text>
          </TouchableOpacity>
        </View>

        {item.isWorkingDay && (
          <View style={styles.slotsContainer}>
            {item.slots.map((slot) => (
              <View key={slot.id} style={styles.slotRow}>
                <TextInput 
                  style={[styles.timeInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]} 
                  value={slot.startTime} 
                  onChangeText={(val) => handleUpdateSlot(index, slot.id, 'startTime', val)}
                  keyboardType="numeric"
                  maxLength={5}
                />
                <Text style={[styles.slotDivider, { color: colors.textMuted }]}>-</Text>
                <TextInput 
                  style={[styles.timeInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]} 
                  value={slot.endTime} 
                  onChangeText={(val) => handleUpdateSlot(index, slot.id, 'endTime', val)}
                  keyboardType="numeric"
                  maxLength={5}
                />
                <TouchableOpacity onPress={() => handleRemoveSlot(index, slot.id)} style={styles.removeSlotBtn}>
                  <X color="#ef4444" size={20} />
                </TouchableOpacity>
              </View>
            ))}
            <TouchableOpacity onPress={() => handleAddSlot(index)} style={styles.addSlotBtn}>
              <Plus color="#3b82f6" size={16} />
              <Text style={styles.addSlotText}>Dodaj godziny</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  }, [handleToggleWorking, handleUpdateSlot, handleRemoveSlot, handleAddSlot, colors, isDark]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{marginRight: 16}}>
          <ArrowLeft color={colors.text} size={24} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>{employeeName} - Grafik</Text>
      </View>

      <View style={[styles.monthSelector, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.monthBtn} onPress={() => changeMonth(-1)}>
          <ChevronLeft color={colors.primary} size={24} />
        </TouchableOpacity>
        <Text style={[styles.monthText, { color: colors.text }]}>{monthName.charAt(0).toUpperCase() + monthName.slice(1)}</Text>
        <TouchableOpacity style={styles.monthBtn} onPress={() => changeMonth(1)}>
          <ChevronRight color={colors.primary} size={24} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
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

      <View style={[styles.footer, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
        <TouchableOpacity style={[styles.saveBtn, { backgroundColor: isDark ? colors.primary : '#0f172a' }]} onPress={handleSave} disabled={submitting || loading}>
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
  dayCard: { backgroundColor: '#ffffff', borderRadius: 8, padding: 12, marginBottom: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  weekendCard: { backgroundColor: '#f1f5f9' },
  dayTopRow: { flexDirection: 'row', alignItems: 'center' },
  dayInfo: { width: 50, alignItems: 'center' },
  dayNum: { fontSize: 18, fontWeight: 'bold', color: '#0f172a' },
  dayName: { fontSize: 12, color: '#64748b' },
  toggleBtn: { flex: 1, paddingVertical: 8, borderRadius: 6, alignItems: 'center', marginHorizontal: 12, borderWidth: 1 },
  toggleText: { fontSize: 14 },
  toggleWorking: { backgroundColor: '#dcfce7', borderColor: '#86efac' },
  toggleWorkingText: { color: '#166534', fontWeight: '600' },
  toggleOff: { backgroundColor: '#fee2e2', borderColor: '#fca5a5' },
  toggleOffText: { color: '#991b1b', fontWeight: '600' },
  
  slotsContainer: { marginTop: 12, paddingLeft: 62, paddingRight: 12 },
  slotRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, justifyContent: 'space-between' },
  slotDivider: { marginHorizontal: 8, color: '#64748b' },
  timeInput: { flex: 1, backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 6, textAlign: 'center', fontSize: 14, color: '#0f172a' },
  removeSlotBtn: { padding: 8, marginLeft: 8 },
  addSlotBtn: { flexDirection: 'row', alignItems: 'center', marginTop: 4, paddingVertical: 4 },
  addSlotText: { color: '#3b82f6', fontSize: 14, fontWeight: '500', marginLeft: 4 },

  footer: { backgroundColor: '#ffffff', padding: 16, borderTopWidth: 1, borderTopColor: '#e2e8f0' },
  saveBtn: { backgroundColor: '#3b82f6', borderRadius: 8, padding: 16, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  saveBtnText: { color: '#ffffff', fontSize: 16, fontWeight: 'bold' }
});
