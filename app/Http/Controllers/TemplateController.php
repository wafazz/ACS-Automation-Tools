<?php

namespace App\Http\Controllers;

use App\Enums\Industry;
use App\Http\Requests\StoreTemplateRequest;
use App\Http\Requests\UpdateTemplateRequest;
use App\Models\Template;
use App\Services\WhatsAppService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class TemplateController extends Controller
{
    public function index(): Response
    {
        $user = Auth::user();

        $templates = $user->templates()
            ->orderByDesc('is_default')
            ->orderBy('title')
            ->get();

        $ownedPacks = $user->ownedPacks()
            ->select('template_packs.id', 'template_packs.slug', 'template_packs.name', 'template_packs.icon')
            ->orderByPivot('purchased_at', 'desc')
            ->get()
            ->map(fn ($p) => [
                'id' => $p->id,
                'slug' => $p->slug,
                'name' => $p->name,
                'icon' => $p->icon,
            ])
            ->toArray();

        return Inertia::render('Templates/Index', [
            'templates' => $templates,
            'ownedPacks' => $ownedPacks,
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Templates/Editor', [
            'template' => null,
            'industries' => Industry::options(),
            'variables' => WhatsAppService::availableVariables(),
        ]);
    }

    public function store(StoreTemplateRequest $request): RedirectResponse
    {
        $user = Auth::user();
        $maxTemplates = $user->currentPlan()->maxTemplates();
        if ($maxTemplates !== null && $user->templates()->count() >= $maxTemplates) {
            return redirect()->route('billing.pricing')
                ->with('error', "You've hit the {$maxTemplates}-template limit on your current plan. Upgrade for unlimited.");
        }

        $user->templates()->create($request->validated());

        return redirect()->route('templates.index')->with('success', 'Template created.');
    }

    public function edit(Template $template): Response
    {
        $this->authorize('update', $template);

        return Inertia::render('Templates/Editor', [
            'template' => $template,
            'industries' => Industry::options(),
            'variables' => WhatsAppService::availableVariables(),
        ]);
    }

    public function update(UpdateTemplateRequest $request, Template $template): RedirectResponse
    {
        $template->update($request->validated());

        return redirect()->route('templates.index')->with('success', 'Template updated.');
    }

    public function destroy(Template $template): RedirectResponse
    {
        $this->authorize('delete', $template);

        $template->delete();

        return redirect()->route('templates.index')->with('success', 'Template deleted.');
    }
}
