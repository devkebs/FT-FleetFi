@extends('emails.layout')

@section('title', 'Investment Confirmed - FleetFi')

@section('content')
<h2>Investment Confirmation</h2>

<p>Dear {{ $userName }},</p>

<div class="success-box">
    <strong>Your investment has been confirmed!</strong><br>
    You are now a proud owner of tokenized EV fleet assets.
</div>

<h3>Investment Details</h3>

<table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
    <tr style="background-color: #f5f5f5;">
        <td style="padding: 12px; border: 1px solid #ddd;"><strong>Asset</strong></td>
        <td style="padding: 12px; border: 1px solid #ddd;">{{ $assetName }}</td>
    </tr>
    <tr>
        <td style="padding: 12px; border: 1px solid #ddd;"><strong>Investment Amount</strong></td>
        <td style="padding: 12px; border: 1px solid #ddd;">&#8358;{{ $amount }}</td>
    </tr>
    <tr style="background-color: #f5f5f5;">
        <td style="padding: 12px; border: 1px solid #ddd;"><strong>Tokens Received</strong></td>
        <td style="padding: 12px; border: 1px solid #ddd;">{{ $tokens }} tokens</td>
    </tr>
    <tr>
        <td style="padding: 12px; border: 1px solid #ddd;"><strong>Expected Annual Return</strong></td>
        <td style="padding: 12px; border: 1px solid #ddd;">{{ $expectedReturn }}</td>
    </tr>
</table>

<div class="highlight-box">
    <strong>Your Tokens are Secured</strong><br>
    Your ownership tokens are recorded on the blockchain, ensuring transparency and security.
    You can view your token details in your portfolio.
</div>

<h3>What Happens Next?</h3>
<ul>
    <li><strong>Dividend Distribution:</strong> You'll receive your share of revenue monthly based on your ownership percentage.</li>
    <li><strong>Real-time Tracking:</strong> Monitor your asset's performance and earnings in your dashboard.</li>
    <li><strong>Reinvest or Withdraw:</strong> You can reinvest your earnings or withdraw to your bank account.</li>
</ul>

<div style="text-align: center; margin: 30px 0;">
    <a href="{{ $portfolioUrl }}" class="btn">View Your Portfolio</a>
</div>

<p>
    Thank you for investing in sustainable transportation with FleetFi!
</p>

<p>
    Best regards,<br>
    <strong>The FleetFi Investment Team</strong>
</p>
@endsection
