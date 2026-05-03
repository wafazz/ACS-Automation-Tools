import { LeadStatusValue, StatusOption } from '@/types';

interface Props {
    status: LeadStatusValue;
    statuses: StatusOption[];
    size?: 'sm' | 'md';
}

export default function StatusBadge({ status, statuses, size = 'md' }: Props) {
    const opt = statuses.find((s) => s.value === status);
    if (!opt) return null;

    const sizeClass = size === 'sm' ? 'px-2 py-1 small' : 'px-3 py-2';
    return (
        <span className={`badge ${opt.badge} ${sizeClass}`}>{opt.label}</span>
    );
}
