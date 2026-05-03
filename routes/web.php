<?php

use App\Http\Controllers\AffiliateController;
use App\Http\Controllers\AnalyticsController;
use App\Http\Controllers\BillingController;
use App\Http\Controllers\LeadController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\ReferralController;
use App\Http\Controllers\ReminderController;
use App\Http\Controllers\StoreController;
use App\Http\Controllers\TemplateController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
        'laravelVersion' => Application::VERSION,
        'phpVersion' => PHP_VERSION,
    ]);
});

Route::get('/dashboard', function () {
    $user = auth()->user();
    $startOfMonth = now()->startOfMonth();

    $leads = $user->leads();
    $totalLeads = (clone $leads)->count();
    $newThisMonth = (clone $leads)->where('created_at', '>=', $startOfMonth)->count();
    $closedThisMonth = (clone $leads)
        ->where('status', 'closed')
        ->where('updated_at', '>=', $startOfMonth)
        ->count();
    $conversionRate = $totalLeads > 0
        ? round(((clone $leads)->where('status', 'closed')->count() / $totalLeads) * 100)
        : 0;

    $recentLeads = (clone $leads)
        ->latest()
        ->limit(5)
        ->get(['id', 'name', 'phone', 'status', 'created_at']);

    $todayReminders = $user->reminders()
        ->with('lead:id,name,phone')
        ->dueToday()
        ->orderBy('due_at')
        ->limit(5)
        ->get();

    $overdueCount = $user->reminders()->overdue()->count();

    return Inertia::render('Dashboard', [
        'stats' => [
            'total_leads' => $totalLeads,
            'new_this_month' => $newThisMonth,
            'closed_this_month' => $closedThisMonth,
            'conversion_rate' => $conversionRate,
        ],
        'recentLeads' => $recentLeads,
        'todayReminders' => $todayReminders,
        'overdueCount' => $overdueCount,
        'statuses' => \App\Enums\LeadStatus::options(),
    ]);
})->middleware(['auth', 'verified'])->name('dashboard');

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    Route::resource('leads', LeadController::class);
    Route::patch('leads/{lead}/status', [LeadController::class, 'updateStatus'])->name('leads.status');
    Route::post('leads/{lead}/notes', [LeadController::class, 'addNote'])->name('leads.notes');

    Route::get('reminders', [ReminderController::class, 'index'])->name('reminders.index');
    Route::post('reminders', [ReminderController::class, 'store'])->name('reminders.store');
    Route::patch('reminders/{reminder}/complete', [ReminderController::class, 'complete'])->name('reminders.complete');
    Route::patch('reminders/{reminder}/snooze', [ReminderController::class, 'snooze'])->name('reminders.snooze');
    Route::patch('reminders/{reminder}/dismiss', [ReminderController::class, 'dismiss'])->name('reminders.dismiss');
    Route::delete('reminders/{reminder}', [ReminderController::class, 'destroy'])->name('reminders.destroy');

    Route::resource('templates', TemplateController::class)->except(['show']);

    Route::get('analytics', [AnalyticsController::class, 'index'])->name('analytics.index');

    Route::get('pricing', [BillingController::class, 'pricing'])->name('billing.pricing');
    Route::post('billing/checkout/{plan}', [BillingController::class, 'checkout'])->name('billing.checkout');
    Route::get('billing/return/{payment}', [BillingController::class, 'return'])->name('billing.return');

    Route::get('store', [StoreController::class, 'index'])->name('store.index');
    Route::get('store/{pack:slug}', [StoreController::class, 'show'])->name('store.show');
    Route::post('store/{pack:slug}/checkout', [StoreController::class, 'checkout'])->name('store.checkout');

    Route::get('affiliate', [AffiliateController::class, 'dashboard'])->name('affiliate.dashboard');
    Route::post('affiliate/opt-in', [AffiliateController::class, 'optIn'])->name('affiliate.opt-in');
    Route::get('affiliate/payouts', [AffiliateController::class, 'payouts'])->name('affiliate.payouts');
    Route::post('affiliate/payouts', [AffiliateController::class, 'requestPayout'])->name('affiliate.payouts.request');
});

// Public referral landing — sets cookie + redirects to register
Route::get('r/{code}', [ReferralController::class, 'landing'])->name('referral.landing');

// Public webhook (no auth, no CSRF — exempted in bootstrap/app.php)
Route::post('billplz/callback', [BillingController::class, 'callback'])->name('billing.callback');

require __DIR__.'/auth.php';
