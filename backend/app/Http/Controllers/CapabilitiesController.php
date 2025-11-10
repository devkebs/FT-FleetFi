<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class CapabilitiesController extends Controller
{
    /**
     * Return capability flags and allowed actions for the authenticated user based on their role.
     */
    public function index(Request $request)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $role = $user->role ?? 'investor';

        // Define static capability map aligned with current route permissions
        $caps = [
            'investor' => [
                'actions' => [
                    'invest' => true,
                    'viewPortfolio' => true,
                    'manageAssets' => false,
                    'viewTelemetryLive' => false,
                    'scheduleOperations' => false,
                    'viewRiders' => false,
                    'admin' => false,
                ],
                'routes' => [
                    'wallet' => ['create' => true, 'view' => true, 'balance' => true],
                    'tokens' => ['my' => true, 'portfolio' => true],
                    'trovotech' => ['mint' => true, 'wallet' => true, 'metadata' => true],
                    // Investors can list assets to decide what to invest in
                    'assets' => ['index' => true],
                    'telemetry' => ['live' => false],
                ],
            ],
            'operator' => [
                'actions' => [
                    'invest' => true,
                    'viewPortfolio' => true,
                    'manageAssets' => true,
                    'viewTelemetryLive' => true,
                    'scheduleOperations' => true,
                    'viewRiders' => true,
                    'admin' => false,
                ],
                'routes' => [
                    'wallet' => ['create' => true, 'view' => true, 'balance' => true],
                    'tokens' => ['my' => true, 'portfolio' => true],
                    'trovotech' => ['mint' => true, 'wallet' => true, 'metadata' => true, 'payout' => true, 'telemetrySync' => true],
                    'assets' => ['index' => true, 'crud' => true, 'export' => true],
                    'telemetry' => ['live' => true],
                    'operations' => ['schedule' => true],
                    'riders' => ['index' => true, 'assign' => true, 'unassign' => true],
                ],
            ],
            'driver' => [
                'actions' => [
                    'invest' => false,
                    'viewPortfolio' => true,
                    'manageAssets' => false,
                    'viewTelemetryLive' => false,
                    'scheduleOperations' => false,
                    'viewRiders' => false,
                    'admin' => false,
                ],
                'routes' => [
                    'wallet' => ['create' => true, 'view' => true, 'balance' => true],
                    'tokens' => ['my' => true, 'portfolio' => false],
                    'trovotech' => ['mint' => false, 'wallet' => true, 'metadata' => true],
                    'assets' => ['index' => false],
                    'telemetry' => ['live' => false],
                ],
            ],
            'admin' => [
                'actions' => [
                    'invest' => true,
                    'viewPortfolio' => true,
                    'manageAssets' => true,
                    'viewTelemetryLive' => true,
                    'scheduleOperations' => true,
                    'viewRiders' => true,
                    'admin' => true,
                ],
                'routes' => [
                    'admin' => ['overview' => true, 'users' => true, 'config' => true, 'reports' => true],
                    'assets' => ['index' => true, 'crud' => true],
                    'telemetry' => ['live' => true],
                ],
            ],
        ];

        $payload = [
            'role' => $role,
            'capabilities' => $caps[$role]['actions'] ?? [],
            'routes' => $caps[$role]['routes'] ?? [],
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
            ],
        ];

        return response()->json($payload);
    }
}
