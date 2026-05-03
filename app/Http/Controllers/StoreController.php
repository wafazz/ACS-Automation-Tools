<?php

namespace App\Http\Controllers;

use App\Models\Payment;
use App\Models\TemplatePack;
use App\Services\BillplzService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

class StoreController extends Controller
{
    public function __construct(private readonly BillplzService $billplz)
    {
    }

    public function index(): Response
    {
        $user = Auth::user();

        $ownedIds = $user->ownedPacks()->pluck('template_packs.id')->toArray();

        $packs = TemplatePack::active()
            ->withCount('items')
            ->orderBy('industry')
            ->get()
            ->map(fn (TemplatePack $p) => [
                'id' => $p->id,
                'slug' => $p->slug,
                'name' => $p->name,
                'industry' => $p->industry?->value,
                'industry_label' => $p->industry?->label(),
                'price_myr' => $p->priceMyr(),
                'description' => $p->description,
                'icon' => $p->icon,
                'item_count' => $p->items_count,
                'owned' => \in_array($p->id, $ownedIds, true),
            ])
            ->toArray();

        return Inertia::render('Store/Index', [
            'packs' => $packs,
            'gatewayConfigured' => $this->billplz->isConfigured(),
        ]);
    }

    public function show(TemplatePack $pack): Response
    {
        $pack->load('items:id,template_pack_id,title,body,sort_order');
        $owned = Auth::user()->ownedPacks()->where('template_packs.id', $pack->id)->exists();

        return Inertia::render('Store/Show', [
            'pack' => [
                'id' => $pack->id,
                'slug' => $pack->slug,
                'name' => $pack->name,
                'industry' => $pack->industry?->value,
                'industry_label' => $pack->industry?->label(),
                'price_myr' => $pack->priceMyr(),
                'description' => $pack->description,
                'icon' => $pack->icon,
                'items' => $pack->items->map(fn ($i) => [
                    'id' => $i->id,
                    'title' => $i->title,
                    'body' => $i->body,
                ])->toArray(),
            ],
            'owned' => $owned,
            'gatewayConfigured' => $this->billplz->isConfigured(),
        ]);
    }

    public function checkout(TemplatePack $pack): RedirectResponse
    {
        $user = Auth::user();

        if ($user->ownedPacks()->where('template_packs.id', $pack->id)->exists()) {
            return redirect()->route('store.show', $pack)->with('error', 'You already own this pack.');
        }

        if (! $this->billplz->isConfigured()) {
            return back()->with('error', 'Payment gateway not configured. Please contact support.');
        }

        $payment = Payment::create([
            'user_id' => $user->id,
            'template_pack_id' => $pack->id,
            'plan' => 'pack', // sentinel — distinguishes from subscription payments
            'amount_cents' => $pack->price_cents,
            'currency' => 'MYR',
            'status' => 'pending',
            'gateway' => 'billplz',
        ]);

        try {
            $bill = $this->billplz->createBill([
                'name' => $user->name,
                'email' => $user->email,
                'amount_cents' => $pack->price_cents,
                'description' => "ACS — {$pack->name}",
                'callback_url' => route('billing.callback'),
                'redirect_url' => route('billing.return', ['payment' => $payment->id]),
                'reference_1' => 'payment_' . $payment->id,
                'reference_2' => 'pack_' . $pack->id,
            ]);

            $payment->update(['gateway_ref' => $bill['id']]);

            return redirect()->away($bill['url']);
        } catch (Throwable $e) {
            Log::error('Billplz pack checkout failed', ['error' => $e->getMessage(), 'pack_id' => $pack->id]);
            $payment->update(['status' => 'failed', 'raw_payload' => ['error' => $e->getMessage()]]);

            return back()->with('error', 'Could not start checkout. Please try again.');
        }
    }
}
