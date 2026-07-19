import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../api/client';
import { View, Text, StyleSheet } from 'react-native';
import { WifiOff } from 'lucide-react-native';

interface OfflineContextType {
  isOffline: boolean;
}

const OfflineContext = createContext<OfflineContextType>({ isOffline: false });

export const useOffline = () => useContext(OfflineContext);

interface OfflineProviderProps {
  children: ReactNode;
}

export const OfflineProvider = ({ children }: OfflineProviderProps) => {
  const [isOffline, setIsOffline] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const [justReconnected, setJustReconnected] = useState(false);

  const syncOfflineQueue = async () => {
    try {
      const queueRaw = await AsyncStorage.getItem('offlineQueue');
      if (queueRaw) {
        const queue = JSON.parse(queueRaw);
        if (queue.length > 0) {
          console.log(`Syncing ${queue.length} items from offline queue...`);
          for (const item of queue) {
            try {
              await api({
                method: item.method,
                url: item.url,
                data: item.data,
                headers: item.headers
              });
            } catch (err) {
              console.error('Failed to sync item:', item.url, err);
            }
          }
          await AsyncStorage.removeItem('offlineQueue');
        }
      }
    } catch (e) {
      console.error('Error in syncOfflineQueue:', e);
    }
  };

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      const offline = !(state.isConnected && state.isInternetReachable !== false);
      
      if (offline !== isOffline) {
        setIsOffline(offline);
        if (offline) {
          setShowBanner(true);
          setJustReconnected(false);
        } else {
          // Reconnected
          setJustReconnected(true);
          syncOfflineQueue();
          setTimeout(() => {
            setJustReconnected(false);
            setShowBanner(false);
          }, 3000); // Hide success banner after 3s
        }
      }
    });

    return () => unsubscribe();
  }, [isOffline]);

  return (
    <OfflineContext.Provider value={{ isOffline }}>
      {children}
      
      {/* Offline Badge in Corner */}
      {isOffline && (
        <View style={styles.offlineBadge}>
          <Text style={styles.offlineBadgeText}>Offline</Text>
        </View>
      )}

      {/* Reconnect Banner */}
      {justReconnected && (
        <View style={styles.reconnectBanner}>
          <Text style={styles.reconnectText}>Z powrotem w trybie Online. Synchronizacja...</Text>
        </View>
      )}

      {/* Offline Banner */}
      {isOffline && showBanner && (
        <View style={styles.offlineBanner}>
          <WifiOff size={16} color="#fff" style={{ marginRight: 8 }} />
          <Text style={styles.offlineText}>Brak połączenia. Działasz w trybie Offline.</Text>
        </View>
      )}
    </OfflineContext.Provider>
  );
};

const styles = StyleSheet.create({
  offlineBadge: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: 'rgba(239, 68, 68, 0.9)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 9999,
    elevation: 10,
  },
  offlineBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  offlineBanner: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    backgroundColor: '#ef4444',
    padding: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9998,
    elevation: 9,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  offlineText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  reconnectBanner: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    backgroundColor: '#10b981',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9998,
    elevation: 9,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  reconnectText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  }
});
