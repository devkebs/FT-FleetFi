<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to FleetFi</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
            border-radius: 10px 10px 0 0;
        }
        .content {
            background: #f9f9f9;
            padding: 30px;
            border-radius: 0 0 10px 10px;
        }
        .button {
            display: inline-block;
            padding: 12px 30px;
            background: #667eea;
            color: white;
            text-decoration: none;
            border-radius: 5px;
            margin: 20px 0;
        }
        .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            color: #777;
            font-size: 12px;
        }
        .feature-list {
            list-style: none;
            padding: 0;
        }
        .feature-list li {
            padding: 10px 0;
            padding-left: 30px;
            position: relative;
        }
        .feature-list li:before {
            content: "✓";
            position: absolute;
            left: 0;
            color: #667eea;
            font-weight: bold;
            font-size: 18px;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>Welcome to FleetFi!</h1>
        <p>Tokenized Electric Vehicle Fleet Management</p>
    </div>

    <div class="content">
        <h2>Hello {{ $user->name }}!</h2>

        <p>Welcome to FleetFi - Africa's premier platform for tokenized electric vehicle fleet management and investment.</p>

        <p>Your account has been successfully created. You're now part of a revolutionary ecosystem that's transforming urban mobility and sustainable investment in Africa.</p>

        <h3>What You Can Do:</h3>
        <ul class="feature-list">
            <li><strong>Invest in EV Assets:</strong> Browse and invest in tokenized electric vehicles</li>
            <li><strong>Track Your Portfolio:</strong> Monitor your investments and earnings in real-time</li>
            <li><strong>Earn Passive Income:</strong> Receive daily revenue from your tokenized assets</li>
            <li><strong>Monitor ESG Impact:</strong> Track your environmental contribution</li>
            <li><strong>Access Analytics:</strong> View comprehensive performance dashboards</li>
        </ul>

        <center>
            <a href="{{ config('app.frontend_url') }}/dashboard" class="button">Go to Dashboard</a>
        </center>

        <h3>Next Steps:</h3>
        <ol>
            <li>Complete your KYC verification to unlock full platform access</li>
            <li>Fund your wallet to start investing</li>
            <li>Browse available EV assets in the marketplace</li>
            <li>Make your first investment and start earning!</li>
        </ol>

        <p>If you have any questions, our support team is here to help at <a href="mailto:support@fleetfi.com">support@fleetfi.com</a></p>

        <p>Best regards,<br>
        <strong>The FleetFi Team</strong></p>
    </div>

    <div class="footer">
        <p>&copy; {{ date('Y') }} FleetFi. All rights reserved.</p>
        <p>This email was sent to {{ $user->email }}</p>
        <p>FleetFi - Tokenizing Africa's Clean Energy Future</p>
    </div>
</body>
</html>
