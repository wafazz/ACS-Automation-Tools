<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TemplatePackItem extends Model
{
    protected $fillable = [
        'template_pack_id',
        'title',
        'body',
        'sort_order',
    ];

    public function pack(): BelongsTo
    {
        return $this->belongsTo(TemplatePack::class, 'template_pack_id');
    }
}
