export type ApiMutation = { path: string; data: unknown };
const listeners = new Set<(event: ApiMutation) => void>();
const rejections = new Set<(path: string) => void>();
export function onApiMutation(listener: (event: ApiMutation) => void) {
  listeners.add(listener); return () => { listeners.delete(listener); };
}
export function publishApiMutation(event: ApiMutation) { listeners.forEach(listener => listener(event)); }
export function onApiRejection(listener: (path: string) => void) { rejections.add(listener); return () => { rejections.delete(listener); }; }
export function publishApiRejection(path: string) { rejections.forEach(listener => listener(path)); }
