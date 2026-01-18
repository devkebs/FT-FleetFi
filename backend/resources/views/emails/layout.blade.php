<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>@yield('title', 'FleetFi')</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
            background-color: #f5f5f5;
        }
        .email-container {
            max-width: 600px;
            margin: 20px auto;
            background-color: #ffffff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }
        .email-header {
            background: linear-gradient(135deg, #1a73e8 0%, #0d47a1 100%);
            color: #ffffff;
            padding: 30px;
            text-align: center;
        }
        .email-header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: 700;
        }
        .email-header p {
            margin: 10px 0 0;
            opacity: 0.9;
        }
        .email-body {
            padding: 30px;
        }
        .email-body h2 {
            color: #1a73e8;
            margin-top: 0;
        }
        .email-body p {
            margin-bottom: 15px;
        }
        .btn {
            display: inline-block;
            padding: 12px 30px;
            background-color: #1a73e8;
            color: #ffffff !important;
            text-decoration: none;
            border-radius: 5px;
            font-weight: 600;
            margin: 10px 0;
        }
        .btn:hover {
            background-color: #0d47a1;
        }
        .highlight-box {
            background-color: #e8f4fd;
            border-left: 4px solid #1a73e8;
            padding: 15px;
            margin: 20px 0;
            border-radius: 0 5px 5px 0;
        }
        .success-box {
            background-color: #e8f5e9;
            border-left: 4px solid #4caf50;
            padding: 15px;
            margin: 20px 0;
            border-radius: 0 5px 5px 0;
        }
        .warning-box {
            background-color: #fff3e0;
            border-left: 4px solid #ff9800;
            padding: 15px;
            margin: 20px 0;
            border-radius: 0 5px 5px 0;
        }
        .error-box {
            background-color: #ffebee;
            border-left: 4px solid #f44336;
            padding: 15px;
            margin: 20px 0;
            border-radius: 0 5px 5px 0;
        }
        .email-footer {
            background-color: #f5f5f5;
            padding: 20px 30px;
            text-align: center;
            font-size: 12px;
            color: #666;
        }
        .email-footer a {
            color: #1a73e8;
            text-decoration: none;
        }
        .social-links {
            margin: 15px 0;
        }
        .social-links a {
            display: inline-block;
            margin: 0 10px;
            color: #666;
        }
        .divider {
            height: 1px;
            background-color: #eee;
            margin: 20px 0;
        }
        @media only screen and (max-width: 600px) {
            .email-container {
                margin: 0;
                border-radius: 0;
            }
            .email-header, .email-body, .email-footer {
                padding: 20px;
            }
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="email-header">
            <h1>FleetFi</h1>
            <p>Tokenized EV Fleet Investment Platform</p>
        </div>
        <div class="email-body">
            @yield('content')
        </div>
        <div class="email-footer">
            <div class="social-links">
                <a href="#">Twitter</a> |
                <a href="#">LinkedIn</a> |
                <a href="#">Facebook</a>
            </div>
            <div class="divider"></div>
            <p>
                FleetFi - Democratizing EV Fleet Ownership<br>
                Ilorin, Nigeria
            </p>
            <p>
                <a href="{{ config('app.frontend_url') }}">Visit our website</a> |
                <a href="{{ config('app.frontend_url') }}/contact">Contact Support</a>
            </p>
            <p style="font-size: 11px; color: #999;">
                This email was sent to you because you have an account with FleetFi.
                If you didn't request this email, please ignore it or contact support.
            </p>
        </div>
    </div>
</body>
</html>
