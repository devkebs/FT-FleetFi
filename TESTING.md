# Testing Guide

## Backend Tests (PHPUnit)

### Running Tests

From the `backend` directory:

```bash
# Run all tests
php artisan test

# Run specific test file
php artisan test --filter HealthCheckTest

# Run with coverage
php artisan test --coverage
```

### Available Test Suites

- **HealthCheckTest**: Tests `/api/ping` and `/api/health` endpoints
- **AuthTest**: Registration, login, logout, and authentication
- **NotificationTest**: Notification CRUD operations and permissions
- **InvestmentTest**: Token minting, ownership validation, fractional investments
- **WalletTest**: Wallet creation, transfers, balance checks, transactions

### Test Database

Tests use SQLite in-memory database by default (configured in `phpunit.xml`). Each test runs in a transaction and is rolled back automatically.

### Factories

Database factories are available for:
- `User`: Creates test users with different roles
- `Asset`: Creates tokenizable assets (vehicles, batteries, cabinets)
- `Token`: Creates fractional ownership tokens
- `Wallet`: Creates user wallets
- `WalletTransaction`: Creates transaction history
- `Notification`: Creates user notifications

Example usage in tests:
```php
$user = User::factory()->create(['role' => 'investor']);
$asset = Asset::factory()->create(['asset_id' => 'VEH001']);
$token = Token::factory()->create([
    'user_id' => $user->id,
    'asset_id' => $asset->id,
    'fraction_owned' => 25,
]);
```

## Frontend Tests (Vitest + React Testing Library)

### Running Tests

From the root directory:

```bash
# Run all tests
npm test

# Run in watch mode
npm test -- --watch

# Run with UI
npm run test:ui

# Run with coverage
npm run test:coverage
```

### Available Test Suites

- **NotificationCenter.test.tsx**: Notification bell, dropdown, mark as read
- **InvestmentWizard.test.tsx**: Multi-step wizard, validation, ROI calculation

### Writing Component Tests

Tests use Vitest and React Testing Library. Example structure:

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import MyComponent from '../components/MyComponent';

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(
      <BrowserRouter>
        <MyComponent />
      </BrowserRouter>
    );
    
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });
});
```

### Mocking API Calls

Use `vi.mock()` to mock service modules:

```typescript
import * as api from '../services/api';

vi.mock('../services/api');

// In your test
vi.mocked(api.fetchData).mockResolvedValue({ data: [] });
```

## Continuous Integration

### GitHub Actions (Recommended)

Create `.github/workflows/test.yml`:

```yaml
name: Tests

on: [push, pull_request]

jobs:
  backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: shivammathur/setup-php@v2
        with:
          php-version: '8.1'
      - name: Install Dependencies
        run: cd backend && composer install
      - name: Run Tests
        run: cd backend && php artisan test

  frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Install Dependencies
        run: npm install
      - name: Run Tests
        run: npm test
```

## Test Coverage Goals

- **Backend API Endpoints**: >80% coverage
- **Critical Business Logic**: 100% coverage (investment validation, ownership calculation)
- **Frontend Components**: >70% coverage for interactive components

## Best Practices

1. **Isolate Tests**: Each test should be independent and not rely on others
2. **Use Factories**: Generate test data with factories instead of manual creation
3. **Mock External Services**: Don't make real API calls to third parties (TrovoTech, IdentityPass)
4. **Test User Flows**: Write integration tests for complete user journeys
5. **Clean Up**: Use `RefreshDatabase` trait and proper teardown methods
6. **Descriptive Names**: Test names should clearly describe what they're testing

## Debugging Tests

### Backend
```bash
# Run with verbose output
php artisan test --verbose

# Stop on first failure
php artisan test --stop-on-failure

# Filter by name
php artisan test --filter "can_create_wallet"
```

### Frontend
```bash
# Run specific test file
npm test NotificationCenter

# Debug mode
npm test -- --inspect-brk

# Show console output
npm test -- --reporter=verbose
```

## Adding New Tests

### Backend (Feature Test)

1. Create test file in `backend/tests/Feature/`:
```bash
php artisan make:test MyFeatureTest
```

2. Add test methods:
```php
public function test_feature_works_correctly()
{
    $response = $this->getJson('/api/endpoint');
    $response->assertStatus(200);
}
```

### Frontend (Component Test)

1. Create test file in `src/test/` matching component name:
```
src/components/MyComponent.tsx
src/test/MyComponent.test.tsx
```

2. Write test cases following existing patterns

## Common Issues

### Backend
- **Database errors**: Ensure migrations are up to date
- **Auth failures**: Use `actingAs()` or proper token authentication
- **Factory errors**: Check that all required fields have defaults

### Frontend
- **Component not found**: Ensure proper import/export syntax
- **Router errors**: Wrap components in `<BrowserRouter>` for tests
- **Async issues**: Use `waitFor()` for asynchronous operations
