<?php

namespace App\Models;

use App\Enums\Industry;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class TemplatePack extends Model
{
    protected $fillable = [
        'slug',
        'name',
        'industry',
        'price_cents',
        'description',
        'icon',
        'is_active',
        'purchase_count',
    ];

    protected function casts(): array
    {
        return [
            'industry' => Industry::class,
            'is_active' => 'boolean',
        ];
    }

    public function items(): HasMany
    {
        return $this->hasMany(TemplatePackItem::class)->orderBy('sort_order');
    }

    public function owners(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'user_template_packs')
            ->withPivot(['payment_id', 'purchased_at'])
            ->withTimestamps();
    }

    public function priceMyr(): float
    {
        return $this->price_cents / 100;
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }
}
