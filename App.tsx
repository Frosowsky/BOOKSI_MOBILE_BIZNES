import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/context/AuthContext';
import { RootNavigator } from './src/navigation/RootNavigator';
import { ThemeProvider } from './src/context/ThemeContext';
import { OfflineProvider } from './src/context/OfflineContext';

import * as Sentry from '@sentry/react-native';

Sentry.init({
  dsn: "https://298520f4490c3807cda320d377975382@o4511717924995072.ingest.de.sentry.io/4511717933252688",
  tracesSampleRate: 1.0,
});

function App() {
  return (
    <SafeAreaProvider>
      <OfflineProvider>
        <ThemeProvider>
          <AuthProvider>
            <View style={styles.container}>
              <RootNavigator />
              <StatusBar style="auto" />
            </View>
          </AuthProvider>
        </ThemeProvider>
      </OfflineProvider>
    </SafeAreaProvider>
  );
}

export default Sentry.wrap(App);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});
