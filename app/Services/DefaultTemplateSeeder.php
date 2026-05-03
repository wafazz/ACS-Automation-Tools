<?php

namespace App\Services;

use App\Models\Template;
use App\Models\User;

class DefaultTemplateSeeder
{
    /**
     * Seed industry-specific starter templates for a brand new user.
     * Idempotent: skips users who already have templates.
     */
    public static function seedFor(User $user): void
    {
        if ($user->templates()->exists()) {
            return;
        }

        $industry = $user->industry?->value;
        $packs = self::libraryFor($industry);

        foreach ($packs as $tpl) {
            Template::create([
                'user_id' => $user->id,
                'title' => $tpl['title'],
                'body' => $tpl['body'],
                'industry' => $industry,
                'is_default' => true,
            ]);
        }
    }

    /**
     * @return array<int, array{title: string, body: string}>
     */
    private static function libraryFor(?string $industry): array
    {
        return match ($industry) {
            'takaful', 'insurance' => [
                [
                    'title' => 'Initial Greeting',
                    'body' => "Hi {first_name}, terima kasih sebab tunjuk minat dengan plan kami. Saya {agent_first}, agent rasmi. Boleh kita borak sekejap untuk saya share details?",
                ],
                [
                    'title' => 'Day-3 Follow-up',
                    'body' => "Hi {first_name}, just nak check-in. Ada apa-apa soalan tentang plan yang saya share hari tu? Saya boleh terangkan in detail kalau perlu.",
                ],
                [
                    'title' => 'Quote Ready',
                    'body' => "Hi {first_name}, quote untuk plan dah siap. Premium: {amount} sebulan. Boleh kita schedule call atau meeting untuk discuss?",
                ],
                [
                    'title' => 'Closing Nudge',
                    'body' => "Hi {first_name}, dah review quote yang saya hantar? Kalau ok, kita boleh proceed dengan signup terus. Bila masa convenient untuk you?",
                ],
            ],
            'property' => [
                [
                    'title' => 'Initial Greeting',
                    'body' => "Hi {first_name}, terima kasih untuk interest di property kami. Saya {agent_first}. Bila masa convenient untuk viewing this week?",
                ],
                [
                    'title' => 'Viewing Reminder',
                    'body' => "Hi {first_name}, just nak confirm viewing kita. See you there! Sebarang perubahan, sila WhatsApp saya: {agent_phone}.",
                ],
                [
                    'title' => 'Post-Viewing Follow-up',
                    'body' => "Hi {first_name}, terima kasih sebab luangkan masa viewing semalam. Ada apa-apa soalan tentang property tu? I'm happy to help.",
                ],
                [
                    'title' => 'Closing — Offer Ready',
                    'body' => "Hi {first_name}, owner dah ready untuk discuss offer anda. Boleh kita schedule call dengan mereka esok?",
                ],
            ],
            'auto' => [
                [
                    'title' => 'Test Drive Invite',
                    'body' => "Hi {first_name}, terima kasih untuk inquiry. Bila masa convenient untuk test drive? Saya boleh book slot untuk you.",
                ],
                [
                    'title' => 'Quote & Trade-in Info',
                    'body' => "Hi {first_name}, quote untuk kereta dah ready ({amount}). Kalau ada trade-in, boleh share details car lama anda.",
                ],
                [
                    'title' => 'Loan Approval Update',
                    'body' => "Hi {first_name}, just nak update — loan application dah submit. I'll keep you posted dalam 2-3 hari ni.",
                ],
                [
                    'title' => 'Delivery Booking',
                    'body' => "Hi {first_name}, kereta dah ready! Bila masa convenient untuk collect? Saya akan brief on warranty and service schedule.",
                ],
            ],
            'dropship' => [
                [
                    'title' => 'Order Confirmation',
                    'body' => "Hi {first_name}, order anda dah saya terima. Tracking number akan saya update dalam 24 jam. Terima kasih!",
                ],
                [
                    'title' => 'Restock Alert',
                    'body' => "Hi {first_name}, item yang anda nak dah restock! Limited stock — kalau nak grab, sila reply ASAP.",
                ],
                [
                    'title' => 'Promo Update',
                    'body' => "Hi {first_name}, ada promo special untuk loyal customers. Diskaun extra 15% untuk order minggu ni. PM saya untuk details!",
                ],
                [
                    'title' => 'Repeat Order Nudge',
                    'body' => "Hi {first_name}, dah lama tak order. Item favourite anda available kalau nak top-up — reply 'YES' to order!",
                ],
            ],
            default => [
                [
                    'title' => 'Initial Greeting',
                    'body' => "Hi {first_name}, thanks for reaching out. Saya {agent_first}. Bila masa convenient untuk borak more about your needs?",
                ],
                [
                    'title' => 'Follow-up',
                    'body' => "Hi {first_name}, just nak follow-up sebelum tu. Ada apa-apa update from your side? Happy to help anytime.",
                ],
                [
                    'title' => 'Closing Question',
                    'body' => "Hi {first_name}, dah ada decision yet? Kalau ok, kita boleh proceed dengan next step. Reply bila free!",
                ],
            ],
        };
    }
}
