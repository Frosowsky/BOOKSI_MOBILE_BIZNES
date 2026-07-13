import React from 'react';
import { render, fireEvent, waitFor, screen } from '@testing-library/react-native';
import { EmployeeScheduleScreen } from './EmployeeScheduleScreen';
import api from '../../api/client';
import { NavigationContainer } from '@react-navigation/native';

jest.mock('../../api/client', () => ({
  get: jest.fn(),
  post: jest.fn()
}));

// Mock route
jest.mock('@react-navigation/native', () => {
  const actualNav = jest.requireActual('@react-navigation/native');
  return {
    ...actualNav,
    useNavigation: () => ({
      goBack: jest.fn(),
    }),
    useRoute: () => ({
      params: { employeeId: 'emp-1', employeeName: 'Anna' },
    }),
  };
});

const renderWithProviders = (component: any) => {
  return render(
    <NavigationContainer>
      {component}
    </NavigationContainer>
  );
};

describe('EmployeeScheduleScreen Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (api.get as jest.Mock).mockResolvedValue({
      data: [
        {
          date: '2025-10-15',
          start: '09:00:00',
          end: '17:00:00',
          isWorkingDay: true
        }
      ]
    });
  });

  it('renders and fetches month schedule', async () => {
    await renderWithProviders(<EmployeeScheduleScreen />);

    await waitFor(() => {
      expect(api.get).toHaveBeenCalled();
    });

    // employeeName from route params
    expect(screen.getByText('Anna - Grafik')).toBeTruthy();
    expect(screen.getByText('Zapisz Miesiąc')).toBeTruthy();
  });

  it('toggles working day and saves', async () => {
    (api.post as jest.Mock).mockResolvedValue({});
    await renderWithProviders(<EmployeeScheduleScreen />);

    await waitFor(() => {
      expect(api.get).toHaveBeenCalled();
    });

    // Find the toggle button for a specific day (we can find by text "Wolne")
    // Wait for the list to render
    await waitFor(() => {
      const offButtons = screen.getAllByText('Wolne');
      expect(offButtons.length).toBeGreaterThan(0);
      
      // Toggle a day to 'Pracuje'
      fireEvent.press(offButtons[0]);
    });

    // Save
    fireEvent.press(screen.getByText('Zapisz Miesiąc'));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalled();
      const payload = (api.post as jest.Mock).mock.calls[0][1];
      expect(payload.employeeId).toBe('emp-1');
      expect(payload.entries).toBeInstanceOf(Array);
    });
  });
});
