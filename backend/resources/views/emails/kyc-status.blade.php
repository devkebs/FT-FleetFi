@extends('emails.layout')

@section('title', 'KYC Verification Status - FleetFi')

@section('content')
<h2>KYC Verification Update</h2>

<p>Dear {{ $userName }},</p>

@if(in_array($status, ['approved', 'verified']))
<div class="success-box">
    <strong>Congratulations!</strong><br>
    Your KYC verification has been approved. You now have full access to all FleetFi features.
</div>

<p>
    With your verified account, you can now:
</p>
<ul>
    <li>Make investments in EV fleet assets</li>
    <li>Withdraw funds to your bank account</li>
    <li>Access premium platform features</li>
    <li>Receive dividend payouts</li>
</ul>

<div style="text-align: center; margin: 30px 0;">
    <a href="{{ $dashboardUrl }}" class="btn">Go to Dashboard</a>
</div>

@elseif($status === 'rejected')
<div class="error-box">
    <strong>Verification Unsuccessful</strong><br>
    Unfortunately, we were unable to verify your identity at this time.
</div>

@if($reason)
<p><strong>Reason:</strong> {{ $reason }}</p>
@endif

<p>
    This could be due to:
</p>
<ul>
    <li>Unclear or unreadable document images</li>
    <li>Document information not matching your profile</li>
    <li>Expired identification documents</li>
    <li>Incomplete information provided</li>
</ul>

<p>
    <strong>What you can do:</strong><br>
    Please log in to your account and resubmit your KYC documents with clear, valid identification.
</p>

<div style="text-align: center; margin: 30px 0;">
    <a href="{{ $dashboardUrl }}" class="btn">Resubmit KYC</a>
</div>

@elseif($status === 'pending')
<div class="highlight-box">
    <strong>Under Review</strong><br>
    Your KYC documents have been received and are being reviewed by our team.
</div>

<p>
    We typically complete verifications within 1-2 business days. We'll notify you via email once
    the review is complete.
</p>

<p>
    While you wait, you can explore the platform and browse available investment opportunities.
</p>

@else
<div class="highlight-box">
    <strong>Status: {{ ucfirst($status) }}</strong><br>
    Your KYC verification status has been updated.
</div>

@if($reason)
<p><strong>Additional Information:</strong> {{ $reason }}</p>
@endif
@endif

<div class="divider"></div>

<p>
    If you have any questions about your verification status, please don't hesitate to
    <a href="{{ config('app.frontend_url') }}/contact">contact our support team</a>.
</p>

<p>
    Best regards,<br>
    <strong>The FleetFi Compliance Team</strong>
</p>
@endsection
