<?php

return [
    'provider' => env('KYC_PROVIDER', 'identitypass'),
    'identitypass' => [
        'api_key' => env('IDENTITYPASS_API_KEY'),
        'base_url' => env('IDENTITYPASS_BASE_URL', 'https://api.theidentitypass.com'),
        'webhook_secret' => env('IDENTITYPASS_WEBHOOK_SECRET'),
    ],
    // Mapping provider statuses to internal statuses
    'status_map' => [
        'in_progress' => 'submitted',
        'processing' => 'submitted',
        'verified' => 'verified',
        'success' => 'verified',
        'failed' => 'rejected',
        'error' => 'rejected',
    ],
];
