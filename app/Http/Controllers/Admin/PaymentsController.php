<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Payment;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PaymentsController extends Controller
{
    public function index(Request $request): Response
    {
        $query = Payment::query()
            ->with([
                'user:id,name,email',
                'subscription:id,plan,status,started_at,ends_at',
                'templatePack:id,slug,name',
            ]);

        $statusFilter = $request->string('status')->toString();
        if ($statusFilter !== '') {
            $query->where('status', $statusFilter);
        }

        $kindFilter = $request->string('kind')->toString();
        if ($kindFilter === 'subscription') {
            $query->whereNotNull('subscription_id');
        } elseif ($kindFilter === 'pack') {
            $query->whereNotNull('template_pack_id');
        }

        $payments = $query->latest()
            ->limit(200)
            ->get()
            ->map(fn (Payment $p) => [
                'id' => $p->id,
                'amount_myr' => $p->amountMyr(),
                'currency' => $p->currency,
                'status' => $p->status,
                'gateway' => $p->gateway,
                'gateway_ref' => $p->gateway_ref,
                'paid_at' => $p->paid_at,
                'created_at' => $p->created_at,
                'plan' => $p->plan instanceof \App\Enums\Plan ? $p->plan->value : (string) $p->plan,
                'kind' => $p->subscription_id ? 'subscription' : ($p->template_pack_id ? 'pack' : 'other'),
                'user' => $p->user ? ['id' => $p->user->id, 'name' => $p->user->name, 'email' => $p->user->email] : null,
                'pack' => $p->templatePack ? ['name' => $p->templatePack->name, 'slug' => $p->templatePack->slug] : null,
            ])
            ->toArray();

        return Inertia::render('Admin/Payments', [
            'payments' => $payments,
            'filters' => [
                'status' => $statusFilter,
                'kind' => $kindFilter,
            ],
        ]);
    }
}
