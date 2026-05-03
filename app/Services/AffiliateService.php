<?php

namespace App\Services;

use App\Models\Affiliate;
use App\Models\Commission;
use App\Models\Payment;
use App\Models\Referral;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class AffiliateService
{
    public const COMMISSION_RATE = 0.30;

    public const REFERRAL_COOKIE = 'acs_ref';
    public const REFERRAL_COOKIE_DAYS = 60;
    public const PAYOUT_MIN_CENTS = 5000; // RM 50

    public function optIn(User $user): Affiliate
    {
        if ($user->affiliate) {
            return $user->affiliate;
        }

        return Affiliate::create([
            'user_id' => $user->id,
            'code' => $this->generateUniqueCode(),
            'opted_in_at' => now(),
        ]);
    }

    public function findByCode(string $code): ?Affiliate
    {
        $code = strtoupper(trim($code));
        if ($code === '') {
            return null;
        }
        return Affiliate::where('code', $code)->first();
    }

    /**
     * Link a newly registered user to the affiliate that referred them.
     * Idempotent — does nothing if user already has a referral or is the affiliate themselves.
     */
    public function attribute(string $code, User $newUser): ?Referral
    {
        $affiliate = $this->findByCode($code);
        if (! $affiliate) {
            return null;
        }
        if ($affiliate->user_id === $newUser->id) {
            return null; // self-referral guard
        }
        if (Referral::where('referred_user_id', $newUser->id)->exists()) {
            return null; // already attributed
        }

        return Referral::create([
            'affiliate_id' => $affiliate->id,
            'referred_user_id' => $newUser->id,
            'status' => 'pending',
        ]);
    }

    /**
     * Award commission to the referring affiliate when a referred user pays.
     * Only applies to subscription payments (not pack purchases).
     */
    public function awardCommissionFor(Payment $payment): ?Commission
    {
        if ($payment->subscription_id === null) {
            return null; // packs are not commissioned
        }

        $referral = Referral::where('referred_user_id', $payment->user_id)->first();
        if (! $referral) {
            return null; // user wasn't referred
        }

        // Idempotency: never double-pay for the same payment
        if (Commission::where('payment_id', $payment->id)->exists()) {
            return null;
        }

        $commissionCents = (int) round($payment->amount_cents * self::COMMISSION_RATE);
        if ($commissionCents <= 0) {
            return null;
        }

        return DB::transaction(function () use ($referral, $payment, $commissionCents) {
            $commission = Commission::create([
                'affiliate_id' => $referral->affiliate_id,
                'referral_id' => $referral->id,
                'payment_id' => $payment->id,
                'amount_cents' => $commissionCents,
                'status' => 'pending',
            ]);

            $affiliate = $referral->affiliate;
            $affiliate->increment('balance_cents', $commissionCents);
            $affiliate->increment('total_earned_cents', $commissionCents);

            // Mark referral as qualified on first commission
            if ($referral->status !== 'qualified') {
                $referral->update([
                    'status' => 'qualified',
                    'qualified_at' => now(),
                ]);
            }

            return $commission;
        });
    }

    private function generateUniqueCode(): string
    {
        do {
            $code = strtoupper(Str::random(8));
        } while (Affiliate::where('code', $code)->exists());

        return $code;
    }
}
