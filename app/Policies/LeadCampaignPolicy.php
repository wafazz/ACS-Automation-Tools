<?php

namespace App\Policies;

use App\Models\LeadCampaign;
use App\Models\User;

class LeadCampaignPolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, LeadCampaign $campaign): bool
    {
        return $user->id === $campaign->user_id;
    }

    public function create(User $user): bool
    {
        return true;
    }

    public function update(User $user, LeadCampaign $campaign): bool
    {
        return $user->id === $campaign->user_id;
    }

    public function delete(User $user, LeadCampaign $campaign): bool
    {
        return $user->id === $campaign->user_id;
    }
}
