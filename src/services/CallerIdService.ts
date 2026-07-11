import CallDetectorManager from 'react-native-call-detection';
import { Alert, Platform } from 'react-native';
import api from '../api/client';

export class CallerIdService {
  private static detector: any = null;

  static async startListening(onClientDetected: (client: any) => void) {
    if (Platform.OS !== 'android') {
      return; // Caller ID is Android-only in this implementation
    }

    if (this.detector) {
      return; // Already listening
    }

    try {
      this.detector = new CallDetectorManager(
        async (event: string, phoneNumber?: string) => {
          console.log(`Call state: ${event}, number: ${phoneNumber}`);
          if (event === 'Incoming' && phoneNumber) {
            try {
              // Format phone number to match DB (e.g. remove spaces, handle +48)
              const cleanNumber = phoneNumber.replace(/[^0-9+]/g, '');
              
              // Query the backend to find if it's our client
              const res = await api.get(`/companyclients/by-phone?phone=${encodeURIComponent(cleanNumber)}`);
              if (res.data && res.data.id) {
                console.log('Client detected!', res.data);
                onClientDetected(res.data);
              }
            } catch (error) {
              // API returns 404 if client not found, safe to ignore
              console.log('Caller ID: Unknown number or error', error);
            }
          }
        },
        false, // readPhoneNumberDisabled
        () => {
          Alert.alert('Brak uprawnień', 'Aplikacja potrzebuje uprawnień do rejestru połączeń dla Caller ID.');
        },
        {
          title: 'Uprawnienia Caller ID',
          message: 'Potrzebujemy dostępu do rejestru połączeń, by identyfikować dzwoniących klientów salonu.'
        }
      );
    } catch (err) {
      console.error('Error starting CallerIdService (possibly unsupported in Expo Go):', err);
    }
  }

  static stopListening() {
    if (this.detector) {
      try {
        this.detector.dispose();
      } catch (err) {
        console.error('Error disposing detector:', err);
      }
      this.detector = null;
    }
  }
}
