declare module 'telegram-web-app' {
  export interface WebApp {
    initData: string;
    initDataUnsafe: {
      query_id: string;
      user: {
        id: number;
        first_name: string;
        last_name?: string;
        username?: string;
        language_code: string;
      };
      auth_date: number;
      hash: string;
    };
    colorScheme: 'light' | 'dark';
    viewportHeight: number;
    viewportStableHeight: number;
    headerColor: string;
    backgroundColor: string;
    isExpanded: boolean;
    ready: () => void;
    expand: () => void;
    close: () => void;
    BackButton: {
      isVisible: boolean;
      show: () => void;
      hide: () => void;
      onClick: (callback: () => void) => void;
      offClick: () => void;
    };
    MainButton: {
      text: string;
      color: string;
      textColor: string;
      isVisible: boolean;
      isActive: boolean;
      isProgressVisible: boolean;
      setText: (text: string) => void;
      show: () => void;
      hide: () => void;
      enable: () => void;
      disable: () => void;
      showProgress: (leaveActive?: boolean) => void;
      hideProgress: () => void;
      onClick: (callback: () => void) => void;
      offClick: () => void;
    };
    HapticFeedback: {
      impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void;
      notificationOccurred: (type: 'error' | 'success' | 'warning') => void;
      selectionChanged: () => void;
    };
    onEvent: (eventType: string, eventHandler: () => void) => void;
    offEvent: (eventType: string, eventHandler: () => void) => void;
    sendData: (data: string) => void;
    openLink: (url: string) => void;
    openTelegramLink: (url: string) => void;
    showPopup: (params: {
      title?: string;
      message: string;
      buttons?: Array<{
        type?: 'default' | 'ok' | 'close' | 'cancel' | 'destructive';
        text: string;
        id?: string;
      }>;
    }, callback?: (buttonId: string) => void) => void;
    showAlert: (message: string, callback?: () => void) => void;
    showConfirm: (message: string, callback?: (isConfirmed: boolean) => void) => void;
    enableClosingConfirmation: () => void;
    disableClosingConfirmation: () => void;
    setHeaderColor: (color: string) => void;
    setBackgroundColor: (color: string) => void;
  }
}