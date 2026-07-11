import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, Alert } from 'react-native';
import { Button } from '../../components/Button';
import { useThemeColors } from '../../theme/useThemeColors';
import api from '../../api/client';
import DateTimePickerModal from 'react-native-modal-datetime-picker';

const daysOfWeek = ['Niedziela', 'Poniedziałek', 'Wtorek', 'Środa', 'Czwartek', 'Piątek', 'Sobota'];

export const Step2BusinessHours = ({ navigation }: any) => {
  const { colors } = useThemeColors();
  const [isLoading, setIsLoading] = useState(false);
  
  // Default to Mon-Fri 8:00-16:00, Sat-Sun Closed
  const [hours, setHours] = useState(daysOfWeek.map((day, index) => ({
    dayOfWeek: index,
    isClosed: index === 0 || index === 6,
    startTime: '08:00',
    endTime: '16:00'
  })));

  const [calendarTimeStep, setCalendarTimeStep] = useState(30);

  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  const [activePicker, setActivePicker] = useState<{index: number, type: 'start'|'end'} | null>(null);

  const showDatePicker = (index: number, type: 'start'|'end') => {
    setActivePicker({ index, type });
    setDatePickerVisibility(true);
  };

  const hideDatePicker = () => {
    setDatePickerVisibility(false);
    setActivePicker(null);
  };

  const handleConfirm = (date: Date) => {
    if (activePicker) {
      const timeString = date.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' });
      const newHours = [...hours];
      if (activePicker.type === 'start') {
        newHours[activePicker.index].startTime = timeString;
      } else {
        newHours[activePicker.index].endTime = timeString;
      }
      setHours(newHours);
    }
    hideDatePicker();
  };

  const toggleDay = (index: number) => {
    const newHours = [...hours];
    newHours[index].isClosed = !newHours[index].isClosed;
    setHours(newHours);
  };

  const handleNext = async () => {
    setIsLoading(true);
    try {
      const payload = {
        calendarTimeStep,
        hours: hours.map(h => ({
          dayOfWeek: h.dayOfWeek,
          startTime: h.startTime + ':00',
          endTime: h.endTime + ':00',
          isClosed: h.isClosed
        }))
      };
      
      await api.put('/Setup/hours', payload);
      navigation.navigate('Step3Categories');
    } catch (e) {
      Alert.alert('Błąd', 'Nie udało się zapisać godzin otwarcia.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>Godziny Otwarcia</Text>
      <Text style={[styles.subtitle, { color: colors.text + '80' }]}>
        Ustal godziny w jakich otwarty jest Twój salon.
      </Text>

      {hours.map((item, index) => (
        <View key={index} style={[styles.dayRow, { borderBottomColor: colors.border }]}>
          <View style={styles.dayInfo}>
            <Switch
              value={!item.isClosed}
              onValueChange={() => toggleDay(index)}
              trackColor={{ false: colors.border, true: colors.primary }}
            />
            <Text style={[styles.dayText, { color: colors.text, opacity: item.isClosed ? 0.5 : 1 }]}>
              {daysOfWeek[index]}
            </Text>
          </View>
          
          {!item.isClosed ? (
            <View style={styles.timeInfo}>
              <Text style={[styles.timeBtn, { color: colors.primary }]} onPress={() => showDatePicker(index, 'start')}>
                {item.startTime}
              </Text>
              <Text style={{ color: colors.text }}> - </Text>
              <Text style={[styles.timeBtn, { color: colors.primary }]} onPress={() => showDatePicker(index, 'end')}>
                {item.endTime}
              </Text>
            </View>
          ) : (
            <Text style={{ color: colors.text + '50' }}>Zamknięte</Text>
          )}
        </View>
      ))}

      <View style={{ marginTop: 40 }}>
        <Button title="Zapisz i kontynuuj" onPress={handleNext} loading={isLoading} />
      </View>

      <DateTimePickerModal
        isVisible={isDatePickerVisible}
        mode="time"
        onConfirm={handleConfirm}
        onCancel={hideDatePicker}
        is24Hour={true}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 30,
  },
  dayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
  },
  dayInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dayText: {
    fontSize: 16,
    marginLeft: 10,
    fontWeight: '500',
  },
  timeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeBtn: {
    fontSize: 16,
    padding: 5,
    fontWeight: '600',
  }
});
