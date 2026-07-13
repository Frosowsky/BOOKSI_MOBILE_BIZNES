import '@testing-library/jest-native/extend-expect';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Set act environment for React 18/19
global.IS_REACT_ACT_ENVIRONMENT = true;

// Mock React Navigation
jest.mock('@react-navigation/native', () => {
  const actualNav = jest.requireActual('@react-navigation/native');
  return {
    ...actualNav,
    useNavigation: () => ({
      navigate: jest.fn(),
      goBack: jest.fn(),
      replace: jest.fn(),
      dispatch: jest.fn(),
      addListener: jest.fn((event, callback) => {
        // immediately call focus callback for tests
        if (event === 'focus') callback();
        return jest.fn();
      }),
    }),
    useRoute: () => ({
      params: {},
    }),
  };
});

// Mock axios
jest.mock('axios', () => ({
  create: jest.fn(() => ({
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    interceptors: {
      request: { use: jest.fn(), eject: jest.fn() },
      response: { use: jest.fn(), eject: jest.fn() },
    },
  })),
}));

// Mock lucide-react-native
jest.mock('lucide-react-native', () => {
  const React = require('react');
  const View = require('react-native').View;
  const mockComponent = () => React.createElement(View, null);
  return {
    User: mockComponent,
    Lock: mockComponent,
    Mail: mockComponent,
    Phone: mockComponent,
    Building2: mockComponent,
    Home: mockComponent,
    Calendar: mockComponent,
    Users: mockComponent,
    Settings: mockComponent,
    LogOut: mockComponent,
    ChevronLeft: mockComponent,
    ChevronRight: mockComponent,
    Clock: mockComponent,
    Eye: mockComponent,
    EyeOff: mockComponent,
    CheckCircle2: mockComponent,
    Check: mockComponent,
    Plus: mockComponent,
    List: mockComponent,
    ArrowLeft: mockComponent,
    Save: mockComponent,
    X: mockComponent,
    LogIn: mockComponent,
    Fingerprint: mockComponent,
  };
});

// Mock Alert
jest.spyOn(require('react-native').Alert, 'alert').mockImplementation(() => {});

