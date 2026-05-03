<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use RuntimeException;

class BillplzService
{
    private string $apiKey;
    private string $xSignature;
    private string $collectionId;
    private bool $sandbox;

    public function __construct()
    {
        $this->apiKey = trim((string) config('services.billplz.api_key'));
        $this->xSignature = trim((string) config('services.billplz.x_signature'));
        $this->collectionId = trim((string) config('services.billplz.collection_id'));
        $this->sandbox = (bool) config('services.billplz.sandbox', true);
    }

    public function isConfigured(): bool
    {
        return $this->apiKey !== '' && $this->collectionId !== '';
    }

    private function baseUrl(): string
    {
        return $this->sandbox
            ? 'https://www.billplz-sandbox.com/api/v3'
            : 'https://www.billplz.com/api/v3';
    }

    /**
     * Create a Billplz bill. Returns the parsed JSON response on success.
     *
     * @param  array{name: string, email: string, amount_cents: int, description: string, callback_url: string, redirect_url?: string, reference_1?: string, reference_2?: string}  $data
     * @return array{id: string, url: string, ...}
     */
    public function createBill(array $data): array
    {
        if (! $this->isConfigured()) {
            throw new RuntimeException('Billplz is not configured. Set BILLPLZ_* env vars.');
        }

        $payload = [
            'collection_id' => $this->collectionId,
            'email' => $data['email'],
            'name' => $data['name'],
            'amount' => $data['amount_cents'],
            'callback_url' => $data['callback_url'],
            'description' => $data['description'],
        ];

        if (! empty($data['redirect_url'])) {
            $payload['redirect_url'] = $data['redirect_url'];
        }
        if (! empty($data['reference_1'])) {
            $payload['reference_1'] = $data['reference_1'];
        }
        if (! empty($data['reference_2'])) {
            $payload['reference_2'] = $data['reference_2'];
        }

        // Billplz API expects application/x-www-form-urlencoded, NOT JSON
        $response = Http::withBasicAuth($this->apiKey, '')
            ->asForm()
            ->post("{$this->baseUrl()}/bills", $payload);

        if (! $response->successful()) {
            Log::warning('Billplz createBill failed', [
                'status' => $response->status(),
                'body' => $response->body(),
            ]);
            throw new RuntimeException("Billplz returned {$response->status()}: " . $response->body());
        }

        return $response->json();
    }

    /**
     * Verify the X-Signature on a Billplz webhook callback.
     * Source string: ALL POST fields (excluding x_signature itself), sorted by key,
     * concatenated as `key+value` with `|` separator. HMAC-SHA256 with x_signature key.
     *
     * @param  array<string, mixed>  $payload  Full POST payload from Billplz
     */
    public function verifyCallbackSignature(array $payload): bool
    {
        if ($this->xSignature === '') {
            return false;
        }

        $providedSignature = $payload['x_signature'] ?? null;
        if (! is_string($providedSignature) || $providedSignature === '') {
            return false;
        }

        $fields = $payload;
        unset($fields['x_signature']);
        ksort($fields);

        $source = '';
        foreach ($fields as $key => $value) {
            $source .= $key . (is_scalar($value) ? (string) $value : '') . '|';
        }
        $source = rtrim($source, '|');

        $computed = hash_hmac('sha256', $source, $this->xSignature);

        return hash_equals($computed, $providedSignature);
    }
}
