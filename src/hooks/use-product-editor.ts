import { useEffect, useRef, useState } from 'react';
import { Alert } from 'react-native';
import { usePreventRemove } from 'expo-router';
import { randomUUID } from 'expo-crypto';
import * as ImagePicker from 'expo-image-picker';
import { api, ApiError } from '@/lib/api';
import { currentSession } from '@/lib/session';
import { publishSellerChange } from '@/lib/seller-events';
import { initialProduct, productPayload, validateProductStep, type ProductForm } from '@/lib/product-form';
import { restoreProductSave, type ProductSaveAttempt } from '@/lib/product-save';
import { clearProductSave, readProductSave, writeProductSave } from '@/lib/product-save-storage';
import type { Product } from '@/types/marketplace';

export function useProductEditor(uid: string, initial?: Product) {
  const sourceId = initial?.id;
  const [form, setForm] = useState(() => initialProduct(initial));
  const [current, setCurrent] = useState(initial);
  const [baseline, setBaseline] = useState(() => JSON.stringify(initialProduct(initial)));
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false), [ready, setReady] = useState(false);
  const [error, setError] = useState(''), [notice, setNotice] = useState('');
  const [loadError, setLoadError] = useState(''), [loadAttempt, setLoadAttempt] = useState(0);
  const [pending, setPending] = useState<ProductSaveAttempt | null>(null);
  const [blocked, setBlocked] = useState(false), [conflict, setConflict] = useState(false);
  const [allowLeave, setAllowLeave] = useState(false);
  const locked = useRef(false), mounted = useRef(false);
  const dirty = JSON.stringify(form) !== baseline;

  usePreventRemove(!allowLeave && (dirty || busy || !!pending), ({ repeat }) => {
    if (locked.current) { Alert.alert('Please wait', 'Your product is still being saved or a photo is uploading.'); return; }
    Alert.alert(pending ? 'Save not confirmed' : 'Leave without saving?', pending
      ? 'The save may have reached your store. Your save attempt is kept on this device so you can retry safely when you return.'
      : 'Changes you haven’t saved will be lost.', [
      { text: 'Keep editing', style: 'cancel' },
      { text: 'Leave', style: 'destructive', onPress: () => { setAllowLeave(true); repeat(); } },
    ]);
  });

  useEffect(() => {
    mounted.current = true;
    let cancelled = false;
    void readProductSave(uid, sourceId).then(saved => {
      if (cancelled) return;
      if (saved) {
        const restored = restoreProductSave(saved);
        if (sourceId && restored.attempt.productId !== sourceId) throw new Error('Save belongs to a different product.');
        setPending(restored.attempt); setForm(restored.form); setStep(3);
        setNotice('A previous save was interrupted. Retry it to confirm the result before making more changes.');
      }
      setReady(true);
    }).catch(() => { if (!cancelled) setLoadError('Your previous save could not be opened. Try again before creating another listing.'); });
    return () => { cancelled = true; mounted.current = false; };
  }, [uid, sourceId, loadAttempt]);

  function update<K extends keyof ProductForm>(field: K, value: ProductForm[K]) {
    if (locked.current || pending || blocked) return;
    setForm(previous => ({ ...previous, [field]: value })); setNotice(''); setError('');
  }
  function goTo(next: number) { if (!locked.current && !pending) { setError(''); setStep(next); } }
  function next(target = step + 1) {
    const issue = validateProductStep(form, step);
    if (issue) { setError(issue); return false; }
    goTo(target); return true;
  }
  async function save(published: boolean) {
    if (locked.current || !ready || blocked) return;
    if (current && !pending && !dirty && current.published === published) return;
    if (!pending) {
      for (const index of [0, 1, 2]) {
        const issue = validateProductStep(form, index, published);
        if (issue) { setStep(index); setError(issue); return; }
      }
    }
    locked.current = true; setBusy(true); setError(''); setNotice(''); setConflict(false);
    const attempt: ProductSaveAttempt = pending || { version: 1, key: randomUUID(), productId: current?.id || null, body: JSON.stringify(productPayload(form, published, current)) };
    let sent = false;
    try {
      if (!pending) await writeProductSave(uid, sourceId, attempt);
      if (currentSession()?.user.uid !== uid) throw new Error('Your account changed. Reopen your store to continue.');
      setPending(attempt); sent = true;
      const product = await api<Product>(`/seller/products${attempt.productId ? `/${encodeURIComponent(attempt.productId)}` : ''}`, {
        method: attempt.productId ? 'PUT' : 'POST', body: attempt.body, headers: { 'Idempotency-Key': attempt.key },
      });
      publishSellerChange({ uid, product });
      const updated = initialProduct(product);
      if (mounted.current) {
        setCurrent(product); setForm(updated); setBaseline(JSON.stringify(updated)); setPending(null); setStep(3);
        setNotice(product.published ? 'Your product is published.' : 'Draft saved. It is hidden from shoppers.');
      }
      try { await clearProductSave(uid, sourceId); }
      catch { if (mounted.current) setError('Saved to your store, but the local save record could not be cleared.'); }
    } catch (cause) {
      const failure = cause as Error;
      if (sent && cause instanceof ApiError && cause.status >= 400 && cause.status < 500) {
        // A rejected retry does not prove the earlier request failed (for example,
        // staff may have suspended the store after the original save committed).
        if (!pending || cause.status === 409) {
          try { await clearProductSave(uid, sourceId); if (mounted.current) setPending(null); } catch { /* Keep the record for a safe retry. */ }
        }
        if (mounted.current) { setBlocked(cause.status === 403); setConflict(cause.status === 409); }
      }
      if (mounted.current) setError(sent && (!(cause instanceof ApiError) || cause.status === 0 || cause.status >= 500)
        ? 'We couldn’t confirm the save. Retry with the same details; your listing won’t be created twice.'
        : failure.message || 'Unable to save this product. Please try again.');
    } finally { locked.current = false; if (mounted.current) setBusy(false); }
  }

  async function uploadPhotos() {
    if (locked.current || pending || blocked || form.photos.length >= 5) return;
    locked.current = true; setBusy(true); setError(''); setNotice('');
    try {
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsMultipleSelection: true, selectionLimit: 5 - form.photos.length, base64: true, quality: 0.7 });
      if (result.canceled) return;
      const selected = result.assets.slice(0, 5 - form.photos.length);
      for (const asset of selected) {
        if (currentSession()?.user.uid !== uid || !mounted.current) return;
        const image = asset.base64;
        if (!image || image.length > 2_800_000) throw new Error('Choose photos smaller than 2 MB. Photos already added have been kept.');
        const uploaded = await api<{ url: string }>('/seller/photos', { method: 'POST', body: JSON.stringify({ image }) });
        if (mounted.current) setForm(previous => ({ ...previous, photos: [...previous.photos, uploaded.url] }));
      }
    } catch (cause) {
      if (mounted.current) { setError((cause as Error).message); if (cause instanceof ApiError && cause.status === 403) setBlocked(true); }
    }
    finally { locked.current = false; if (mounted.current) setBusy(false); }
  }
  return {
    form, current, step, busy, ready, error, notice, pending, blocked, conflict, loadError,
    dirty, update, next, goTo, save, uploadPhotos,
    retryLoad: () => { setLoadError(''); setLoadAttempt(value => value + 1); },
  };
}
