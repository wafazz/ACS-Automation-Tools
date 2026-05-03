<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->web(append: [
            \App\Http\Middleware\HandleInertiaRequests::class,
            \Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets::class,
        ]);

        $middleware->validateCsrfTokens(except: [
            'billplz/callback',
        ]);

        $middleware->alias([
            'admin' => \App\Http\Middleware\AdminMiddleware::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        // Branded Inertia error pages for 403/404/419/429/500/503
        $exceptions->respond(function ($response, $exception, $request) {
            // Only intercept Inertia/HTML responses, never JSON/API
            if (! $request->header('X-Inertia') && $request->expectsJson()) {
                return $response;
            }

            $status = $response->getStatusCode();
            if (! in_array($status, [403, 404, 419, 429, 500, 503], true)) {
                return $response;
            }

            // Re-render 419 as fresh visit (avoid the "page expired" loop)
            if ($status === 419) {
                return back()->with('error', 'Session expired — please try again.');
            }

            return \Inertia\Inertia::render('Errors/Error', ['status' => $status])
                ->toResponse($request)
                ->setStatusCode($status);
        });
    })->create();
