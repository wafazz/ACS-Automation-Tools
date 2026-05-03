<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Affiliate;
use App\Models\Payout;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class AffiliatesController extends Controller
{
    public function index(): Response
    {
        $affiliates = Affiliate::with('user:id,name,email')
            ->withCount(['referrals', 'commissions'])
            ->latest()
            ->limit(100)
            ->get()
            ->map(fn (Affiliate $a) => [
                'id' => $a->id,
                'code' => $a->code,
                'balance_myr' => $a->balanceMyr(),
                'total_earned_myr' => $a->totalEarnedMyr(),
                'total_paid_myr' => $a->totalPaidMyr(),
                'referrals_count' => $a->referrals_count,
                'commissions_count' => $a->commissions_count,
                'opted_in_at' => $a->opted_in_at,
                'user' => $a->user ? ['id' => $a->user->id, 'name' => $a->user->name, 'email' => $a->user->email] : null,
            ])
            ->toArray();

        $payouts = Payout::with([
                'affiliate:id,user_id,code',
                'affiliate.user:id,name,email',
            ])
            ->latest('requested_at')
            ->limit(100)
            ->get()
            ->map(fn (Payout $p) => [
                'id' => $p->id,
                'amount_myr' => $p->amountMyr(),
                'status' => $p->status,
                'method' => $p->method,
                'bank_details' => $p->bank_details,
                'admin_note' => $p->admin_note,
                'requested_at' => $p->requested_at,
                'paid_at' => $p->paid_at,
                'affiliate' => $p->affiliate ? [
                    'code' => $p->affiliate->code,
                    'user_name' => $p->affiliate->user?->name,
                    'user_email' => $p->affiliate->user?->email,
                ] : null,
            ])
            ->toArray();

        return Inertia::render('Admin/Affiliates', [
            'affiliates' => $affiliates,
            'payouts' => $payouts,
        ]);
    }

    public function markPayoutPaid(Request $request, Payout $payout): RedirectResponse
    {
        if (! \in_array($payout->status, ['requested', 'processing'], true)) {
            return back()->with('error', 'This payout is not pending.');
        }

        $validated = $request->validate([
            'admin_note' => ['nullable', 'string', 'max:500'],
        ]);

        DB::transaction(function () use ($payout, $validated) {
            $payout->update([
                'status' => 'paid',
                'paid_at' => now(),
                'admin_note' => $validated['admin_note'] ?? null,
            ]);

            // Mark all linked commissions as paid
            $payout->commissions()->update(['status' => 'paid']);

            // Bump affiliate's lifetime paid total
            $affiliate = $payout->affiliate;
            if ($affiliate) {
                $affiliate->increment('total_paid_cents', $payout->amount_cents);
            }
        });

        return back()->with('success', "Payout #{$payout->id} marked as paid.");
    }

    public function rejectPayout(Request $request, Payout $payout): RedirectResponse
    {
        if (! \in_array($payout->status, ['requested', 'processing'], true)) {
            return back()->with('error', 'This payout is not pending.');
        }

        $validated = $request->validate([
            'admin_note' => ['required', 'string', 'max:500'],
        ]);

        DB::transaction(function () use ($payout, $validated) {
            $payout->update([
                'status' => 'rejected',
                'admin_note' => $validated['admin_note'],
            ]);

            // Release the commissions back to pending and refund affiliate balance
            $payout->commissions()->update(['payout_id' => null, 'status' => 'pending']);

            $affiliate = $payout->affiliate;
            if ($affiliate) {
                $affiliate->increment('balance_cents', $payout->amount_cents);
            }
        });

        return back()->with('success', "Payout #{$payout->id} rejected — balance refunded.");
    }
}
