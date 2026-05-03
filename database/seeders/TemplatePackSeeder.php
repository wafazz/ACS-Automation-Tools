<?php

namespace Database\Seeders;

use App\Models\TemplatePack;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class TemplatePackSeeder extends Seeder
{
    use WithoutModelEvents;

    public function run(): void
    {
        foreach (self::definitions() as $def) {
            $pack = TemplatePack::updateOrCreate(
                ['slug' => $def['slug']],
                [
                    'name' => $def['name'],
                    'industry' => $def['industry'],
                    'price_cents' => $def['price_cents'],
                    'description' => $def['description'],
                    'icon' => $def['icon'],
                    'is_active' => true,
                ]
            );

            // Replace items so re-seed picks up edits
            $pack->items()->delete();
            foreach ($def['items'] as $i => $item) {
                $pack->items()->create([
                    'title' => $item['title'],
                    'body' => $item['body'],
                    'sort_order' => $i + 1,
                ]);
            }
        }
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private static function definitions(): array
    {
        return [
            [
                'slug' => 'takaful-starter',
                'name' => 'Takaful Closing Pack',
                'industry' => 'takaful',
                'price_cents' => 2900,
                'description' => '12 proven WhatsApp scripts for takaful agents — covers introduction, follow-up, objection handling, and closing.',
                'icon' => 'bi-shield-check',
                'items' => self::takafulItems(),
            ],
            [
                'slug' => 'property-starter',
                'name' => 'Property Agent Pack',
                'industry' => 'property',
                'price_cents' => 2900,
                'description' => '12 ready-to-send WhatsApp scripts for property agents — viewing invites, post-viewing follow-up, offer negotiation, and closing nudges.',
                'icon' => 'bi-house',
                'items' => self::propertyItems(),
            ],
            [
                'slug' => 'auto-starter',
                'name' => 'Automotive Sales Pack',
                'industry' => 'auto',
                'price_cents' => 2900,
                'description' => '12 high-converting WhatsApp scripts for automotive agents — test drive booking, financing updates, trade-in offers, delivery scheduling.',
                'icon' => 'bi-car-front',
                'items' => self::autoItems(),
            ],
            [
                'slug' => 'dropship-starter',
                'name' => 'Dropship & Reseller Pack',
                'industry' => 'dropship',
                'price_cents' => 2900,
                'description' => '12 conversion-focused WhatsApp scripts for dropshippers and resellers — order confirmations, restock alerts, promo blasts, repeat-customer reactivation.',
                'icon' => 'bi-bag-check',
                'items' => self::dropshipItems(),
            ],
        ];
    }

    /**
     * @return array<int, array{title: string, body: string}>
     */
    private static function takafulItems(): array
    {
        return [
            ['title' => 'Welcome — First Touch', 'body' => "Hi {first_name}, terima kasih sebab tunjuk minat dengan plan takaful kami. Saya {agent_first}, agent rasmi. Boleh kita borak sekejap?"],
            ['title' => 'Day-1 Check-in', 'body' => "Hi {first_name}, just nak follow-up dari semalam. Ada apa-apa soalan tentang plan yang saya share?"],
            ['title' => 'Day-3 Soft Nudge', 'body' => "Hi {first_name}, hope you're doing well. Just nak remind, kalau nak proceed dengan quote tu, tolong reply 'OK' ya."],
            ['title' => 'Day-7 Last Touch', 'body' => "Hi {first_name}, ni last reminder dari saya. Kalau dah tak interested, boleh reply 'No' supaya saya tak ganggu lagi. Otherwise, I'm here to help."],
            ['title' => 'Quote Ready', 'body' => "Hi {first_name}, quote untuk plan takaful dah siap. Premium: {amount} sebulan. Coverage termasuk medical card + critical illness. Boleh kita jumpa?"],
            ['title' => 'Family Plan Pitch', 'body' => "Hi {first_name}, kalau nak cover seluruh family, ada plan family takaful yang lagi affordable per kepala. Berminat nak saya breakdown costs?"],
            ['title' => 'Budget Objection', 'body' => "Hi {first_name}, faham concern tentang premium. Sebenarnya kita ada plan starter dari RM 80 sebulan je. Coverage tetap solid. Nak saya share?"],
            ['title' => 'Not Sure Yet', 'body' => "Hi {first_name}, tak masalah kalau perlu masa fikir. Just nak share satu testimonial dari customer yang sebab claim plan ni, dapat save RM 30k masa hospital. Berminat baca?"],
            ['title' => 'Closing Nudge', 'body' => "Hi {first_name}, dah review quote yang saya hantar? Kalau ok, saya boleh hantar form sekarang dan we proceed. Bila masa convenient?"],
            ['title' => 'Document Reminder', 'body' => "Hi {first_name}, untuk proceed dengan signup, sila prepare: IC copy, slip gaji 3 bulan, dan nominee details. Hantar bila ready ya."],
            ['title' => 'Welcome Aboard', 'body' => "Hi {first_name}, congrats and terima kasih sebab choose us! Plan dah active. Polisi akan sampai dalam 5-7 hari kerja. Save my number untuk any future questions."],
            ['title' => 'Renewal Reminder', 'body' => "Hi {first_name}, renewal premium akan due bulan depan. Auto-debit dah set up. Kalau ada perubahan account bank, sila inform sebelum {amount}."],
        ];
    }

    /**
     * @return array<int, array{title: string, body: string}>
     */
    private static function propertyItems(): array
    {
        return [
            ['title' => 'Initial Greeting', 'body' => "Hi {first_name}, terima kasih untuk interest di property kami. Saya {agent_first}. Bila masa convenient untuk viewing this week?"],
            ['title' => 'Viewing Confirmation', 'body' => "Hi {first_name}, just nak confirm viewing kita. See you there! Address: [insert]. Sebarang perubahan, WhatsApp saya: {agent_phone}."],
            ['title' => 'Post-Viewing Follow-up', 'body' => "Hi {first_name}, terima kasih sebab luangkan masa viewing semalam. Apa pendapat? Ada apa-apa concerns or questions tentang unit tu?"],
            ['title' => 'Owner Decision Update', 'body' => "Hi {first_name}, owner dah confirm — they're open untuk discuss your offer. Let me know berapa offer anda dan I'll negotiate."],
            ['title' => 'Counter-Offer Response', 'body' => "Hi {first_name}, owner counter at {amount}. Dah saya negotiate down dari original asking. Berminat untuk proceed?"],
            ['title' => 'Loan Pre-approval Reminder', 'body' => "Hi {first_name}, untuk speed up process, please get pre-approval letter dari bank dulu. Boleh saya recommend banker yang specialize dalam property loans?"],
            ['title' => 'Document Checklist', 'body' => "Hi {first_name}, untuk SPA, please prepare: IC copy (both parties), slip gaji 3 months, EA form latest, dan booking fee 2-3% of price."],
            ['title' => 'Hot Lead Re-engage', 'body' => "Hi {first_name}, ada unit serupa baru released — same area, lower floor but RM 30k cheaper. Berminat untuk view this weekend?"],
            ['title' => 'Closing Push', 'body' => "Hi {first_name}, just nak update — ada another buyer also interested in the same unit. Kalau anda serious, please confirm by tomorrow ya."],
            ['title' => 'Booking Form Sent', 'body' => "Hi {first_name}, booking form dah saya hantar via email. Sila review dan sign, then transfer booking fee. Saya akan handle the rest with developer."],
            ['title' => 'Keys Ready', 'body' => "Hi {first_name}, congrats! VP done dan keys ready for collection. Bila masa convenient untuk handover? Saya boleh ikut for inspection."],
            ['title' => 'Past Client Reactivation', 'body' => "Hi {first_name}, ada beberapa unit baru di area yang anda dulu interested. Some at attractive prices. Nak saya share details?"],
        ];
    }

    /**
     * @return array<int, array{title: string, body: string}>
     */
    private static function autoItems(): array
    {
        return [
            ['title' => 'Test Drive Invite', 'body' => "Hi {first_name}, terima kasih untuk inquiry. Bila masa convenient untuk test drive? Saya boleh book slot untuk you."],
            ['title' => 'Test Drive Confirmation', 'body' => "Hi {first_name}, confirmed test drive on [date/time]. Please bring your IC dan license. See you at our showroom!"],
            ['title' => 'Post-Test-Drive Follow-up', 'body' => "Hi {first_name}, hope you enjoyed the test drive. Apa pendapat tentang the car? Any specific colour or variant in mind?"],
            ['title' => 'Quote with Trade-in', 'body' => "Hi {first_name}, quote for the car: {amount}. Kalau ada trade-in, share details (model, year, mileage) — saya cek best value untuk you."],
            ['title' => 'Loan Application Submitted', 'body' => "Hi {first_name}, loan application dah submit ke 3 banks. Approval typically 2-3 working days. I'll keep you updated."],
            ['title' => 'Loan Approved', 'body' => "Hi {first_name}, good news — loan approved at {amount} per month. Bila masa boleh datang untuk sign agreement?"],
            ['title' => 'Promo Push', 'body' => "Hi {first_name}, promo this month: free service package + tinted + dashcam (worth RM 3k). Limited to first 10 buyers. Berminat?"],
            ['title' => 'Year-End Closing', 'body' => "Hi {first_name}, dealer offering extra discount untuk year-end clearance. Save up to RM 5k kalau register before 31 Dec. Nak saya lock in for you?"],
            ['title' => 'Trade-in Better Offer', 'body' => "Hi {first_name}, dah evaluate your old car. Best offer dari 3 dealers: {amount}. Anda nak proceed dengan trade-in?"],
            ['title' => 'Delivery Booking', 'body' => "Hi {first_name}, kereta dah ready! Bila masa convenient untuk collect? Bring IC + driving license. Saya akan brief on warranty and service schedule."],
            ['title' => 'Service Reminder', 'body' => "Hi {first_name}, just a reminder — first service due bulan depan (10,000 km). Free of charge. Boleh book slot anytime."],
            ['title' => 'Referral Request', 'body' => "Hi {first_name}, hope you're enjoying the new ride! Kalau ada friend or family yang nak car too, please refer them to me — I'll take good care of them."],
        ];
    }

    /**
     * @return array<int, array{title: string, body: string}>
     */
    private static function dropshipItems(): array
    {
        return [
            ['title' => 'Order Confirmation', 'body' => "Hi {first_name}, order anda dah saya terima. Total: {amount}. Tracking number akan saya update dalam 24 jam. Terima kasih!"],
            ['title' => 'Tracking Number Sent', 'body' => "Hi {first_name}, parcel anda dah dispatch! Tracking: [insert]. ETA 2-3 hari. Any issue, just WhatsApp me."],
            ['title' => 'Delivery Confirmation', 'body' => "Hi {first_name}, parcel anda dah delivered. Hope you love the product! Boleh share unboxing pic? Saya tag you next time ada promo."],
            ['title' => 'Restock Alert', 'body' => "Hi {first_name}, item yang anda nak dah restock! Limited stock — kalau nak grab, sila reply ASAP. Same price as before."],
            ['title' => 'Promo Blast', 'body' => "Hi {first_name}, ada promo special untuk loyal customers. Diskaun extra 15% untuk order minggu ni. Code: LOYAL15. PM saya untuk details!"],
            ['title' => 'Repeat Order Nudge', 'body' => "Hi {first_name}, dah lama tak order. Item favourite anda available kalau nak top-up — reply 'YES' to order!"],
            ['title' => 'New Product Launch', 'body' => "Hi {first_name}, just launched new product yang you might love! Early bird price RM 30 off — only for first 50 orders. Berminat tengok pic?"],
            ['title' => 'Bundle Upsell', 'body' => "Hi {first_name}, kalau order 2 pcs, free postage + 10% off. Total save: RM 25. Nak proceed?"],
            ['title' => 'Cart Abandonment', 'body' => "Hi {first_name}, noticed you almost checkout but tak complete. Anything I can help with? Stock still available!"],
            ['title' => 'Pre-order Update', 'body' => "Hi {first_name}, pre-order anda dah arrive di warehouse. Akan dispatch tomorrow. Tracking will be sent once shipped."],
            ['title' => 'Festive Promo', 'body' => "Hi {first_name}, raya/CNY promo dah start! Best sellers diskaun sampai 30%. Limited time — sale ends [date]. Berminat?"],
            ['title' => 'Loyalty Reward', 'body' => "Hi {first_name}, you're a top customer this year! As thank you, free gift + RM 20 voucher untuk next order. Code: VIP2026. Thanks for the support!"],
        ];
    }
}
