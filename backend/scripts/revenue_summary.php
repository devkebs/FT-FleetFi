<?php

require __DIR__ . '/../vendor/autoload.php';

$app = require __DIR__ . '/../bootstrap/app.php';

// Bootstrap the console kernel to initialize Eloquent and providers
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$controller = new App\Http\Controllers\OperationsController();
$response = $controller->revenueSummary();

header('Content-Type: application/json');
echo $response->getContent();
