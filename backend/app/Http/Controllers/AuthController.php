<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Wallet;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;

class AuthController extends Controller
{
	public function register(Request $request)
	{
		$data = $request->only(['name', 'email', 'password', 'phone', 'role']);

		$validator = Validator::make($data, [
			'name' => 'required|string|max:255',
			'email' => 'required|email|unique:users,email',
			'password' => 'required|string|min:6',
			'phone' => 'nullable|string|max:20',
			'role' => 'required|in:investor,operator,driver,admin',
		]);

		if ($validator->fails()) {
			return response()->json(['errors' => $validator->errors()], 422);
		}

		try {
			DB::beginTransaction();

			// Create user
			$user = User::create([
				'name' => $data['name'],
				'email' => $data['email'],
				'password' => Hash::make($data['password']),
				'role' => $data['role'],
			]);

			// Automatically create wallet for user (Trovotech Integration)
			$wallet = Wallet::create([
				'user_id' => $user->id,
				'wallet_address' => '0x' . Str::random(40),
				'trovotech_wallet_id' => 'TROVO_' . Str::random(16),
				'balance' => 0,
				'status' => 'active'
			]);

			DB::commit();

			$token = $user->createToken('api-token')->plainTextToken;

			return response()->json([
				'user' => $user,
				'wallet' => $wallet,
				'token' => $token
			], 201);
		} catch (\Exception $e) {
			DB::rollBack();
			return response()->json([
				'message' => 'Registration failed',
				'error' => $e->getMessage()
			], 500);
		}
	}

	public function login(Request $request)
	{
		$credentials = $request->only(['email', 'password', 'role']);

		$validator = Validator::make($credentials, [
			'email' => 'required|email',
			'password' => 'required|string',
			'role' => 'nullable|in:investor,operator,driver,admin',
		]);

		if ($validator->fails()) {
			return response()->json(['errors' => $validator->errors()], 422);
		}

		$user = User::where('email', $credentials['email'])->first();

		if (! $user || ! Hash::check($credentials['password'], $user->password)) {
			return response()->json(['message' => 'Invalid credentials'], 401);
		}

		// If a role is provided, ensure it matches the user's role
		if (!empty($credentials['role']) && $user->role && $user->role !== $credentials['role']) {
			return response()->json(['message' => 'Selected role does not match your account'], 403);
		}

		$token = $user->createToken('api-token')->plainTextToken;

		return response()->json(['user' => $user, 'token' => $token]);
	}

	public function logout(Request $request)
	{
		$request->user()->currentAccessToken()->delete();
		return response()->json(['message' => 'Successfully logged out']);
	}

	public function forgotPassword(Request $request)
	{
		$validator = Validator::make($request->only('email'), [
			'email' => 'required|email',
		]);

		if ($validator->fails()) {
			return response()->json(['errors' => $validator->errors()], 422);
		}

		$status = Password::sendResetLink(
			$request->only('email')
		);

		if ($status === Password::RESET_LINK_SENT) {
			return response()->json(['message' => 'Password reset link sent to your email']);
		}

		return response()->json(['message' => 'Unable to send reset link'], 400);
	}

	public function resetPassword(Request $request)
	{
		$validator = Validator::make($request->all(), [
			'token' => 'required',
			'email' => 'required|email',
			'password' => 'required|string|min:8|confirmed',
		]);

		if ($validator->fails()) {
			return response()->json(['errors' => $validator->errors()], 422);
		}

		$status = Password::reset(
			$request->only('email', 'password', 'password_confirmation', 'token'),
			function (User $user, string $password) {
				$user->forceFill([
					'password' => Hash::make($password),
					'remember_token' => Str::random(60),
				])->save();
			}
		);

		if ($status === Password::PASSWORD_RESET) {
			return response()->json(['message' => 'Password has been reset successfully']);
		}

		return response()->json(['message' => 'Unable to reset password'], 400);
	}
}
