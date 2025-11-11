<?php
// Smoke test: login as admin then fetch summary counts and live telemetry sample

$loginUrl = 'http://127.0.0.1:8000/api/login';
$telemetryUrl = 'http://127.0.0.1:8000/api/telemetry/live';
$assetsUrl = 'http://127.0.0.1:8000/api/admin/assets';

$loginPayload = json_encode([
    'email' => 'admin@fleetfi.com',
    'password' => 'Fleet@123'
]);

function postJson($url, $json, $headers = []) {
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    $h = array_merge(['Content-Type: application/json','Accept: application/json'], $headers);
    curl_setopt($ch, CURLOPT_HTTPHEADER, $h);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $json);
    $res = curl_exec($ch);
    $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    return [$code, $res];
}

function getAuth($url, $token) {
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Authorization: Bearer ' . $token,
        'Accept: application/json'
    ]);
    $res = curl_exec($ch);
    $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    return [$code, $res];
}

list($loginCode, $loginRes) = postJson($loginUrl, $loginPayload);
if ($loginCode !== 200) {
    echo "LOGIN FAILED ($loginCode): $loginRes\n";
    exit(1);
}
$loginJson = json_decode($loginRes, true);
$token = $loginJson['token'] ?? null;
if (!$token) { echo "No token in login response\n"; exit(1);}

list($teleCode, $teleRes) = getAuth($telemetryUrl, $token);
list($assetCode, $assetRes) = getAuth($assetsUrl, $token);

echo "Admin token: $token\n";
echo "Telemetry Live (HTTP $teleCode):\n";
echo substr($teleRes,0,600) . (strlen($teleRes)>600?"...\n":"\n");
echo "Assets (HTTP $assetCode) sample:\n";
echo substr($assetRes,0,400) . (strlen($assetRes)>400?"...\n":"\n");
echo "Done.\n";
