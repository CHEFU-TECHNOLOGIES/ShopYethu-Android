import type { ApplicationForm, ApplicationIssue } from "@/lib/application-form";

export type ApplicationFieldsProps = {
    form: ApplicationForm;
    disabled: boolean;
    email: string;
    fieldIssue?: ApplicationIssue | null;
    uploadProof?: () => Promise<void>;
    uploadingProof?: boolean;
    update: <K extends keyof ApplicationForm>(
        field: K,
        value: ApplicationForm[K],
    ) => void;
};
