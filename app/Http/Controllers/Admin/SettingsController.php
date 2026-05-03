<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\BrevoService;
use App\Services\OnsendService;
use App\Services\SettingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Http;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

class SettingsController extends Controller
{
    public function __construct(private readonly SettingService $settings)
    {
    }

    // ─── Billplz ──────────────────────────────────────────────────────────

    public function billplz(): Response
    {
        $current = $this->settings->get('billplz');

        return Inertia::render('Admin/BillplzSetting', [
            'settings' => [
                'api_key' => self::masked($current['api_key'] ?? ''),
                'x_signature' => self::masked($current['x_signature'] ?? ''),
                'collection_id' => $current['collection_id'] ?? '',
                'sandbox' => (bool) ($current['sandbox'] ?? true),
            ],
            'is_enabled' => $this->settings->isEnabled('billplz'),
            'env_fallback' => [
                'has_api_key' => (string) config('services.billplz.api_key', '') !== '',
                'has_x_signature' => (string) config('services.billplz.x_signature', '') !== '',
                'has_collection_id' => (string) config('services.billplz.collection_id', '') !== '',
            ],
        ]);
    }

    public function updateBillplz(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'api_key' => ['nullable', 'string', 'max:200'],
            'x_signature' => ['nullable', 'string', 'max:200'],
            'collection_id' => ['nullable', 'string', 'max:60'],
            'sandbox' => ['required', 'boolean'],
            'is_enabled' => ['required', 'boolean'],
        ]);

        // Preserve existing secrets when input is blank (so user can edit
        // collection_id / sandbox without re-entering keys)
        $current = $this->settings->get('billplz');
        $next = [
            'api_key' => $validated['api_key'] !== '' && $validated['api_key'] !== null
                ? $validated['api_key']
                : ($current['api_key'] ?? ''),
            'x_signature' => $validated['x_signature'] !== '' && $validated['x_signature'] !== null
                ? $validated['x_signature']
                : ($current['x_signature'] ?? ''),
            'collection_id' => $validated['collection_id'] ?? '',
            'sandbox' => $validated['sandbox'],
        ];

        $this->settings->set('billplz', $next, $validated['is_enabled'], Auth::id());

        return back()->with('success', 'Billplz settings saved.');
    }

    public function testBillplz(): JsonResponse
    {
        $apiKey = $this->settings->value('billplz', 'api_key', config('services.billplz.api_key'));
        $collectionId = $this->settings->value('billplz', 'collection_id', config('services.billplz.collection_id'));
        $sandbox = (bool) $this->settings->value('billplz', 'sandbox', config('services.billplz.sandbox', true));

        if (! $apiKey || ! $collectionId) {
            return response()->json(['ok' => false, 'message' => 'API key and collection ID are required.']);
        }

        $base = $sandbox ? 'https://www.billplz-sandbox.com/api/v3' : 'https://www.billplz.com/api/v3';

        try {
            $response = Http::withBasicAuth($apiKey, '')
                ->acceptJson()
                ->get("{$base}/collections/{$collectionId}");

            if ($response->successful()) {
                $data = $response->json();
                return response()->json([
                    'ok' => true,
                    'message' => "Connected. Collection: " . ($data['title'] ?? $collectionId),
                ]);
            }

            return response()->json([
                'ok' => false,
                'message' => "Billplz returned {$response->status()}. Check your API key and collection ID.",
            ]);
        } catch (Throwable $e) {
            return response()->json(['ok' => false, 'message' => 'Connection error: ' . $e->getMessage()]);
        }
    }

    // ─── Brevo ────────────────────────────────────────────────────────────

    public function brevo(): Response
    {
        $current = $this->settings->get('brevo');

        return Inertia::render('Admin/BrevoSetting', [
            'settings' => [
                'api_key' => self::masked($current['api_key'] ?? ''),
                'sender_email' => $current['sender_email'] ?? '',
                'sender_name' => $current['sender_name'] ?? 'ACS',
            ],
            'is_enabled' => $this->settings->isEnabled('brevo'),
        ]);
    }

    public function updateBrevo(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'api_key' => ['nullable', 'string', 'max:200'],
            'sender_email' => ['required', 'email', 'max:255'],
            'sender_name' => ['required', 'string', 'max:100'],
            'is_enabled' => ['required', 'boolean'],
        ]);

        $current = $this->settings->get('brevo');
        $next = [
            'api_key' => $validated['api_key'] !== '' && $validated['api_key'] !== null
                ? $validated['api_key']
                : ($current['api_key'] ?? ''),
            'sender_email' => $validated['sender_email'],
            'sender_name' => $validated['sender_name'],
        ];

        $this->settings->set('brevo', $next, $validated['is_enabled'], Auth::id());

        return back()->with('success', 'Brevo settings saved.');
    }

    public function testBrevo(BrevoService $brevo): JsonResponse
    {
        try {
            if (! $brevo->isConfigured()) {
                return response()->json(['ok' => false, 'message' => 'API key and sender email are required.']);
            }

            $brevo->sendEmail(
                ['email' => Auth::user()->email, 'name' => Auth::user()->name],
                'ACS — Brevo test email',
                '<h2>It works!</h2><p>If you got this, your Brevo integration is wired correctly.</p>',
            );

            return response()->json([
                'ok' => true,
                'message' => 'Test email sent to ' . Auth::user()->email,
            ]);
        } catch (Throwable $e) {
            return response()->json(['ok' => false, 'message' => $e->getMessage()]);
        }
    }

    // ─── Onsend ───────────────────────────────────────────────────────────

    public function onsend(): Response
    {
        $current = $this->settings->get('onsend');

        return Inertia::render('Admin/OnsendSetting', [
            'settings' => [
                'instance_id' => self::masked($current['instance_id'] ?? ''),
                'access_token' => self::masked($current['access_token'] ?? ''),
            ],
            'is_enabled' => $this->settings->isEnabled('onsend'),
        ]);
    }

    public function updateOnsend(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'instance_id' => ['nullable', 'string', 'max:200'],
            'access_token' => ['nullable', 'string', 'max:200'],
            'is_enabled' => ['required', 'boolean'],
        ]);

        $current = $this->settings->get('onsend');
        $next = [
            'instance_id' => $validated['instance_id'] !== '' && $validated['instance_id'] !== null
                ? $validated['instance_id']
                : ($current['instance_id'] ?? ''),
            'access_token' => $validated['access_token'] !== '' && $validated['access_token'] !== null
                ? $validated['access_token']
                : ($current['access_token'] ?? ''),
        ];

        $this->settings->set('onsend', $next, $validated['is_enabled'], Auth::id());

        return back()->with('success', 'Onsend settings saved.');
    }

    public function testOnsend(OnsendService $onsend): JsonResponse
    {
        try {
            $user = Auth::user();
            if (! $user->phone) {
                return response()->json(['ok' => false, 'message' => 'Set a phone number on your admin profile first.']);
            }
            if (! $onsend->isConfigured()) {
                return response()->json(['ok' => false, 'message' => 'Instance ID and access token are required.']);
            }

            $onsend->sendMessage($user->phone, 'ACS — Onsend test message. If you see this, the integration works!');

            return response()->json([
                'ok' => true,
                'message' => 'Test message sent to ' . $user->phone,
            ]);
        } catch (Throwable $e) {
            return response()->json(['ok' => false, 'message' => $e->getMessage()]);
        }
    }

    /**
     * Mask sensitive strings for display: keep first 4 + last 4, replace middle with •
     */
    private static function masked(string $value): string
    {
        $value = trim($value);
        if ($value === '') return '';
        if (strlen($value) <= 8) return str_repeat('•', strlen($value));
        return substr($value, 0, 4) . str_repeat('•', max(4, strlen($value) - 8)) . substr($value, -4);
    }
}
