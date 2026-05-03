import { Lead, User } from '@/types';

/**
 * Mirror of app/Services/WhatsAppService.php — kept in sync for client-side substitution
 * (so we can render template previews without a server roundtrip).
 */

export function normalizePhone(phone: string): string {
    const digits = phone.replace(/\D/g, '');
    if (digits.startsWith('60')) return digits;
    if (digits.startsWith('0')) return '60' + digits.slice(1);
    return digits;
}

export function buildVariables(lead: Lead, agent: User): Record<string, string> {
    const leadFirst = lead.name.trim().split(' ')[0] ?? lead.name;
    const agentFirst = agent.name.trim().split(' ')[0] ?? agent.name;
    const amount =
        lead.amount !== null && lead.amount !== undefined && lead.amount !== ''
            ? `RM ${Number(lead.amount).toFixed(2)}`
            : '';

    return {
        '{name}': lead.name,
        '{first_name}': leadFirst,
        '{phone}': lead.phone,
        '{email}': lead.email ?? '',
        '{amount}': amount,
        '{source}': lead.source ?? '',
        '{agent_name}': agent.name,
        '{agent_first}': agentFirst,
        '{agent_phone}': agent.phone ?? '',
    };
}

export function renderTemplate(body: string, lead: Lead, agent: User): string {
    const vars = buildVariables(lead, agent);
    return body.replace(/\{[a-z_]+\}/g, (match) => vars[match] ?? match);
}

export function waLink(phone: string, message: string): string {
    return `https://wa.me/${normalizePhone(phone)}?text=${encodeURIComponent(message)}`;
}
