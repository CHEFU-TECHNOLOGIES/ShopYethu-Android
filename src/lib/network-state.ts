// Reachability reflects actual API results, not merely a Wi-Fi connection.
let online: boolean | null = null;
const listeners = new Set<() => void>();
export const networkState = {
  get: () => online,
  subscribe(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; },
  record(value: boolean) {
    if (online === value) return;
    online = value; listeners.forEach(listener => listener());
  },
};
