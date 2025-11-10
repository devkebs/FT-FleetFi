<?php

require __DIR__ . '/../vendor/autoload.php';

// Bootstrap Laravel
$app = require __DIR__ . '/../bootstrap/app.php';
\Illuminate\Support\Facades\Artisan::call('simulate:ride');
echo \Illuminate\Support\Facades\Artisan::output();
