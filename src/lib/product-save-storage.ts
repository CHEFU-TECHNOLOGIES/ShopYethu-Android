import * as SecureStore from 'expo-secure-store';
import { CryptoDigestAlgorithm, digestStringAsync } from 'expo-crypto';
import { createApplicationDraftStore } from './application-draft-store';
import type { ProductSaveAttempt } from './product-save';

// Reuse the tested encrypted, chunked storage used by application drafts.
const store = createApplicationDraftStore(SecureStore);
const keys = new Map<string, Promise<string>>();
function key(uid: string, productId?: string) {
  const identity = JSON.stringify([uid, productId || 'new']);
  let pending = keys.get(identity);
  if (!pending) {
    pending = digestStringAsync(CryptoDigestAlgorithm.SHA256, identity).then(hash => `shopyethu.product-save.v1.${hash}`);
    keys.set(identity, pending);
    void pending.catch(() => keys.delete(identity));
  }
  return pending;
}
export const readProductSave = async (uid: string, id?: string) => store.read(await key(uid, id));
export const writeProductSave = async (uid: string, id: string | undefined, attempt: ProductSaveAttempt) => store.write(await key(uid, id), attempt);
export const clearProductSave = async (uid: string, id?: string) => store.clear(await key(uid, id));
