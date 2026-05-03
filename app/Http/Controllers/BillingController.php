<?php

namespace App\Http\Controllers;

use App\Enums\Plan;
use App\Models\Payment;
use App\Models\Subscription;
use App\Models\Template;
use App\Services\AffiliateService;
use App\Services\BillplzService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;
use Throwable;

class BillingController extends Controller
{
    public function __construct(
        private readonly BillplzService $billplz,
        private readonly AffiliateService $affiliates,
    ) {
    }

    public function pricing(): InertiaResponse
    {
        $user = Auth::user();
        $current = $user?->currentPlan();

        $plans = array_map(fn (Plan $p) => $p->toCardArray(), Plan::purchasable());

        return Inertia::render('Billing/Pricing', [
            'plans' => $plans,
            'currentPlan' => $current?->value,
            'gatewayConfigured' => $this->billplz->isConfigured(),
        ]);
    }

    /**
     * Create a Billplz bill for the requested plan and redirect the user to it.
     */
    public function checkout(string $plan): RedirectResponse
    {
        $user = Auth::user();
        $planEnum = Plan::tryFrom($plan);

        if ($planEnum === null || ! \in_array($planEnum, Plan::purchasable(), true)) {
            return back()->with('error', 'Invalid plan.');
        }

        if (! $this->billplz->isConfigured()) {
            return back()->with('error', 'Payment gateway not configured. Please contact support.');
        }

        // Create pending subscription + pending payment up front so the webhook can match
        $subscription = $user->subscriptions()->create([
            'plan' => $planEnum->value,
            'status' => 'pending',
        ]);

        $payment = Payment::create([
            'user_id' => $user->id,
            'subscription_id' => $subscription->id,
            'plan' => $planEnum->value,
            'amount_cents' => $planEnum->priceCents(),
            'currency' => 'MYR',
            'status' => 'pending',
            'gateway' => 'billplz',
        ]);

        try {
            $bill = $this->billplz->createBill([
                'name' => $user->name,
                'email' => $user->email,
                'amount_cents' => $planEnum->priceCents(),
                'description' => "ACS — {$planEnum->label()}",
                'callback_url' => route('billing.callback'),
                'redirect_url' => route('billing.return', ['payment' => $payment->id]),
                'reference_1' => 'payment_' . $payment->id,
                'reference_2' => 'sub_' . $subscription->id,
            ]);

            $payment->update(['gateway_ref' => $bill['id']]);

            return redirect()->away($bill['url']);
        } catch (Throwable $e) {
            Log::error('Billplz checkout failed', ['error' => $e->getMessage(), 'user_id' => $user->id]);
            $payment->update(['status' => 'failed', 'raw_payload' => ['error' => $e->getMessage()]]);
            $subscription->update(['status' => 'cancelled', 'cancelled_at' => now()]);

            return back()->with('error', 'Could not start checkout. Please try again or contact support.');
        }
    }

    /**
     * Server-to-server webhook from Billplz. Must always return 200.
     * No CSRF (excluded in bootstrap/app.php).
     */
    public function callback(Request $request): Response
    {
        $payload = $request->all();
        Log::info('Billplz callback received', ['payload' => $payload]);

        if (! $this->billplz->verifyCallbackSignature($payload)) {
            Log::warning('Billplz callback signature mismatch', ['payload' => $payload]);
            return response('Invalid signature', 200); // 200 to prevent retries on intentional rejection
        }

        $billId = $payload['id'] ?? null;
        if (! is_string($billId) || $billId === '') {
            return response('Missing bill id', 200);
        }

        $payment = Payment::where('gateway_ref', $billId)->first();
        if (! $payment) {
            Log::warning('Billplz callback for unknown bill', ['bill_id' => $billId]);
            return response('Unknown bill', 200);
        }

        $isPaid = filter_var($payload['paid'] ?? false, FILTER_VALIDATE_BOOLEAN);

        try {
            DB::transaction(function () use ($payment, $isPaid, $payload) {
                if ($isPaid && $payment->status !== 'paid') {
                    $this->markPaid($payment, $payload);
                } elseif (! $isPaid && $payment->status === 'pending') {
                    $payment->update([
                        'status' => 'failed',
                        'raw_payload' => $payload,
                    ]);
                }
            });
        } catch (Throwable $e) {
            // Never let a side-effect failure break the webhook 200 response
            Log::error('Billplz callback processing error', [
                'error' => $e->getMessage(),
                'bill_id' => $billId,
            ]);
        }

        return response('OK', 200);
    }

