<?php

namespace App\Http\Controllers;

use App\Models\Payout;
use App\Services\AffiliateService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class AffiliateController extends Controller
{
    public function __construct(private readonly AffiliateService $affiliates)
    {
    }

    public function dashboard(): Response
    {
        $user = Auth::user();
        $affiliate = $user->affiliate;

        if (! $affiliate) {
            return Inertia::render('Affiliate/Dashboard', [
                'optedIn' => false,
                'commissionRate' => (int) (AffiliateService::COMMISSION_RATE * 100),
            ]);
        }

        $referrals = $affiliate->referrals()
            ->with('referredUser:id,name,email,plan')
            ->latest()
            ->limit(20)
            ->get()
            ->map(fn ($r) => [
                'id' => $r->id,
                'status' => $r->status,
                'qualified_at' => $r->qualified_at,
                'created_at' => $r->created_at,
                'referred_user' => $r->referredUser ? [
                    'name' => $r->referredUser->name,
                    'email' => $r->referredUser->email,
                    'plan' => $r->referredUser->plan,
                ] : null,
            ])
            ->toArray();

        $referralsCount = $affiliate->referrals()->count();
        $qualifiedCount = $affiliate->referrals()->where('status', 'qualified')->count();

        return Inertia::render('Affiliate/Dashboard', [
            'optedIn' => true,
            'affiliate' => [
                'code' => $affiliate->code,
                'balance_myr' => $affiliate->balanceMyr(),
                'total_earned_myr' => $affiliate->totalEarnedMyr(),
                'total_paid_myr' => $affiliate->totalPaidMyr(),
                'opted_in_at' => $affiliate->opted_in_at,
            ],
            'stats' => [
                'referrals_total' => $referralsCount,
                'referrals_qualified' => $qualifiedCount,
            ],
            'referrals' => $referrals,
            'referralLink' => url('/r/' . $affiliate->code),
            'commissionRate' => (int) (AffiliateService::COMMISSION_RATE * 100),
            'payoutMinMyr' => AffiliateService::PAYOUT_MIN_CENTS / 100,
        ]);
    }

    public function optIn(): RedirectResponse
    {
        $this->affiliates->optIn(Auth::user());

        return redirect()->route('affiliate.dashboard')
            ->with('success', 'Welcome to the affiliate program!');
    }

    public function payouts(): Response|RedirectResponse
    {
        $user = Auth::user();
        $affiliate = $user->affiliate;

        if (! $affiliate) {
            return redirect()->route('affiliate.dashboard');
        }

        $payouts = $affiliate->payouts()
            ->latest('requested_at')
            ->limit(50)
            ->get()
            ->map(fn ($p) => [
                'id' => $p->id,
                'amount_myr' => $p->amountMyr(),
                'status' => $p->status,
                'method' => $p->method,
                'requested_at' => $p->requested_at,
                'paid_at' => $p->paid_at,
                'admin_note' => $p->admin_note,
            ])
            ->toArray();

        return Inertia::render('Affiliate/Payouts', [
            'affiliate' => [
                'code' => $affiliate->code,
                'balance_myr' => $affiliate->balanceMyr(),
                'total_paid_myr' => $affiliate->totalPaidMyr(),
            ],
            'payouts' => $payouts,
            'payoutMinMyr' => AffiliateService::PAYOUT_MIN_CENTS / 100,
        ]);
    }

    public function requestPayout(Request $request): RedirectResponse
    {
        $user = Auth::user();
        $affiliate = $user->affiliate;

        if (! $affiliate) {
            return redirect()->route('affiliate.dashboard');
        }

        $validated = $request->validate([
            'bank_name' => ['required', 'string', 'max:50'],
            'bank_account_name' => ['required', 'string', 'max:100'],
            'bank_account_number' => ['required', 'string', 'max:30'],
        ]);

        if ($affiliate->balance_cents < AffiliateService::PAYOUT_MIN_CENTS) {
            $minMyr = AffiliateService::PAYOUT_MIN_CENTS / 100;
            return back()->with('error', "You need at least RM {$minMyr} in balance to request a payout.");
        }

        $hasPending = $affiliate->payouts()
            ->whereIn('status', ['requested', 'processing'])
            ->exists();
        if ($hasPending) {
            return back()->with('error', 'You already have a pending payout request. Please wait for it to be processed.');
        }

        $amountCents = $affiliate->balance_cents;

        DB::transaction(function () use ($affiliate, $amountCents, $validated) {
            $payout = Payout::create([
                'affiliate_id' => $affiliate->id,
                'amount_cents' => $amountCents,
                'status' => 'requested',
                'method' => 'bank_transfer',
                'bank_details' => $validated,
                'requested_at' => now(),
            ]);

            // Lock all pending commissions to this payout — admin will flip
            // status to 'paid' in the Phase 10 admin panel after disbursing.
            $affiliate->commissions()
                ->where('status', 'pending')
                ->whereNull('payout_id')
                ->update(['payout_id' => $payout->id]);

            $affiliate->decrement('balance_cents', $amountCents);
        });

        return redirect()->route('affiliate.payouts')
            ->with('success', "Payout request submitted. We'll process it within 3 business days.");
    }
}
