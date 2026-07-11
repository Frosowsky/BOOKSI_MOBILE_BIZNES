import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import api from '../../api/client';
import { MessageSquare, ArrowLeft } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useThemeColors } from '../../theme/useThemeColors';

export const MessagesScreen = () => {
  const { colors, isDark } = useThemeColors();
  const navigation = useNavigation();
  const [chats, setChats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchChats = async () => {
    try {
      // Mocking salonId since we don't have it explicitly stored in frontend yet 
      // or we can fetch it. For now let's pass a placeholder "default"
      const res = await api.get('/Chat/salon/default');
      setChats(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await fetchChats();
      setLoading(false);
    };
    init();
  }, []);

  const renderItem = useCallback(({ item }: { item: any }) => (
    <TouchableOpacity style={[styles.card, { backgroundColor: colors.surface, shadowColor: colors.cardShadow }]}>
      <View style={[styles.avatarBox, { backgroundColor: isDark ? '#064e3b' : '#d1fae5' }]}>
        <MessageSquare color={colors.success} size={20} />
      </View>
      <View style={styles.info}>
        <Text style={[styles.name, { color: colors.text }]}>{item.clientName || 'Klient'}</Text>
        <Text style={[styles.lastMsg, { color: colors.textMuted }]} numberOfLines={1}>{item.lastMessage || 'Nowa wiadomość'}</Text>
      </View>
      <View style={styles.rightSide}>
        <Text style={[styles.time, { color: colors.textMuted }]}>{item.lastMessageTime ? new Date(item.lastMessageTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ''}</Text>
      </View>
    </TouchableOpacity>
  ), [colors, isDark]);

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
        <TouchableOpacity onPress={() => navigation.goBack()} style={{marginRight: 16}}>
          <ArrowLeft color={colors.text} size={24} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Wiadomości</Text>
      </View>

      <FlatList
        data={chats}
        keyExtractor={(item, index) => item.id?.toString() || index.toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={[styles.emptyText, { color: colors.textMuted }]}>Brak wiadomości od klientów.</Text>}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  center: { justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  title: { fontSize: 20, fontWeight: 'bold', color: '#0f172a' },
  list: { padding: 16 },
  card: { flexDirection: 'row', backgroundColor: '#ffffff', borderRadius: 12, padding: 16, marginBottom: 12, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  avatarBox: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#d1fae5', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  info: { flex: 1 },
  name: { fontSize: 16, fontWeight: '600', color: '#1e293b', marginBottom: 4 },
  lastMsg: { fontSize: 14, color: '#64748b' },
  rightSide: { alignItems: 'flex-end', marginLeft: 8 },
  time: { fontSize: 12, color: '#94a3b8' },
  emptyText: { textAlign: 'center', color: '#94a3b8', marginTop: 40 },
});
