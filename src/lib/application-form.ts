import type { SellerApplication } from '@/types/marketplace';
import { categories } from './config';
import { normalizeApplicationPhone } from './contact-phone';

export const applicationCategories = categories.filter(category => category !== 'All');
export const applicationSteps = ['Business', 'Products', 'Contact & pickup', 'Review'];
export type ApplicationForm = {
    businessType: '' | 'individual' | 'registered-business';
    cipcCertificateId: string; cipcCertificateFormat: '' | 'pdf' | 'jpg' | 'png' | 'webp'; cipcCertificateName: string;
    businessName: string; area: string; categories: string[]; plans: string;
    contactName: string; phone: string; phoneConfirmed: boolean;
    collectionOffered: boolean | null; collectionArea: string; pickupHours: string; response: string;
};
export type ApplicationDraft = { version: 1; baseUpdatedAt: string; form: ApplicationForm; step: number; savedAt: string };

export function initialApplication(previous: SellerApplication | null, name: string): ApplicationForm {
    return {
        businessType: previous?.businessType || '', businessName: previous?.businessName || '',
        cipcCertificateId: previous?.cipcCertificateId || '',
        cipcCertificateFormat: previous?.cipcCertificateFormat || '',
        cipcCertificateName: previous?.cipcCertificateId ? 'CIPC certificate already attached' : '',
        area: previous?.area || '', categories: previous?.categories || [], plans: previous?.plans || '',
        contactName: previous?.contactName || name, phone: previous?.phone || '', phoneConfirmed: false,
        collectionOffered: previous?.collectionOffered ?? null, collectionArea: previous?.collectionArea || '',
        pickupHours: previous?.pickupHours || '', response: '',
    };
}

export function validateApplicationStep(form: ApplicationForm, step: number, responding: boolean) {
    const length = (value: string, min: number, max: number) => value.trim().length >= min && value.trim().length <= max;
    if (step === 0) {
        if (!['individual', 'registered-business'].includes(form.businessType)) return 'Choose your business type.';
        if (form.businessType === 'registered-business' && (!form.cipcCertificateId || !['pdf', 'jpg', 'png', 'webp'].includes(form.cipcCertificateFormat))) return 'Upload your CIPC registration certificate.';
        if (!length(form.businessName, 2, 100)) return 'Enter a business or trading name (2–100 characters).';
        if (!length(form.area, 2, 120)) return 'Enter your operating area (2–120 characters).';
    }
    if (step === 1) {
        if (!form.categories.length || form.categories.some(item => !applicationCategories.includes(item)) || new Set(form.categories).size !== form.categories.length) return 'Choose at least one product category.';
        if (!length(form.plans, 10, 2000)) return 'Describe what you plan to sell (10–2,000 characters).';
    }
    if (step === 2) {
        if (!length(form.contactName, 2, 100)) return 'Enter a contact name (2–100 characters).';
        if (!normalizeApplicationPhone(form.phone)) return 'Enter a valid South African number, e.g. 082 123 4567 or +27 82 123 4567.';
        if (!form.phoneConfirmed) return 'Confirm that this is your business contact number.';
        if (form.collectionOffered === null) return 'Choose whether you offer collection.';
        if (form.collectionOffered && !length(form.collectionArea, 2, 120)) return 'Enter a pickup area (2–120 characters).';
        if (form.collectionOffered && !length(form.pickupHours, 3, 300)) return 'Enter your pickup hours (3–300 characters).';
    }
    if (step === 3 && responding && !length(form.response, 5, 2000)) return 'Respond to the requested information (5–2,000 characters).';
    return '';
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
        ['', 'individual', 'registered-business'].includes(form.businessType) &&
        Array.isArray(form.categories) && form.categories.length <= applicationCategories.length && new Set(form.categories).size === form.categories.length && form.categories.every(item => typeof item === 'string' && applicationCategories.includes(item)) &&
        typeof form.phoneConfirmed === 'boolean' && [true, false, null].includes(form.collectionOffered) &&
        typeof draft.savedAt === 'string' && Number.isFinite(Date.parse(draft.savedAt));
}
