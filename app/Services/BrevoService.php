<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use RuntimeException;

class BrevoService
{
    private string $apiKey;
    private string $senderEmail;
    private string $senderName;

    public function __construct(SettingService $settings)
    {
        $db = $settings->get('brevo');

        $this->apiKey = trim((string) ($db['api_key'] ?? ''));
        $this->senderEmail = trim((string) ($db['sender_email'] ?? ''));
        $this->senderName = trim((string) ($db['sender_name'] ?? 'ACS'));
    }

    public function isConfigured(): bool
    {
        return $this->apiKey !== '' && $this->senderEmail !== '';
    }

    /**
     * Send a transactional email via the Brevo HTTP API.
     * Returns true on success.
     *
     * @param  array{email: string, name?: string}  $to
     */
    public function sendEmail(array $to, string $subject, string $htmlContent): bool
    {
        if (! $this->isConfigured()) {
            throw new RuntimeException('Brevo is not configured.');
        }

        $response = Http::withHeaders([
            'api-key' => $this->apiKey,
            'accept' => 'application/json',
            'content-type' => 'application/json',
        ])->post('https://api.brevo.com/v3/smtp/email', [
            'sender' => [
                'email' => $this->senderEmail,
                'name' => $this->senderName,
            ],
            'to' => [array_filter([
                'email' => $to['email'],
                'name' => $to['name'] ?? null,
            ])],
            'subject' => $subject,
            'htmlContent' => $htmlContent,
        ]);

        if (! $response->successful()) {
            Log::warning('Brevo sendEmail failed', [
                'status' => $response->status(),
                'body' => $response->body(),
            ]);
            throw new RuntimeException("Brevo returned {$response->status()}: " . $response->body());
        }

        return true;
    }
}
