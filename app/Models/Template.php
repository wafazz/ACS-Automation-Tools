<?php

namespace App\Models;

use App\Enums\Industry;
use Database\Factories\TemplateFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Template extends Model
{
    /** @use HasFactory<TemplateFactory> */
    use HasFactory;

    protected $fillable = [
        'user_id',
        'title',
        'body',
        'industry',
        'is_default',
        'use_count',
    ];

    protected function casts(): array
    {
        return [
            'industry' => Industry::class,
            'is_default' => 'boolean',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
