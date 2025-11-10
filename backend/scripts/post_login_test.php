<?php
// Simple script to POST JSON to the local Laravel login endpoint and print response
$url = 'http://127.0.0.1:8000/api/login';
// Switch target user easily by editing below
$data = [
    'email' => getenv('LOGIN_EMAIL') ?: 'investor1@fleetfi.local',
    'password' => getenv('LOGIN_PASSWORD') ?: 'Password123!',
];
$payload = json_encode($data);

$ch = curl_init($url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, ["Content-Type: application/json"]);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, $payload);

$response = curl_exec($ch);
$err = curl_error($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

echo "HTTP_CODE: $httpCode\n";
if ($err) {
    echo "CURL_ERR: $err\n";
}

if ($response) {
    echo "RESPONSE:\n";
    echo $response . PHP_EOL;
}
