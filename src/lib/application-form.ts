import type { SellerApplication } from '@/types/marketplace';
import { categories } from './config';
import { normalizeApplicationPhone } from './contact-phone';

export const applicationCategories = categories.filter(category => category !== 'All');
export const applicationSteps = ['Business', 'Products', 'Contact & pickup', 'Review'];
export type ApplicationForm = {
    businessType: '' | 'individual' | 'registered-business';
    cipcCertificateId: string; cipcCertificateFormat: '' | 'pdf' | 'jpg' | 'png' | 'webp'; cipcCertificateName: string;
    businessName: string; area: string; areaPlaceId: string; areaSessionToken: string;
    categories: string[]; plans: string;
    contactName: string; phone: string;
    collectionOffered: boolean | null; collectionArea: string; pickupHours: string; response: string;
};
export type ApplicationDraft = { version: 1; baseUpdatedAt: string; form: ApplicationForm; step: number; savedAt: string };
export type ApplicationFieldKey =
  | 'businessType' | 'cipcCertificateId' | 'businessName' | 'area'
  | 'categories' | 'plans' | 'contactName' | 'phone'
  | 'collectionOffered' | 'collectionArea' | 'pickupHours' | 'response';
export type ApplicationIssue = { field: ApplicationFieldKey; message: string };

export function initialApplication(previous: SellerApplication | null, name: string): ApplicationForm {
    return {
        businessType: previous?.businessType || '', businessName: previous?.businessName || '',
        cipcCertificateId: previous?.cipcCertificateId || '',
        cipcCertificateFormat: previous?.cipcCertificateFormat || '',
        cipcCertificateName: previous?.cipcCertificateId ? 'CIPC certificate already attached' : '',
        area: previous?.area || '', areaPlaceId: previous?.areaPlaceId || '',
        areaSessionToken: '', categories: previous?.categories || [], plans: previous?.plans || '',
        contactName: previous?.contactName || name, phone: previous?.phone || '',
        collectionOffered: previous?.collectionOffered ?? null, collectionArea: previous?.collectionArea || '',
        pickupHours: previous?.pickupHours || '', response: '',
    };
}

export function applicationIssue(form: ApplicationForm, step: number, responding: boolean): ApplicationIssue | null {
    const length = (value: string, min: number, max: number) => value.trim().length >= min && value.trim().length <= max;
    if (step === 0) {
        if (!['individual', 'registered-business'].includes(form.businessType)) return { field: 'businessType', message: 'Choose your business type.' };
        if (form.businessType === 'registered-business' && (!form.cipcCertificateId || !['pdf', 'jpg', 'png', 'webp'].includes(form.cipcCertificateFormat))) return { field: 'cipcCertificateId', message: 'Upload your registration certificate.' };
        if (!length(form.businessName, 2, 100)) return { field: 'businessName', message: 'Enter a business or trading name (2–100 characters).' };
        if (!form.areaPlaceId) return { field: 'area', message: 'Select a South African town or suburb from Google Maps suggestions.' };
    }
    if (step === 1) {
        if (!form.categories.length || form.categories.some(item => !applicationCategories.includes(item)) || new Set(form.categories).size !== form.categories.length) return { field: 'categories', message: 'Choose at least one product category.' };
        if (!length(form.plans, 10, 2000)) return { field: 'plans', message: 'Describe what you plan to sell (10–2,000 characters).' };
    }
    if (step === 2) {
        if (!length(form.contactName, 2, 100)) return { field: 'contactName', message: 'Enter a contact name (2–100 characters).' };
        if (!normalizeApplicationPhone(form.phone)) return { field: 'phone', message: 'Enter a valid South African number, e.g. 082 123 4567 or +27 82 123 4567.' };
        if (form.collectionOffered === null) return { field: 'collectionOffered', message: 'Choose whether you offer collection.' };
        if (form.collectionOffered && !length(form.collectionArea, 2, 120)) return { field: 'collectionArea', message: 'Enter a pickup area (2–120 characters).' };
        if (form.collectionOffered && !length(form.pickupHours, 3, 300)) return { field: 'pickupHours', message: 'Enter your pickup hours (3–300 characters).' };
    }
    if (step === 3 && responding && !length(form.response, 5, 2000)) return { field: 'response', message: 'Respond to the requested information (5–2,000 characters).' };
    return null;
}

export function validateApplicationStep(form: ApplicationForm, step: number, responding: boolean) {
    return applicationIssue(form, step, responding)?.message || '';
}

// Reject corrupted device data before putting it back into editable inputs.
export function isApplicationDraft(value: unknown): value is ApplicationDraft {
    if (!value || typeof value !== 'object') return false;
    const draft = value as ApplicationDraft;
    if (draft.version !== 1 || typeof draft.baseUpdatedAt !== 'string' || !Number.isInteger(draft.step) || draft.step < 0 || draft.step > 3 || !draft.form) return false;
    const form = draft.form;
    const limits = { businessName: 100, area: 120, plans: 2000, contactName: 100, phone: 30, collectionArea: 120, pickupHours: 300, response: 2000 };
    return Object.entries(limits).every(([key, max]) => {
        const field = form[key as keyof ApplicationForm];
        return typeof field === 'string' && field.length <= max;
    }) &&
      (form.cipcCertificateId === undefined || typeof form.cipcCertificateId === 'string' && form.cipcCertificateId.length <= 200) &&
      (form.cipcCertificateName === undefined || typeof form.cipcCertificateName === 'string' && form.cipcCertificateName.length <= 160) &&
      (form.cipcCertificateFormat === undefined || ['', 'pdf', 'jpg', 'png', 'webp'].includes(form.cipcCertificateFormat)) &&
      (form.areaPlaceId === undefined || typeof form.areaPlaceId === 'string' && form.areaPlaceId.length <= 256) &&
        ['', 'individual', 'registered-business'].includes(form.businessType) &&
        Array.isArray(form.categories) && form.categories.length <= applicationCategories.length && new Set(form.categories).size === form.categories.length && form.categories.every(item => typeof item === 'string' && applicationCategories.includes(item)) &&
        [true, false, null].includes(form.collectionOffered) &&
        typeof draft.savedAt === 'string' && Number.isFinite(Date.parse(draft.savedAt));
}
