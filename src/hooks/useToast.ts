import { useCallback } from 'react';
import Toast from 'react-native-toast-message';

export function useToast() {
  const showSuccess = useCallback((message: string) => {
    Toast.show({ type: 'success', text1: message, position: 'bottom' });
  }, []);

  const showError = useCallback((message: string) => {
    Toast.show({ type: 'error', text1: message, position: 'bottom' });
  }, []);

  const showInfo = useCallback((message: string) => {
    Toast.show({ type: 'info', text1: message, position: 'bottom' });
  }, []);

  return { showSuccess, showError, showInfo };
}
