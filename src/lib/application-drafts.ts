import * as SecureStore from 'expo-secure-store';
import { digestStringAsync, CryptoDigestAlgorithm } from 'expo-crypto';
import { createApplicationDraftStore } from './application-draft-store';
import type { ApplicationDraft } from './application-form';

const store = createApplicationDraftStore(SecureStore);
const keys = new Map<string, Promise<string>>();
function key(uid: string) {
  let pending = keys.get(uid);
  if (!pending) {
    pending = digestStringAsync(CryptoDigestAlgorithm.SHA256, uid).then(hash => `shopyethu.application.v1.${hash}`);
    keys.set(uid, pending);
    void pending.catch(() => keys.delete(uid));
  }
  return pending;
}
export const readApplicationDraft = async (uid: string) => store.read(await key(uid));
export const writeApplicationDraft = async (uid: string, draft: ApplicationDraft) => store.write(await key(uid), draft);
export const clearApplicationDraft = async (uid: string) => store.clear(await key(uid));
