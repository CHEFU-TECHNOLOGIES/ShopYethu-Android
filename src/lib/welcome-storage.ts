import * as SecureStore from 'expo-secure-store';

const KEY = 'shopyethu.welcome.v1';

export const readWelcome = () => SecureStore.getItemAsync(KEY);
export const saveWelcome = () => SecureStore.setItemAsync(KEY, 'complete');
