export interface User {
    id: number;
    name: string;
    email: string;
    email_verified_at?: string;
    phone?: string | null;
    industry?: string | null;
    plan: string;
    trial_ends_at?: string | null;
}

export interface IndustryOption {
    value: string;
    label: string;
}

export type PageProps<
    T extends Record<string, unknown> = Record<string, unknown>,
> = T & {
    auth: {
        user: User | null;
    };
    flash: {
        success?: string;
        error?: string;
    };
};
