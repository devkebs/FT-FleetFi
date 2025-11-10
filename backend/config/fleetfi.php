<?php

return [
    'revenue' => [
        // Base revenue rate per kilometer for simulation (can be overridden via .env)
        'base_rate_per_km' => env('FLEETFI_BASE_RATE_PER_KM', 1.25),
        'splits' => [
            'investor_roi_pct' => env('FLEETFI_INVESTOR_ROI_PCT', 0.50),
            'rider_wage_pct' => env('FLEETFI_RIDER_WAGE_PCT', 0.30),
            'management_reserve_pct' => env('FLEETFI_MANAGEMENT_RESERVE_PCT', 0.15),
            'maintenance_reserve_pct' => env('FLEETFI_MAINTENANCE_RESERVE_PCT', 0.05),
        ],
    ],
    'blockchain' => [
        'provider' => 'trovotech',
        'chain' => env('FLEETFI_CHAIN', 'bantu-testnet'),
        'api_base' => env('TROVOTECH_API_BASE', 'https://api.trovotech.example'),
        'enabled' => env('TROVOTECH_ENABLED', false),
        'notes' => 'Placeholder configuration for upcoming TrovoTech Bantu chain integration.',
    ],
];
