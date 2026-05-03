<?php

namespace App\Services;

use App\Models\ServiceSetting;
use Illuminate\Support\Facades\Cache;

/**
 * Reads/writes service-level settings stored in the encrypted service_settings table.
 *
 * Two scopes:
 *   - Global (user_id = null) — admin-managed platform settings
 *   - Per-user (user_id = N)  — subscriber-managed automation settings
 *
 * Resolution order for `get($service, $userId)`:
 *   1. Per-user row (if $userId provided AND row exists AND is_enabled)
 *   2. Global row (if exists AND is_enabled)
 *   3. Empty array (caller should fall back to env() / config())
 *
 * Cached per-request to avoid repeat decryption.
 */
class SettingService
{
    private const CACHE_TTL = 60; // seconds

    /**
     * Get the resolved settings for a service. If $userId is provided, prefer the
     * user's own settings, falling back to global. If $userId is null, only check global.
     *
     * @return array<string, mixed>
     */
    public function get(string $service, ?int $userId = null): array
    {
        if ($userId !== null) {
            $userSettings = $this->fetch($service, $userId);
            if ($userSettings !== null) {
                return $userSettings;
            }
        }

        $globalSettings = $this->fetch($service, null);
        return $globalSettings ?? [];
    }

    /**
     * Strict per-user fetch — does NOT fall back to global. Useful when the
     * caller wants to know "does THIS user have it configured?".
     *
     * @return array<string, mixed>
     */
    public function getForUser(int $userId, string $service): array
    {
        return $this->fetch($service, $userId) ?? [];
    }

    public function value(string $service, string $key, mixed $default = null, ?int $userId = null): mixed
    {
        $settings = $this->get($service, $userId);
        $value = $settings[$key] ?? null;

        if ($value === null || $value === '') {
            return $default;
        }

        return $value;
    }

    public function isEnabled(string $service, ?int $userId = null): bool
    {
        $row = ServiceSetting::where('service', $service)
            ->where('user_id', $userId)
            ->first();
        return (bool) ($row?->is_enabled);
    }

    /**
     * Upsert settings for a service scoped to a user (or globally if $userId is null).
     *
     * @param  array<string, mixed>  $settings
     */
    public function set(string $service, array $settings, bool $isEnabled, ?int $userId = null, ?int $updatedBy = null): ServiceSetting
    {
        $row = ServiceSetting::updateOrCreate(
            ['service' => $service, 'user_id' => $userId],
            [
                'settings' => $settings,
                'is_enabled' => $isEnabled,
                'updated_by' => $updatedBy,
            ]
        );

        Cache::forget(self::cacheKey($service, $userId));

        return $row;
    }

    public function clearCache(string $service, ?int $userId = null): void
    {
        Cache::forget(self::cacheKey($service, $userId));
    }

    /**
     * @return array<string, mixed>|null  null = no row OR row disabled
     */
    private function fetch(string $service, ?int $userId): ?array
    {
        return Cache::remember(
            self::cacheKey($service, $userId),
            self::CACHE_TTL,
            function () use ($service, $userId) {
                $row = ServiceSetting::where('service', $service)
                    ->where('user_id', $userId)
                    ->first();

                if (! $row || ! $row->is_enabled) {
                    return null;
                }

                $settings = $row->settings;
                if ($settings === null) {
                    return null;
                }

                return is_array($settings) ? $settings : (array) $settings;
            }
        );
    }

    private static function cacheKey(string $service, ?int $userId): string
    {
        $scope = $userId === null ? 'global' : "user.{$userId}";
        return "service_settings.{$service}.{$scope}";
    }
}
