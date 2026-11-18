import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { clearApplicationDraft, readApplicationDraft, writeApplicationDraft } from '@/lib/application-drafts';
import { initialApplication, isApplicationDraft, type ApplicationForm } from '@/lib/application-form';
import type { SellerApplication } from '@/types/marketplace';

// The wizard remounts when the account or server application version changes.
export function useApplicationDraft(uid: string, name: string, previous: SellerApplication | null) {
    const [form, setForm] = useState(() => initialApplication(previous, name));
    const [step, setStep] = useState(0);
    const [ready, setReady] = useState(false);
    const [savedAt, setSavedAt] = useState('');
    const [draftError, setDraftError] = useState('');
    const [saving, setSaving] = useState(false);
    const [loadError, setLoadError] = useState('');
    const [loadAttempt, setLoadAttempt] = useState(0);
    const active = useRef(true), mounted = useRef(false), dirty = useRef(false);
    const baseUpdatedAt = previous?.updatedAt || '';
    const initial = useMemo(() => initialApplication(previous, name), [previous, name]);
    const snapshot = useRef({ form, step });
  useLayoutEffect(() => { snapshot.current = { form, step }; }, [form, step]);

    const save = useCallback(async () => {
        if (!active.current || !dirty.current) return true;
        const current = snapshot.current;
        const now = new Date().toISOString();
        if (mounted.current) setSaving(true);
        try {
            const form = {
                ...current.form,
                area: current.form.areaPlaceId ? '' : current.form.area,
                areaSessionToken: '',
            };
            await writeApplicationDraft(uid, { version: 1, baseUpdatedAt, ...current, form, savedAt: now });
            if (snapshot.current === current) dirty.current = false;
            if (mounted.current && active.current) { if (snapshot.current === current) setSavedAt(now); setDraftError(''); }
            return true;
        } catch {
            if (mounted.current && active.current) setDraftError('Your draft could not be saved on this device. Try saving again before leaving.');
            return false;
        } finally { if (mounted.current) setSaving(false); }
    }, [uid, baseUpdatedAt]);

    useEffect(() => {
        mounted.current = true;
        active.current = true;
        let cancelled = false;
        void readApplicationDraft(uid).then(draft => {
            if (cancelled) return;
            if (draft !== null && !isApplicationDraft(draft)) throw new Error('Invalid draft');
            if (draft && draft.baseUpdatedAt === baseUpdatedAt) {
                setForm({ ...initial, ...draft.form }); setStep(draft.step); setSavedAt(draft.savedAt);
            }
            setReady(true);
        }).catch(() => {
            if (!cancelled) setLoadError('Your saved draft could not be opened. Try again, or start a new draft on this device.');
        });
        const listener = AppState.addEventListener('change', state => { if (state !== 'active') void save(); });
        return () => { cancelled = true; mounted.current = false; listener.remove(); void save(); };
    }, [uid, baseUpdatedAt, save, loadAttempt, initial]);

    useEffect(() => {
        if (!ready || !dirty.current || !active.current) return;
        const timeout = setTimeout(() => void save(), 900);
        return () => clearTimeout(timeout);
    }, [form, step, ready, save]);

    function update<K extends keyof ApplicationForm>(field: K, value: ApplicationForm[K]) {
        dirty.current = true;
        setSavedAt('');
        setForm(current => ({ ...current, [field]: value }));
    }
  const goTo = useCallback((next: number) => { dirty.current = true; setSavedAt(''); setStep(next); }, []);
    async function discard() {
        active.current = false;
        dirty.current = false;
        await clearApplicationDraft(uid);
    }
    async function startFresh() {
        setSaving(true);
        try {
            await clearApplicationDraft(uid);
            if (mounted.current) { setLoadError(''); setReady(true); }
        } catch {
            if (mounted.current) setLoadError('Storage is unavailable. Try opening your draft again.');
        } finally { if (mounted.current) setSaving(false); }
    }
    function retryLoad() { setLoadError(''); setLoadAttempt(value => value + 1); }
    return { form, step, ready, savedAt, saving, draftError, loadError, update, goTo, save, discard, startFresh, retryLoad };
}
