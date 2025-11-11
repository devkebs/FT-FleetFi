<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Investment Confirmation</title>
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
            background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
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
        .success-badge {
            background: #38ef7d;
            color: white;
            padding: 5px 15px;
            border-radius: 20px;
            display: inline-block;
            font-weight: bold;
        }
        .investment-details {
            background: white;
            padding: 20px;
            border-radius: 5px;
            margin: 20px 0;
            border-left: 4px solid #11998e;
        }
        .detail-row {
            display: flex;
            justify-content: space-between;
            padding: 10px 0;
            border-bottom: 1px solid #eee;
        }
        .detail-row:last-child {
            border-bottom: none;
        }
        .button {
            display: inline-block;
            padding: 12px 30px;
            background: #11998e;
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
    </style>
</head>
<body>
    <div class="header">
        <h1>🎉 Investment Confirmed!</h1>
        <p class="success-badge">Successful</p>
    </div>

    <div class="content">
        <h2>Congratulations, {{ $user->name }}!</h2>

        <p>Your investment in <strong>{{ $investment['asset_name'] }}</strong> has been successfully processed.</p>

        <div class="investment-details">
            <h3>Investment Details</h3>

            <div class="detail-row">
                <span><strong>Asset:</strong></span>
                <span>{{ $investment['asset_name'] }}</span>
            </div>

            <div class="detail-row">
                <span><strong>Vehicle Registration:</strong></span>
                <span>{{ $investment['vehicle_registration'] }}</span>
            </div>

            <div class="detail-row">
                <span><strong>Investment Amount:</strong></span>
                <span><strong>₦{{ number_format($investment['amount'], 2) }}</strong></span>
            </div>

            <div class="detail-row">
                <span><strong>Tokens Received:</strong></span>
                <span><strong>{{ number_format($investment['tokens']) }} tokens</strong></span>
            </div>

            <div class="detail-row">
                <span><strong>Token Price:</strong></span>
                <span>₦{{ number_format($investment['token_price'], 2) }}</span>
            </div>

            <div class="detail-row">
                <span><strong>Transaction ID:</strong></span>
                <span><code>{{ $investment['transaction_id'] }}</code></span>
            </div>

            <div class="detail-row">
                <span><strong>Date:</strong></span>
                <span>{{ date('F j, Y g:i A', strtotime($investment['created_at'])) }}</span>
            </div>

            <div class="detail-row">
                <span><strong>Status:</strong></span>
                <span class="success-badge">Active</span>
            </div>
        </div>

        <h3>What Happens Next?</h3>
        <ul>
            <li>Your tokens are now active and generating revenue</li>
            <li>Daily earnings will be credited to your wallet</li>
            <li>You can track performance in your Investment Portfolio</li>
            <li>Revenue distributions occur every 24 hours</li>
        </ul>

        <h3>Expected Returns:</h3>
        <div class="investment-details">
            <div class="detail-row">
                <span>Projected Annual ROI:</span>
                <span><strong>{{ $investment['projected_roi'] }}%</strong></span>
            </div>
            <div class="detail-row">
                <span>Est. Monthly Revenue:</span>
                <span><strong>₦{{ number_format($investment['estimated_monthly_revenue'], 2) }}</strong></span>
            </div>
            <div class="detail-row">
                <span>Est. Annual Revenue:</span>
                <span><strong>₦{{ number_format($investment['estimated_annual_revenue'], 2) }}</strong></span>
            </div>
        </div>

        <center>
            <a href="{{ config('app.frontend_url') }}/portfolio" class="button">View Portfolio</a>
        </center>

        <p><strong>Thank you for investing in Africa's clean energy future!</strong></p>

        <p>Best regards,<br>
        <strong>The FleetFi Team</strong></p>
    </div>

    <div class="footer">
        <p>&copy; {{ date('Y') }} FleetFi. All rights reserved.</p>
        <p>This email was sent to {{ $user->email }}</p>
        <p>Need help? Contact <a href="mailto:support@fleetfi.com">support@fleetfi.com</a></p>
    </div>
</body>
</html>
