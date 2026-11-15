export type ToastKind = 'success' | 'error' | 'warning' | 'info';
export type ToastMessage = { id: number; message: string; kind: ToastKind; action?: { label: string; run: () => void } };
export function createToastStore() {
  let messages: ToastMessage[] = [], id = 0;
  const listeners = new Set<() => void>();
  const emit = () => listeners.forEach(listener => listener());
  return {
    get: () => messages,
    subscribe(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; },
    show(message: string, kind: ToastKind = 'info', action?: ToastMessage['action']) {
      if (messages.some(item => item.message === message && item.kind === kind)) return;
      messages = [...messages.slice(-2), { id: ++id, message, kind, action }]; emit();
    },
    dismiss(target: number) { messages = messages.filter(item => item.id !== target); emit(); },
    clear() { messages = []; emit(); },
  };
}
export const toastStore = createToastStore();
export const toast = {
  success: (message: string) => toastStore.show(message, 'success'),
  error: (message: string) => toastStore.show(message, 'error'),
  warning: (message: string) => toastStore.show(message, 'warning'),
  info: (message: string) => toastStore.show(message, 'info'),
};
