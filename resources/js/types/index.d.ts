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

export type LeadStatusValue = 'new' | 'follow_up' | 'interested' | 'closed';

export interface StatusOption {
    value: LeadStatusValue;
    label: string;
    badge: string;
}

export interface Lead {
    id: number;
    user_id?: number;
    name: string;
    phone: string;
    email?: string | null;
    source?: string | null;
    status: LeadStatusValue;
    amount?: string | number | null;
    notes?: string | null;
    last_contacted_at?: string | null;
    created_at: string;
    updated_at?: string;
    status_history?: LeadStatusHistoryEntry[];
}

export interface LeadStatusHistoryEntry {
    id: number;
    lead_id: number;
    changed_by?: number | null;
    from_status?: LeadStatusValue | null;
    to_status: LeadStatusValue;
    note?: string | null;
    created_at: string;
    changer?: { id: number; name: string } | null;
}

export type PageProps<T = Record<string, unknown>> = T & {
    auth: {
        user: User | null;
    };
    flash: {
        success?: string;
        error?: string;
    };
    [key: string]: unknown;
};
