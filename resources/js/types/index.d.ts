export interface User {
    id: number;
    name: string;
    email: string;
    email_verified_at?: string;
    phone?: string | null;
    industry?: string | null;
    plan: string;
    trial_ends_at?: string | null;
    monthly_target?: number;
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

export interface Template {
    id: number;
    user_id?: number;
    title: string;
    body: string;
    industry?: string | null;
    is_default: boolean;
    use_count?: number;
    created_at?: string;
    updated_at?: string;
}

export interface PackCard {
    id: number;
    slug: string;
    name: string;
    industry: string | null;
    industry_label?: string | null;
    price_myr: number;
    description: string | null;
    icon: string | null;
    item_count?: number;
    owned: boolean;
}

export interface PackDetail {
    id: number;
    slug: string;
    name: string;
    industry: string | null;
    industry_label: string | null;
    price_myr: number;
    description: string | null;
    icon: string | null;
    items: Array<{ id: number; title: string; body: string }>;
}

export interface TemplateVariable {
    key: string;
    label: string;
    hint: string;
}

export type ReminderTypeValue = 'manual' | 'auto_day_1' | 'auto_day_3' | 'auto_day_7';
export type ReminderTab = 'today' | 'upcoming' | 'overdue' | 'completed';

export interface Reminder {
    id: number;
    user_id: number;
    lead_id: number | null;
    type: ReminderTypeValue;
    due_at: string;
    completed_at: string | null;
    dismissed_at: string | null;
    snooze_count: number;
    note: string | null;
    created_at: string;
    lead?: {
        id: number;
        name: string;
        phone: string;
        status: LeadStatusValue;
    } | null;
}

export interface BillingInfo {
    plan_value: string | null;
    plan_label: string | null;
    badge: string | null;
    is_trial: boolean;
    is_lifetime: boolean;
    trial_days_left: number | null;
    sub_ends_at: string | null;
}

export type PageProps<T = Record<string, unknown>> = T & {
    auth: {
        user: User | null;
        billing: BillingInfo | null;
    };
    flash: {
        success?: string;
        error?: string;
    };
    [key: string]: unknown;
};
