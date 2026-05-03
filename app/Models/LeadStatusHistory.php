<?php

namespace App\Models;

use App\Enums\LeadStatus;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LeadStatusHistory extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'lead_id',
        'changed_by',
        'from_status',
        'to_status',
        'note',
    ];

    protected function casts(): array
    {
        return [
            'from_status' => LeadStatus::class,
            'to_status' => LeadStatus::class,
            'created_at' => 'datetime',
        ];
    }

    protected static function booted(): void
    {
        static::creating(function (self $entry) {
            $entry->created_at ??= now();
        });
    }

    public function lead(): BelongsTo
    {
        return $this->belongsTo(Lead::class);
    }

    public function changer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'changed_by');
    }
}
