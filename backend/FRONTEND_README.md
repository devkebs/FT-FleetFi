# FleetFi Frontend - React Application

A modern React frontend for the FleetFi tokenized EV fleet management platform.

## Tech Stack

- **React 19** - UI library
- **TypeScript** - Type safety
- **React Router** - Client-side routing
- **Tailwind CSS** - Utility-first styling
- **Vite** - Build tool and dev server
- **Axios** - HTTP client
- **Recharts** - Data visualization
- **React Leaflet** - Maps integration

## Project Structure

```
resources/js/src/
├── components/          # Reusable UI components
│   ├── Layout/         # Layout components (Header, Footer, etc.)
│   ├── LoadingSpinner.tsx
│   └── ProtectedRoute.tsx
├── contexts/           # React contexts
│   └── AuthContext.tsx # Authentication state management
├── hooks/              # Custom React hooks
│   └── useApi.ts       # API data fetching hook
├── pages/              # Page components
│   ├── Home.tsx
│   ├── Login.tsx
│   ├── Register.tsx
│   ├── Dashboard.tsx
│   ├── Vehicles.tsx
│   └── Wallet.tsx
├── services/           # API and external services
│   └── api.ts          # API service layer
├── types/              # TypeScript type definitions
│   └── index.ts
├── utils/              # Utility functions
│   └── formatters.ts   # Data formatting utilities
├── App.tsx             # Root application component
├── main.tsx            # Application entry point
└── index.css           # Global styles with Tailwind

```

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- PHP 8.1+ with Laravel 9+
- Composer

### Installation

1. Install dependencies:
```bash
npm install
```

2. Create environment file:
```bash
cp .env.development .env
```

3. Update `.env` with your API URL:
```
VITE_API_URL=http://localhost:8000/api
```

### Development

Start the development server with hot module replacement:

```bash
npm run dev
```

The Vite dev server will run alongside your Laravel backend. Access the app at `http://localhost:8000`.

### Production Build

Build the optimized production bundle:

```bash
npm run build
```

The built assets will be placed in `public/build/` and referenced automatically by Laravel's Blade template.

## Key Features

### Authentication

The app uses token-based authentication:
- Login/Register flows
- JWT token storage in localStorage
- Protected routes with automatic redirect
- Role-based access control (admin, operator, investor)

### State Management

- **AuthContext**: Global authentication state
- **useApi Hook**: Reusable data fetching with loading/error states
- **React Router**: Client-side navigation

### API Integration

The API service layer (`services/api.ts`) provides:
- Centralized HTTP client configuration
- Automatic token injection
- Response/error interceptors
- Type-safe API methods

Example usage:
```typescript
import apiService from '@/services/api';

const vehicles = await apiService.getVehicles();
const wallet = await apiService.getWallet();
```

### Styling

Tailwind CSS utility classes for responsive, modern UI:
- Mobile-first responsive design
- Dark mode ready (can be enabled)
- Custom color scheme matching FleetFi branding
- Consistent spacing and typography

## Available Routes

| Route | Component | Access | Description |
|-------|-----------|--------|-------------|
| `/` | Home | Public | Landing page |
| `/login` | Login | Public | User login |
| `/register` | Register | Public | User registration |
| `/dashboard` | Dashboard | Protected | User dashboard |
| `/vehicles` | Vehicles | Protected | Vehicle management |
| `/wallet` | Wallet | Protected | Wallet & transactions |

## Component Patterns

### Protected Routes

```typescript
<Route
  path="/dashboard"
  element={
    <ProtectedRoute>
      <Dashboard />
    </ProtectedRoute>
  }
/>
```

### Using Auth Context

```typescript
import { useAuth } from '@/contexts/AuthContext';

const MyComponent = () => {
  const { user, isAuthenticated, login, logout } = useAuth();

  // Use authentication state
};
```

### API Calls with useApi Hook

```typescript
import { useApi } from '@/hooks/useApi';
import apiService from '@/services/api';

const MyComponent = () => {
  const { data, isLoading, error, execute } = useApi(
    apiService.getVehicles,
    { immediate: true }
  );

  // data, loading, and error states are managed automatically
};
```

## Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API base URL | `http://localhost:8000/api` |

## Adding New Pages

1. Create page component in `resources/js/src/pages/`
2. Add route in `App.tsx`
3. Add navigation link in `Header.tsx` (if needed)
4. Create API methods in `services/api.ts` (if needed)

Example:
```typescript
// pages/NewPage.tsx
import React from 'react';

const NewPage: React.FC = () => {
  return <div>New Page</div>;
};

export default NewPage;

// App.tsx
import NewPage from './pages/NewPage';

<Route path="/new" element={<NewPage />} />
```

## Type Safety

TypeScript types are defined in `types/index.ts`. Add new types as needed:

```typescript
export interface MyNewType {
  id: number;
  name: string;
}
```

## Best Practices

1. **Use TypeScript**: Define types for all props and API responses
2. **Reuse Components**: Extract common UI patterns into components
3. **Error Handling**: Always handle loading and error states
4. **Lazy Loading**: Use React.lazy() for code splitting on larger pages
5. **Accessibility**: Use semantic HTML and ARIA labels
6. **Responsive Design**: Test on mobile, tablet, and desktop

## Troubleshooting

### Vite not finding modules
- Ensure `tsconfig.json` paths are correct
- Restart the dev server

### API calls failing
- Check CORS settings in Laravel backend
- Verify `VITE_API_URL` in `.env`
- Check browser network tab for errors

### Styling not applying
- Ensure Tailwind classes are in content paths
- Run `npm run build` to regenerate styles
- Clear browser cache

## Integration with Laravel

The React app is served by Laravel using Blade templates:
- Entry point: `resources/views/app.blade.php`
- Vite builds assets to `public/build/`
- All routes are caught by Laravel and served to React Router

Web route configuration in `routes/web.php`:
```php
Route::get('/{any}', function () {
    return view('app');
})->where('any', '.*');
```

## Next Steps

Consider adding:
- [ ] Investment management pages
- [ ] Fleet operations interface
- [ ] Real-time notifications
- [ ] Data visualization charts
- [ ] File upload components
- [ ] Advanced filtering and search
- [ ] Export functionality
- [ ] Multi-language support
- [ ] PWA capabilities
- [ ] Unit and integration tests

## Resources

- [React Documentation](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS](https://tailwindcss.com/)
- [React Router](https://reactrouter.com/)
- [Vite](https://vitejs.dev/)
