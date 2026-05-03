<?php

namespace App\Services;

use App\Models\Lead;
use App\Models\User;

class WhatsAppService
{
    /**
     * Substitute variables in a template body using lead + agent context.
     *
     * Supported variables:
     *   {name}          → lead full name
     *   {first_name}    → lead first name (split on space)
     *   {phone}         → lead phone
     *   {email}         → lead email or empty
     *   {amount}        → formatted RM amount or empty
     *   {source}        → lead source or empty
     *   {agent_name}    → user (agent) full name
     *   {agent_first}   → user first name
     *   {agent_phone}   → user phone or empty
     */
    public function render(string $body, Lead $lead, User $agent): string
    {
        $vars = self::buildVariables($lead, $agent);

        return strtr($body, $vars);
    }

    /**
     * Build a wa.me link with pre-filled (URL-encoded) message.
     * Phone numbers are normalized to MY format (`60` prefix).
     */
    public function waLink(string $phone, string $message): string
    {
        $normalized = self::normalizePhone($phone);
        $encoded = rawurlencode($message);

        return "https://wa.me/{$normalized}?text={$encoded}";
    }

    public static function normalizePhone(string $phone): string
    {
        $digits = preg_replace('/\D/', '', $phone);

        if (str_starts_with($digits, '60')) {
            return $digits;
        }

        if (str_starts_with($digits, '0')) {
            return '60' . substr($digits, 1);
        }

        return $digits;
    }

    /**
     * @return array<string, string>
     */
    private static function buildVariables(Lead $lead, User $agent): array
    {
        $leadFirst = explode(' ', trim($lead->name))[0];
        $agentFirst = explode(' ', trim($agent->name))[0];
        $amount = $lead->amount !== null ? 'RM ' . number_format((float) $lead->amount, 2) : '';

        return [
            '{name}' => $lead->name,
            '{first_name}' => $leadFirst,
            '{phone}' => $lead->phone,
            '{email}' => $lead->email ?? '',
            '{amount}' => $amount,
            '{source}' => $lead->source ?? '',
            '{agent_name}' => $agent->name,
            '{agent_first}' => $agentFirst,
            '{agent_phone}' => $agent->phone ?? '',
        ];
    }

    /**
     * @return array<int, array{key: string, label: string, hint: string}>
     */
    public static function availableVariables(): array
    {
        return [
            ['key' => '{name}', 'label' => 'Lead full name', 'hint' => 'Ahmad Bin Ali'],
            ['key' => '{first_name}', 'label' => 'Lead first name', 'hint' => 'Ahmad'],
            ['key' => '{phone}', 'label' => 'Lead phone', 'hint' => '0123456789'],
            ['key' => '{email}', 'label' => 'Lead email', 'hint' => 'optional'],
            ['key' => '{amount}', 'label' => 'Amount (RM formatted)', 'hint' => 'RM 49.00'],
            ['key' => '{source}', 'label' => 'Lead source', 'hint' => 'WhatsApp'],
            ['key' => '{agent_name}', 'label' => 'Your full name', 'hint' => ''],
            ['key' => '{agent_first}', 'label' => 'Your first name', 'hint' => ''],
            ['key' => '{agent_phone}', 'label' => 'Your phone', 'hint' => ''],
        ];
    }
}
