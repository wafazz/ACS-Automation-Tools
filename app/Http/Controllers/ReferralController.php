<?php

namespace App\Http\Controllers;

use App\Services\AffiliateService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Cookie;

class ReferralController extends Controller
{
    public function __construct(private readonly AffiliateService $affiliates)
    {
    }

    /**
     * Public referral landing. Sets the attribution cookie then redirects.
     * URL: /r/{code}
     *
     * If the visitor is already logged in, no cookie is set — they can't be
     * referred to themselves, and existing users don't get re-attributed.
     */
    public function landing(string $code): RedirectResponse
    {
        $affiliate = $this->affiliates->findByCode($code);

        // Logged-in visitors: skip attribution, just bounce to dashboard
        if (Auth::check()) {
            return redirect()->route('dashboard');
        }

        $target = redirect()->route('register');

        if ($affiliate) {
            $cookie = Cookie::create(
                AffiliateService::REFERRAL_COOKIE,
                strtoupper($code),
                time() + (AffiliateService::REFERRAL_COOKIE_DAYS * 86400),
                '/',
                null,
                false,   // secure
                true,    // httpOnly
                false,
                'Lax'
            );
            $target->withCookie($cookie);
        }

        return $target;
    }
}
