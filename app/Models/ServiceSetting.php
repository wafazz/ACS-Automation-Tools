<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Casts\AsEncryptedArrayObject;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ServiceSetting extends Model
{
    protected $fillable = [
        'service',
        'settings',
        'is_enabled',
        'updated_by',
    ];

    protected function casts(): array
    {
        return [
            // Encrypted at rest. Column MUST be `text`, not `json` — encrypted
            // payload is a string and MySQL would reject it under JSON validation.
            'settings' => AsEncryptedArrayObject::class,
            'is_enabled' => 'boolean',
        ];
    }

    public function updater(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }
}
