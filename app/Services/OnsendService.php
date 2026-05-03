<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use RuntimeException;

class OnsendService
{
    private string $instanceId;
    private string $accessToken;

    public function __construct(SettingService $settings)
    {
        $db = $settings->get('onsend');

        $this->instanceId = trim((string) ($db['instance_id'] ?? ''));
        $this->accessToken = trim((string) ($db['access_token'] ?? ''));
    }

    public function isConfigured(): bool
    {
        return $this->instanceId !== '' && $this->accessToken !== '';
    }

    /**
     * Normalize a Malaysian phone number to digits-only with country prefix.
     * Mirrors WhatsAppService::normalizePhone() for consistency.
     */
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
     * Send a WhatsApp text message via the Onsend API.
     * Returns true on success.
     */
    public function sendMessage(string $phone, string $message): bool
    {
        if (! $this->isConfigured()) {
            throw new RuntimeException('Onsend is not configured.');
        }

        $normalized = self::normalizePhone($phone);
        if ($normalized === '') {
            throw new RuntimeException('Invalid phone number.');
        }

        $response = Http::asForm()->post('https://app.onsend.io/api/send-message', [
            'instance_id' => $this->instanceId,
            'access_token' => $this->accessToken,
            'phone' => $normalized,
            'message' => $message,
            'type' => 'text',
        ]);

        if (! $response->successful()) {
            Log::warning('Onsend sendMessage failed', [
                'status' => $response->status(),
                'body' => $response->body(),
            ]);
            throw new RuntimeException("Onsend returned {$response->status()}: " . $response->body());
        }

        return true;
    }
}
