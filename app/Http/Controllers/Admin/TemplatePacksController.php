<?php

namespace App\Http\Controllers\Admin;

use App\Enums\Industry;
use App\Http\Controllers\Controller;
use App\Models\TemplatePack;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class TemplatePacksController extends Controller
{
    public function index(): Response
    {
        $packs = TemplatePack::withCount(['items', 'owners'])
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
                'is_active' => $p->is_active,
                'item_count' => $p->items_count,
                'sales_count' => $p->owners_count,
                'purchase_count' => $p->purchase_count,
            ])
            ->toArray();

        return Inertia::render('Admin/TemplatePacks', [
            'packs' => $packs,
            'industries' => Industry::options(),
        ]);
    }

    public function update(Request $request, TemplatePack $pack): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'price_cents' => ['required', 'integer', 'min:0', 'max:99999999'],
            'description' => ['nullable', 'string', 'max:1000'],
            'icon' => ['nullable', 'string', 'max:30'],
            'industry' => ['nullable', Rule::enum(Industry::class)],
        ]);

        $pack->update($validated);

        return back()->with('success', "Pack \"{$pack->name}\" updated.");
    }

    public function toggleActive(TemplatePack $pack): RedirectResponse
    {
        $pack->update(['is_active' => ! $pack->is_active]);

        return back()->with('success', $pack->is_active
            ? "Pack \"{$pack->name}\" is now visible in the store."
            : "Pack \"{$pack->name}\" is now hidden from the store.");
    }
}
