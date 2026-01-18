@extends('emails.layout')

@section('title', 'Response to Your Inquiry - FleetFi')

@section('content')
<h2>Response to Your Inquiry</h2>

<p>Dear {{ $userName }},</p>

<p>
    Thank you for contacting FleetFi. We appreciate your interest in our platform and are happy
    to respond to your inquiry.
</p>

<div class="highlight-box">
    <strong>Your Original Message:</strong><br>
    <p style="margin-top: 10px; font-style: italic; color: #666;">
        "{{ $originalMessage }}"
    </p>
</div>

<h3>Our Response:</h3>

<div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
    {!! nl2br(e($responseText)) !!}
</div>

<div class="divider"></div>

<p>
    If you have any additional questions or need further clarification, please don't hesitate
    to reach out to us again.
</p>

<h3>Quick Links</h3>
<ul>
    <li><a href="{{ $websiteUrl }}">Visit FleetFi</a></li>
    <li><a href="{{ $websiteUrl }}/about">Learn About Us</a></li>
    <li><a href="{{ $websiteUrl }}/contact">Contact Support</a></li>
</ul>

<p>
    Thank you for your interest in FleetFi!
</p>

<p>
    Best regards,<br>
    <strong>The FleetFi Support Team</strong>
</p>
@endsection
