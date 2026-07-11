declare module 'react-native-call-detection' {
  export default class CallDetectorManager {
    constructor(
      callback: (event: string, phoneNumber?: string) => void,
      readPhoneNumberDisabled?: boolean,
      callbackPermission?: () => void,
      customOptions?: any
    );
    dispose(): void;
  }
}
