<?php

namespace App\Services;

use App\Models\ServiceSetting;
use Illuminate\Support\Facades\Cache;

/**
 * Reads/writes service-level settings stored in the encrypted service_settings table.
 *
 * Resolution order for any value:
 *   1. DB row (if service has a settings entry)
 *   2. config()/env() fallback (provided by caller)
 *
 * Cached per-request to avoid repeat decryption.
 */
class SettingService
{
    private const CACHE_TTL = 60; // seconds — short, since admin can change at any moment

    /**
     * Get the full settings payload for a service. Returns [] if not configured.
     *
     * @return array<string, mixed>
     */
    public function get(string $service): array
    {
        return Cache::remember(self::cacheKey($service), self::CACHE_TTL, function () use ($service) {
            $row = ServiceSetting::where('service', $service)->first();
            if (! $row || ! $row->is_enabled) {
                return [];
            }

            $settings = $row->settings;
            if ($settings === null) {
                return [];
            }

            // ArrayObject -> plain array
            return is_array($settings) ? $settings : (array) $settings;
        });
    }

    /**
     * Get one value from a service's settings, with fallback.
     */
    public function value(string $service, string $key, mixed $default = null): mixed
    {
        $settings = $this->get($service);
        $value = $settings[$key] ?? null;

        if ($value === null || $value === '') {
            return $default;
        }

        return $value;
    }

    public function isEnabled(string $service): bool
    {
        $row = ServiceSetting::where('service', $service)->first();
        return (bool) ($row?->is_enabled);
    }

    /**
     * Upsert settings for a service.
     *
     * @param  array<string, mixed>  $settings
     */
    public function set(string $service, array $settings, bool $isEnabled, ?int $userId = null): ServiceSetting
    {
        $row = ServiceSetting::updateOrCreate(
            ['service' => $service],
            [
                'settings' => $settings,
                'is_enabled' => $isEnabled,
                'updated_by' => $userId,
            ]
        );

        Cache::forget(self::cacheKey($service));

        return $row;
    }

    public function clearCache(string $service): void
    {
        Cache::forget(self::cacheKey($service));
    }

    private static function cacheKey(string $service): string
    {
        return "service_settings.{$service}";
    }
}
