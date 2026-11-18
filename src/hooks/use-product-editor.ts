import { useEffect, useRef, useState } from 'react';
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
import { toast } from '@/lib/toast';

export function useProductEditor(uid: string, initial?: Product) {
    const sourceId = initial?.id;
    const [form, setForm] = useState(() => initialProduct(initial));
    const [current, setCurrent] = useState(initial);
    const [baseline, setBaseline] = useState(() => JSON.stringify(initialProduct(initial)));
    const [step, setStep] = useState(0);
    const [busy, setBusy] = useState(false), [ready, setReady] = useState(false);
    const [error, setError] = useState('');
    const [loadError, setLoadError] = useState(''), [loadAttempt, setLoadAttempt] = useState(0);
    const [pending, setPending] = useState<ProductSaveAttempt | null>(null);
    const [blocked, setBlocked] = useState(false), [conflict, setConflict] = useState(false);
    const [allowLeave, setAllowLeave] = useState(false);
    const [leaveConfirmationOpen, setLeaveConfirmationOpen] = useState(false);
    const pendingNavigation = useRef<(() => void) | null>(null);
    const locked = useRef(false), mounted = useRef(false);
    const [stagedPhotos, setStagedPhotos] = useState(() => new Map<string, string>());
    const dirty = JSON.stringify(form) !== baseline;
    const canContinue = step === 0
        ? !!form.name.trim() && !!form.category.trim() && !!form.description.trim()
        : !validateProductStep(form, step, new Set(stagedPhotos.keys()));

    usePreventRemove(!allowLeave && (dirty || busy || !!pending), ({ repeat }) => {
        if (locked.current) {
            toast.info("Please wait while your product is being saved.");
            return;
        }
        pendingNavigation.current = repeat;
        setLeaveConfirmationOpen(true);
    });

    function cancelLeave() {
        pendingNavigation.current = null;
        setLeaveConfirmationOpen(false);
    }

    function confirmLeave() {
        const repeat = pendingNavigation.current;
        pendingNavigation.current = null;
        setAllowLeave(true);
        setLeaveConfirmationOpen(false);
        repeat?.();
    }

    useEffect(() => {
        mounted.current = true;
        let cancelled = false;
        void readProductSave(uid, sourceId).then(saved => {
            if (cancelled) return;
            if (saved) {
                const restored = restoreProductSave(saved);
                if (sourceId && restored.attempt.productId !== sourceId) throw new Error('Save belongs to a different product.');
                setPending(restored.attempt); setForm(restored.form); setStep(3);
                toast.warning('A previous save was interrupted. Retry it to confirm the result before making more changes.');
            }
            setReady(true);
        }).catch(() => { if (!cancelled) setLoadError('Your previous save could not be opened. Try again before creating another listing.'); });
        return () => { cancelled = true; mounted.current = false; };
    }, [uid, sourceId, loadAttempt]);

    function update<K extends keyof ProductForm>(field: K, value: ProductForm[K]) {
        if (locked.current || pending || blocked) return;
        if (
            (current?.identityLocked === true || (current?.reviewCount ?? 0) > 0) &&
            (field === 'name' || field === 'description' || field === 'category' || field === 'photos')
        ) return;
        if (field === 'photos' && Array.isArray(value)) {
            const retained = new Set(value.filter((photo): photo is string => typeof photo === 'string'));
            setStagedPhotos(previous => new Map(
                [...previous].filter(([uri]) => retained.has(uri)),
            ));
        }
        setForm(previous => ({ ...previous, [field]: value })); setError('');
    }
    function goTo(next: number) { if (!locked.current && !pending) { setError(''); setStep(next); } }
    function next(target = step + 1) {
        const issue = validateProductStep(form, step, new Set(stagedPhotos.keys()));
        if (issue) { setError(issue); return false; }
        goTo(target); return true;
    }
    async function uploadStagedPhotos(photos: string[]) {
        const resolvedPhotos = [...photos];
        for (let index = 0; index < resolvedPhotos.length; index += 1) {
            const uri = resolvedPhotos[index];
            const image = stagedPhotos.get(uri);
            if (!image) continue;
            if (currentSession()?.user.uid !== uid || !mounted.current) {
                throw new Error('Your account changed. Reopen your store to continue.');
            }
            const uploaded = await api<{ url: string }>('/seller/photos', {
                method: 'POST',
                body: JSON.stringify({ image }),
            });
            for (let photoIndex = 0; photoIndex < resolvedPhotos.length; photoIndex += 1) {
                if (resolvedPhotos[photoIndex] === uri) resolvedPhotos[photoIndex] = uploaded.url;
            }
            setStagedPhotos(previous => {
                const next = new Map(previous);
                next.delete(uri);
                return next;
            });
            if (mounted.current) {
                setForm(previous => ({
                    ...previous,
                    photos: previous.photos.map(photo => photo === uri ? uploaded.url : photo),
                }));
            }
        }
        return resolvedPhotos;
    }
    async function save(published: boolean): Promise<boolean> {
        if (locked.current || !ready || blocked) return false;
        if (current && !pending && !dirty && current.published === published) return false;
        if (!pending) {
            const localPhotos = new Set(stagedPhotos.keys());
            for (const index of [0, 1, 2]) {
                const issue = validateProductStep(form, index, localPhotos);
                if (issue) { setStep(index); setError(issue); return false; }
            }
        }
        locked.current = true; setBusy(true); setError(''); setConflict(false);
        let attempt = pending;
        let sent = false;
        try {
            if (!attempt) {
                const photos = await uploadStagedPhotos(form.photos);
                attempt = {
                    version: 1,
                    key: randomUUID(),
                    productId: current?.id || null,
                    body: JSON.stringify(productPayload({ ...form, photos }, published, current)),
                };
                await writeProductSave(uid, sourceId, attempt);
            }
            if (currentSession()?.user.uid !== uid) throw new Error('Your account changed. Reopen your store to continue.');
            setPending(attempt); sent = true;
            const product = await api<Product>(`/seller/products${attempt.productId ? `/${encodeURIComponent(attempt.productId)}` : ''}`, {
                method: attempt.productId ? 'PUT' : 'POST', body: attempt.body, headers: { 'Idempotency-Key': attempt.key },
            });
            publishSellerChange({ uid, product });
            const updated = initialProduct(product);
            if (mounted.current) {
                setCurrent(product); setForm(updated); setBaseline(JSON.stringify(updated)); setPending(null); setStep(3);
            }
            try { await clearProductSave(uid, sourceId); }
            catch { if (mounted.current) toast.warning('Saved to your store, but the local save record could not be cleared.'); }
            return true;
        } catch (cause) {
            const failure = cause as Error;
            toast.error(failure.message || 'Unable to save your product. Please retry.');
            if (sent && cause instanceof ApiError && cause.status >= 400 && cause.status < 500) {
                // A rejected retry does not prove the earlier request failed (for example,
                // staff may have suspended the store after the original save committed).
                if (!pending || cause.status === 409) {
                    try { await clearProductSave(uid, sourceId); if (mounted.current) setPending(null); } catch { /* Keep the record for a safe retry. */ }
                }
                if (mounted.current) { setBlocked(cause.status === 403); setConflict(cause.status === 409); }
            }
            if (!sent && cause instanceof ApiError && cause.status === 403 && mounted.current) {
                setBlocked(true);
            }
            if (mounted.current) setError(sent && (!(cause instanceof ApiError) || cause.status === 0 || cause.status >= 500)
                ? 'We couldn’t confirm the save. Retry with the same details; your listing won’t be created twice.'
                : failure.message || 'Unable to save this product. Please try again.');
            return false;
        } finally { locked.current = false; if (mounted.current) setBusy(false); }
    }

    async function uploadPhotos() {
        if (locked.current || pending || blocked ||
            current?.identityLocked === true || (current?.reviewCount ?? 0) > 0 ||
            form.photos.length >= 5) return;
        locked.current = true; setBusy(true); setError('');
        try {
            const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsMultipleSelection: true, selectionLimit: 5 - form.photos.length, base64: true, quality: 0.7 });
            if (result.canceled) return;
            const selected = result.assets.slice(0, 5 - form.photos.length);
            if (currentSession()?.user.uid !== uid || !mounted.current) return;
            const staged = selected.map(asset => {
                const image = asset.base64;
                if (!image || image.length > 2_800_000) throw new Error('Choose photos smaller than 2 MB. Photos already added have been kept.');
                return { uri: asset.uri, image };
            });
            const photos = [...form.photos, ...staged.map(photo => photo.uri)];
            const retained = new Set(photos);
            setStagedPhotos(previous => {
                const next = new Map([...previous].filter(([uri]) => retained.has(uri)));
                for (const photo of staged) next.set(photo.uri, photo.image);
                return next;
            });
            if (mounted.current) setForm(previous => ({ ...previous, photos }));
        } catch (cause) {
            toast.error((cause as Error).message || 'Unable to prepare these photos.');
            if (mounted.current) { setError((cause as Error).message); if (cause instanceof ApiError && cause.status === 403) setBlocked(true); }
        }
        finally { locked.current = false; if (mounted.current) setBusy(false); }
    }
    return {
        form, current, step, busy, ready, error, pending, blocked, conflict, loadError, canContinue,
        dirty, update, next, goTo, save, uploadPhotos,
        leaveConfirmationOpen, cancelLeave, confirmLeave,
        retryLoad: () => { setLoadError(''); setLoadAttempt(value => value + 1); },
    };
}
