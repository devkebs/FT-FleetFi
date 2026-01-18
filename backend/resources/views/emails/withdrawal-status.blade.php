@extends('emails.layout')

@section('title', 'Withdrawal Status - FleetFi')

@section('content')
<h2>Withdrawal Request Update</h2>

<p>Dear {{ $userName }},</p>

@if(in_array($status, ['approved', 'completed']))
<div class="success-box">
    <strong>Withdrawal Approved!</strong><br>
    Your withdrawal request has been approved and is being processed.
</div>

<div style="text-align: center; background-color: #e8f5e9; padding: 30px; border-radius: 8px; margin: 20px 0;">
    <p style="margin: 0; font-size: 14px; color: #666;">Amount</p>
    <p style="margin: 10px 0; font-size: 36px; font-weight: 700; color: #4caf50;">&#8358;{{ $amount }}</p>
    <p style="margin: 0; font-size: 12px; color: #999;">Will be credited to your bank account</p>
</div>

<p>
    <strong>Processing Time:</strong> Your funds will typically arrive in your bank account within
    1-3 business days, depending on your bank's processing time.
</p>

<p>
    You will receive a confirmation once the transfer is complete.
</p>

@elseif($status === 'rejected')
<div class="error-box">
    <strong>Withdrawal Request Declined</strong><br>
    Unfortunately, we were unable to process your withdrawal request.
</div>

<div style="text-align: center; background-color: #ffebee; padding: 30px; border-radius: 8px; margin: 20px 0;">
    <p style="margin: 0; font-size: 14px; color: #666;">Requested Amount</p>
    <p style="margin: 10px 0; font-size: 36px; font-weight: 700; color: #f44336;">&#8358;{{ $amount }}</p>
    <p style="margin: 0; font-size: 12px; color: #999;">Has been refunded to your wallet</p>
</div>

@if($reason)
<p><strong>Reason:</strong> {{ $reason }}</p>
@endif

<p>
    The requested amount has been returned to your FleetFi wallet. You can review your account
    and submit a new withdrawal request if needed.
</p>

<p>
    Common reasons for declined withdrawals:
</p>
<ul>
    <li>Incomplete KYC verification</li>
    <li>Invalid bank account details</li>
    <li>Suspicious activity detected</li>
    <li>Account verification required</li>
</ul>

@elseif($status === 'pending')
<div class="highlight-box">
    <strong>Withdrawal Request Received</strong><br>
    Your withdrawal request is being reviewed by our team.
</div>

<div style="text-align: center; background-color: #e8f4fd; padding: 30px; border-radius: 8px; margin: 20px 0;">
    <p style="margin: 0; font-size: 14px; color: #666;">Requested Amount</p>
    <p style="margin: 10px 0; font-size: 36px; font-weight: 700; color: #1a73e8;">&#8358;{{ $amount }}</p>
    <p style="margin: 0; font-size: 12px; color: #999;">Processing...</p>
</div>

<p>
    We typically process withdrawals within 24-48 hours. You'll receive an email notification
    once your withdrawal is approved.
</p>

@else
<div class="highlight-box">
    <strong>Status: {{ ucfirst($status) }}</strong><br>
    Your withdrawal request status has been updated.
</div>

<p><strong>Amount:</strong> &#8358;{{ $amount }}</p>

@if($reason)
<p><strong>Additional Information:</strong> {{ $reason }}</p>
@endif
@endif

<div style="text-align: center; margin: 30px 0;">
    <a href="{{ $walletUrl }}" class="btn">View Your Wallet</a>
</div>

<p>
    If you have any questions about your withdrawal, please don't hesitate to
    <a href="{{ config('app.frontend_url') }}/contact">contact our support team</a>.
</p>

<p>
    Best regards,<br>
    <strong>The FleetFi Finance Team</strong>
</p>
@endsection