    /**
     * User-facing return page after Billplz redirects them back.
     * Show success / pending / failed state; the actual source of truth is the webhook.
     */
    public function return(Payment $payment): InertiaResponse
    {
        // Light authz: payment must belong to the logged-in user
        if (! Auth::check() || $payment->user_id !== Auth::id()) {
            abort(403);
        }

        $planEnum = $payment->plan;

        return Inertia::render('Billing/Return', [
            'payment' => [
                'id' => $payment->id,
                'plan' => $planEnum?->value,
                'plan_label' => $planEnum?->label(),
                'amount_myr' => $payment->amountMyr(),
                'status' => $payment->status,
                'paid_at' => $payment->paid_at,
            ],
        ]);
    }

    private function markPaid(Payment $payment, array $payload): void
    {
        $paidAt = isset($payload['paid_at']) ? (new \DateTimeImmutable((string) $payload['paid_at'])) : now();

        $payment->update([
            'status' => 'paid',
            'paid_at' => $paidAt,
            'raw_payload' => $payload,
        ]);

        // Pack purchase path
        if ($payment->template_pack_id !== null) {
            $this->fulfillPackPurchase($payment);
            return;
        }

        // Subscription path
        $subscription = $payment->subscription;
        if (! $subscription) {
            return;
        }

        $planEnum = $payment->plan;
        if (! $planEnum instanceof Plan) {
            return;
        }

        // Cancel any other active subscriptions for this user
        Subscription::where('user_id', $subscription->user_id)
            ->where('id', '!=', $subscription->id)
            ->whereIn('status', ['active', 'pending'])
            ->update([
                'status' => 'cancelled',
                'cancelled_at' => now(),
            ]);

        // Activate the new subscription
        $subscription->update([
            'status' => 'active',
            'started_at' => now(),
            'ends_at' => $planEnum->durationDays() === null
                ? null
                : now()->addDays($planEnum->durationDays()),
        ]);

        // Mirror plan onto user (so `currentPlan()` and shared user props reflect it immediately)
        $payment->user()->update([
            'plan' => $planEnum->value,
            'trial_ends_at' => null,
        ]);

        // Award affiliate commission (if this user was referred)
        $this->affiliates->awardCommissionFor($payment);
    }

    /**
     * On successful pack payment: attach pack to user + clone all items as the
     * user's own templates so they can edit/customize freely.
     */
    private function fulfillPackPurchase(Payment $payment): void
    {
        $pack = $payment->templatePack;
        if (! $pack) {
            return;
        }

        $user = $payment->user;
        if (! $user) {
            return;
        }

        // Idempotency: skip if user already owns this pack (e.g. webhook re-fired)
        if ($user->ownedPacks()->where('template_packs.id', $pack->id)->exists()) {
            return;
        }

        $user->ownedPacks()->attach($pack->id, [
            'payment_id' => $payment->id,
            'purchased_at' => now(),
        ]);

        // Clone every pack item into the user's templates
        $industryValue = $pack->industry?->value;
        foreach ($pack->items as $item) {
            Template::create([
                'user_id' => $user->id,
                'title' => $item->title,
                'body' => $item->body,
                'industry' => $industryValue,
                'is_default' => false,
            ]);
        }

        $pack->increment('purchase_count');
    }
}
