<?php

use App\Http\Controllers\Admin\AffiliatesController as AdminAffiliatesController;
use App\Http\Controllers\Admin\PaymentsController as AdminPaymentsController;
use App\Http\Controllers\Admin\SettingsController as AdminSettingsController;
use App\Http\Controllers\Admin\StatsController as AdminStatsController;
use App\Http\Controllers\Admin\TemplatePacksController as AdminTemplatePacksController;
use App\Http\Controllers\Admin\UsersController as AdminUsersController;
use App\Http\Controllers\AffiliateController;
use App\Http\Controllers\AnalyticsController;
use App\Http\Controllers\BillingController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\LeadController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\Settings\AutomationController as UserAutomationController;
use App\Http\Controllers\Settings\IntegrationsController as UserIntegrationsController;
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

Route::get('/dashboard', [DashboardController::class, 'index'])
    ->middleware(['auth', 'verified'])
    ->name('dashboard');

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    Route::resource('leads', LeadController::class);
    Route::patch('leads/{lead}/status', [LeadController::class, 'updateStatus'])->name('leads.status');
    Route::post('leads/{lead}/notes', [LeadController::class, 'addNote'])->name('leads.notes');
    Route::post('leads/{lead}/send/{template}', [LeadController::class, 'sendTemplate'])->name('leads.send');

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

    // Subscriber-facing integration settings (per-user Brevo + Onsend)
    Route::get('settings/brevo', [UserIntegrationsController::class, 'brevo'])->name('settings.brevo');
    Route::patch('settings/brevo', [UserIntegrationsController::class, 'updateBrevo'])->name('settings.brevo.update');
    Route::post('settings/brevo/test', [UserIntegrationsController::class, 'testBrevo'])->name('settings.brevo.test');
    Route::get('settings/onsend', [UserIntegrationsController::class, 'onsend'])->name('settings.onsend');
    Route::patch('settings/onsend', [UserIntegrationsController::class, 'updateOnsend'])->name('settings.onsend.update');
    Route::post('settings/onsend/test', [UserIntegrationsController::class, 'testOnsend'])->name('settings.onsend.test');

    // Per-user automation rules (auto-send Day 1/3/7 reminders via Onsend)
    Route::get('settings/automation', [UserAutomationController::class, 'index'])->name('settings.automation');
    Route::patch('settings/automation', [UserAutomationController::class, 'update'])->name('settings.automation.update');
});

// Admin routes
Route::middleware(['auth', 'admin'])->prefix('admin')->name('admin.')->group(function () {
    Route::get('/', [AdminStatsController::class, 'index'])->name('stats');
    Route::get('users', [AdminUsersController::class, 'index'])->name('users.index');
    Route::patch('users/{user}/plan', [AdminUsersController::class, 'updatePlan'])->name('users.plan');
    Route::patch('users/{user}/admin', [AdminUsersController::class, 'toggleAdmin'])->name('users.admin');
    Route::get('payments', [AdminPaymentsController::class, 'index'])->name('payments.index');
    Route::get('affiliates', [AdminAffiliatesController::class, 'index'])->name('affiliates.index');
    Route::patch('payouts/{payout}/paid', [AdminAffiliatesController::class, 'markPayoutPaid'])->name('payouts.paid');
    Route::patch('payouts/{payout}/reject', [AdminAffiliatesController::class, 'rejectPayout'])->name('payouts.reject');
    Route::get('packs', [AdminTemplatePacksController::class, 'index'])->name('packs.index');
    Route::patch('packs/{pack}', [AdminTemplatePacksController::class, 'update'])->name('packs.update');
    Route::patch('packs/{pack}/active', [AdminTemplatePacksController::class, 'toggleActive'])->name('packs.active');

    // Service settings (Billplz / Brevo / Onsend) — DB-backed encrypted
    Route::get('settings/billplz', [AdminSettingsController::class, 'billplz'])->name('settings.billplz');
    Route::patch('settings/billplz', [AdminSettingsController::class, 'updateBillplz'])->name('settings.billplz.update');
    Route::post('settings/billplz/test', [AdminSettingsController::class, 'testBillplz'])->name('settings.billplz.test');

    Route::get('settings/brevo', [AdminSettingsController::class, 'brevo'])->name('settings.brevo');
    Route::patch('settings/brevo', [AdminSettingsController::class, 'updateBrevo'])->name('settings.brevo.update');
    Route::post('settings/brevo/test', [AdminSettingsController::class, 'testBrevo'])->name('settings.brevo.test');

    Route::get('settings/onsend', [AdminSettingsController::class, 'onsend'])->name('settings.onsend');
    Route::patch('settings/onsend', [AdminSettingsController::class, 'updateOnsend'])->name('settings.onsend.update');
    Route::post('settings/onsend/test', [AdminSettingsController::class, 'testOnsend'])->name('settings.onsend.test');
});

// Public referral landing — sets cookie + redirects to register
Route::get('r/{code}', [ReferralController::class, 'landing'])->name('referral.landing');

// Legal pages
Route::get('privacy', fn () => Inertia::render('Legal/Privacy'))->name('legal.privacy');
Route::get('terms', fn () => Inertia::render('Legal/Terms'))->name('legal.terms');

// Public webhook (no auth, no CSRF — exempted in bootstrap/app.php)
Route::post('billplz/callback', [BillingController::class, 'callback'])->name('billing.callback');

require __DIR__.'/auth.php';
