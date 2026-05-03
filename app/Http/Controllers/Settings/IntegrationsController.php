<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Services\BrevoService;
use App\Services\OnsendService;
use App\Services\SettingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

/**
 * Subscriber-facing settings for their own automation integrations.
 * Distinct from Admin\SettingsController which manages global platform settings.
 *
 * Subscribers can configure: brevo (email), onsend (whatsapp).
 * They CANNOT configure: billplz (platform-only).
 */
class IntegrationsController extends Controller
{
    public function __construct(private readonly SettingService $settings)
    {
    }

    public function index(): Response
    {
        return $this->brevo();
    }

    // ─── Brevo (per-user) ─────────────────────────────────────────────────

    public function brevo(): Response
    {
        $userId = Auth::id();
        $current = $this->settings->getForUser($userId, 'brevo');

        // Check whether platform admin has provided a global fallback
        $globalFallback = ! empty($this->settings->get('brevo'));

        return Inertia::render('Settings/BrevoSetting', [
            'settings' => [
                'api_key' => self::masked($current['api_key'] ?? ''),
                'sender_email' => $current['sender_email'] ?? Auth::user()->email,
                'sender_name' => $current['sender_name'] ?? Auth::user()->name,
            ],
            'is_enabled' => $this->settings->isEnabled('brevo', $userId),
            'global_fallback_active' => $globalFallback,
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

        $userId = Auth::id();
        $current = $this->settings->getForUser($userId, 'brevo');
        $next = [
            'api_key' => $validated['api_key'] !== '' && $validated['api_key'] !== null
                ? $validated['api_key']
                : ($current['api_key'] ?? ''),
            'sender_email' => $validated['sender_email'],
            'sender_name' => $validated['sender_name'],
        ];

        $this->settings->set('brevo', $next, $validated['is_enabled'], $userId, $userId);

        return back()->with('success', 'Brevo settings saved.');
    }

    public function testBrevo(): JsonResponse
    {
        try {
            $brevo = BrevoService::for(Auth::id());
            if (! $brevo->isConfigured()) {
                return response()->json(['ok' => false, 'message' => 'API key and sender email are required.']);
            }

            $brevo->sendEmail(
                ['email' => Auth::user()->email, 'name' => Auth::user()->name],
                'ACS — Brevo test (your account)',
                '<h2>It works!</h2><p>Your Brevo integration is wired correctly. This email was sent through your own Brevo account.</p>',
            );

            return response()->json(['ok' => true, 'message' => 'Test email sent to ' . Auth::user()->email]);
        } catch (Throwable $e) {
            return response()->json(['ok' => false, 'message' => $e->getMessage()]);
        }
    }

    // ─── Onsend (per-user) ────────────────────────────────────────────────

    public function onsend(): Response
    {
        $userId = Auth::id();
        $current = $this->settings->getForUser($userId, 'onsend');
        $globalFallback = ! empty($this->settings->get('onsend'));

        return Inertia::render('Settings/OnsendSetting', [
            'settings' => [
                'instance_id' => self::masked($current['instance_id'] ?? ''),
                'access_token' => self::masked($current['access_token'] ?? ''),
            ],
            'is_enabled' => $this->settings->isEnabled('onsend', $userId),
            'global_fallback_active' => $globalFallback,
        ]);
    }

    public function updateOnsend(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'instance_id' => ['nullable', 'string', 'max:200'],
            'access_token' => ['nullable', 'string', 'max:200'],
            'is_enabled' => ['required', 'boolean'],
        ]);

        $userId = Auth::id();
        $current = $this->settings->getForUser($userId, 'onsend');
        $next = [
            'instance_id' => $validated['instance_id'] !== '' && $validated['instance_id'] !== null
                ? $validated['instance_id']
                : ($current['instance_id'] ?? ''),
            'access_token' => $validated['access_token'] !== '' && $validated['access_token'] !== null
                ? $validated['access_token']
                : ($current['access_token'] ?? ''),
        ];

        $this->settings->set('onsend', $next, $validated['is_enabled'], $userId, $userId);

        return back()->with('success', 'Onsend settings saved.');
    }

    public function testOnsend(): JsonResponse
    {
        try {
            $user = Auth::user();
            if (! $user->phone) {
                return response()->json(['ok' => false, 'message' => 'Set your phone in Profile first.']);
            }

            $onsend = OnsendService::for($user->id);
            if (! $onsend->isConfigured()) {
                return response()->json(['ok' => false, 'message' => 'Instance ID and access token are required.']);
            }

            $onsend->sendMessage($user->phone, 'ACS — Onsend test (your account). If you see this, your WhatsApp integration is wired.');

            return response()->json(['ok' => true, 'message' => 'Test message sent to ' . $user->phone]);
        } catch (Throwable $e) {
            return response()->json(['ok' => false, 'message' => $e->getMessage()]);
        }
    }

    private static function masked(string $value): string
    {
        $value = trim($value);
        if ($value === '') return '';
        if (\strlen($value) <= 8) return str_repeat('•', \strlen($value));
        return substr($value, 0, 4) . str_repeat('•', max(4, \strlen($value) - 8)) . substr($value, -4);
    }
}
