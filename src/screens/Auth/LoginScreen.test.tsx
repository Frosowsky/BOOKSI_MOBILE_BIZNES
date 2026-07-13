import React from 'react';
import { render, fireEvent, waitFor, screen } from '@testing-library/react-native';
import { LoginScreen } from './LoginScreen';
import api from '../../api/client';
import { AuthProvider } from '../../context/AuthContext';

jest.mock('../../api/client', () => ({
  post: jest.fn(),
  get: jest.fn()
}));

// Mock AuthContext
const mockSignIn = jest.fn();
jest.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    signIn: mockSignIn,
    enableBiometric: jest.fn(),
  }),
  AuthProvider: ({ children }: any) => children
}));

describe('LoginScreen Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders login form correctly', async () => {
    await render(
      <AuthProvider>
        <LoginScreen />
      </AuthProvider>
    );

    expect(screen.getByText('RIVIE')).toBeTruthy();
    expect(screen.getByPlaceholderText('Wprowadź email')).toBeTruthy();
    expect(screen.getByPlaceholderText('Wprowadź hasło')).toBeTruthy();
  });

  it('shows error if fields are empty', async () => {
    await render(
      <AuthProvider>
        <LoginScreen />
      </AuthProvider>
    );

    fireEvent.press(screen.getByText('Zaloguj się'));
    
    // Alert should be called
    expect(require('react-native').Alert.alert).toHaveBeenCalledWith('Błąd', 'Wprowadź email i hasło');
  });

  it('calls api login and signs in on success', async () => {
    (api.post as jest.Mock).mockResolvedValue({
      data: { token: 't1', refreshToken: 'r1', salonId: 's1' }
    });

    await render(
      <AuthProvider>
        <LoginScreen />
      </AuthProvider>
    );

    // Wait for initial useEffect to settle
    await waitFor(() => expect(screen.getByPlaceholderText('Wprowadź email')).toBeTruthy());

    fireEvent.changeText(screen.getByPlaceholderText('Wprowadź email'), 'test@test.com');
    await waitFor(() => expect(screen.getByPlaceholderText('Wprowadź email').props.value).toBe('test@test.com'));
    
    fireEvent.changeText(screen.getByPlaceholderText('Wprowadź hasło'), 'password123');
    await waitFor(() => expect(screen.getByPlaceholderText('Wprowadź hasło').props.value).toBe('password123'));

    fireEvent.press(screen.getByText('Zaloguj się'));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/auth/login', {
        email: 'test@test.com',
        password: 'password123',
        isMobile: true
      });
      // Assuming biometric record is false, it prompts an alert, but in tests, 
      // isBiometricSupported is false initially.
      expect(mockSignIn).toHaveBeenCalledWith('t1', 'r1', 's1', 's1');
    });
  });
});
