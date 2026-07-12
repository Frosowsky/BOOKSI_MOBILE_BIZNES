import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, TouchableWithoutFeedback } from 'react-native';
import { Check, X, ChevronRight } from 'lucide-react-native';
import { useThemeColors } from '../theme/useThemeColors';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

interface AppointmentBottomSheetProps {
  isVisible: boolean;
  onClose: () => void;
  appointment: any;
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
}

export const AppointmentBottomSheet = ({ isVisible, onClose, appointment, onApprove, onReject }: AppointmentBottomSheetProps) => {
  const { colors, isDark } = useThemeColors();
  const navigation = useNavigation<NativeStackNavigationProp<any>>();

  if (!appointment) return null;

  return (
    <Modal
      visible={isVisible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback>
            <View style={[styles.bottomSheet, { backgroundColor: colors.surface }]}>
              <View style={styles.sheetHeader}>
                <View style={[styles.sheetHandle, { backgroundColor: isDark ? '#475569' : '#cbd5e1' }]} />
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                  <Text style={[styles.sheetTitle, { color: colors.text, marginBottom: 0 }]}>{appointment.clientName}</Text>
                  {appointment.clientAverageRating && appointment.clientAverageRating > 0 ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 8 }}>
                      <Text style={{ fontWeight: 'bold', color: '#fbbf24', fontSize: 16 }}>{appointment.clientAverageRating.toFixed(1)}</Text>
                      <Text style={{ fontSize: 16, marginLeft: 2 }}>⭐</Text>
                    </View>
                  ) : null}
                </View>
                <Text style={{ color: colors.textMuted, fontSize: 14 }}>
                  {appointment.serviceName}
                  {appointment.price != null && appointment.price > 0 ? ` (${appointment.price} zł)` : ''}
                </Text>
                <Text style={{ color: colors.textMuted, fontSize: 14, marginBottom: 16 }}>
                  {new Date(appointment.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(appointment.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>

              {appointment.status === 0 && onApprove && onReject && (
                <View style={styles.sheetActionsRow}>
                  <TouchableOpacity 
                    style={[styles.sheetActionBtn, { backgroundColor: '#10b981' }]} 
                    onPress={() => { onApprove(appointment.id); onClose(); }}
                  >
                    <Check size={18} color="#fff" style={{ marginRight: 6 }}/>
                    <Text style={styles.sheetActionText}>Zatwierdź</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.sheetActionBtn, { backgroundColor: '#ef4444' }]} 
                    onPress={() => { onReject(appointment.id); onClose(); }}
                  >
                    <X size={18} color="#fff" style={{ marginRight: 6 }}/>
                    <Text style={styles.sheetActionText}>Odrzuć</Text>
                  </TouchableOpacity>
                </View>
              )}

              <TouchableOpacity 
                style={[styles.fullDetailsBtn, { backgroundColor: colors.primary }]}
                onPress={() => {
                  onClose();
                  navigation.navigate('AppointmentDetails', { appointment });
                }}
              >
                <Text style={styles.fullDetailsText}>Pełna Karta Wizyty</Text>
                <ChevronRight size={20} color="#fff" />
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  bottomSheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40, shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 10 },
  sheetHeader: { alignItems: 'center', marginBottom: 20 },
  sheetHandle: { width: 40, height: 4, borderRadius: 2, marginBottom: 16 },
  sheetTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 4 },
  sheetActionsRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  sheetActionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 12 },
  sheetActionText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  fullDetailsBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 12 },
  fullDetailsText: { color: '#fff', fontWeight: 'bold', fontSize: 16, marginRight: 8 }
});
