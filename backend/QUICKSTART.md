# FleetFi - Quick Start Guide

## Frontend Setup Complete! 🎉

Your FleetFi application now has a modern React frontend with TypeScript, Tailwind CSS, and full integration with your Laravel backend.

## What Was Built

### Technology Stack
- **React 19** with TypeScript
- **Tailwind CSS** for styling
- **React Router** for navigation
- **Vite** for fast development and building
- **Axios** for API communication
- Token-based authentication

### Project Structure
```
resources/js/src/
├── components/     # Reusable UI components
├── contexts/       # React contexts (Auth, etc.)
├── hooks/          # Custom React hooks
├── pages/          # Page components
├── services/       # API service layer
├── types/          # TypeScript definitions
└── utils/          # Utility functions
```

### Pages Created
1. **Home** (`/`) - Landing page
2. **Login** (`/login`) - User authentication
3. **Register** (`/register`) - User registration
4. **Dashboard** (`/dashboard`) - Main dashboard (protected)
5. **Vehicles** (`/vehicles`) - Vehicle management (protected)
6. **Wallet** (`/wallet`) - Wallet & transactions (protected)

## Getting Started

### 1. Install Dependencies (Already Done)
```bash
npm install
```

### 2. Start Development Server
```bash
# Terminal 1: Start Laravel backend
php artisan serve

# Terminal 2: Start Vite dev server
npm run dev
```

Access the app at: `http://localhost:8000`

### 3. Environment Configuration

Create a `.env` file in the root if you haven't already, and ensure these variables are set:

```env
# Laravel Backend
APP_URL=http://localhost:8000

# Frontend (create .env.development for Vite)
VITE_API_URL=http://localhost:8000/api
```

## Development Workflow

### Hot Module Replacement (HMR)
The Vite dev server provides instant updates when you change files:
- Edit any `.tsx` or `.ts` file
- Changes appear immediately in the browser
- State is preserved during updates

### Making API Calls

Use the API service layer:

```typescript
import apiService from '@/services/api';

// In your component
const fetchData = async () => {
  const vehicles = await apiService.getVehicles();
  const wallet = await apiService.getWallet();
};
```

### Using Authentication

```typescript
import { useAuth } from '@/contexts/AuthContext';

const MyComponent = () => {
  const { user, isAuthenticated, login, logout } = useAuth();

  // Check if user is logged in
  if (!isAuthenticated) {
    return <div>Please login</div>;
  }

  return <div>Welcome, {user.name}!</div>;
};
```

### Protected Routes

Routes are already protected. To add a new protected route:

```typescript
// In App.tsx
<Route
  path="/my-page"
  element={
    <ProtectedRoute>
      <MyPage />
    </ProtectedRoute>
  }
/>
```

### Role-Based Access

Restrict by role:

```typescript
<ProtectedRoute roles={['admin', 'operator']}>
  <AdminPage />
</ProtectedRoute>
```

## Building for Production

```bash
npm run build
```

This creates optimized assets in `public/build/`. Laravel automatically serves these in production.

## Common Commands

```bash
# Development
npm run dev              # Start Vite dev server

# Production
npm run build           # Build for production

# Backend
php artisan serve       # Start Laravel backend
php artisan migrate     # Run migrations
php artisan db:seed     # Seed database
```

## Testing the Application

### 1. Create a Test User
```bash
php artisan db:seed --class=TestUsersSeeder
```

### 2. Login Credentials
Use the credentials from your seeder, for example:
- Email: `operator1@fleetfi.com`
- Password: `password`

### 3. Test the Flow
1. Visit `http://localhost:8000`
2. Click "Register" or "Login"
3. Login with test credentials
4. Access the dashboard
5. Navigate to Vehicles, Wallet, etc.

## File Structure

### Adding a New Page

1. **Create the page component**:
```typescript
// resources/js/src/pages/MyNewPage.tsx
import React from 'react';

const MyNewPage: React.FC = () => {
  return (
    <div>
      <h1 className="text-3xl font-bold">My New Page</h1>
    </div>
  );
};

export default MyNewPage;
```

2. **Add the route**:
```typescript
// resources/js/src/App.tsx
import MyNewPage from './pages/MyNewPage';

<Route path="/my-page" element={<MyNewPage />} />
```

3. **Add navigation link**:
```typescript
// resources/js/src/components/Layout/Header.tsx
<Link to="/my-page" className="hover:text-blue-200 transition">
  My Page
</Link>
```

### Adding API Endpoints

1. **Add method to API service**:
```typescript
// resources/js/src/services/api.ts
async getMyData() {
  const response = await this.client.get('/my-endpoint');
  return response.data;
}
```

2. **Use in component**:
```typescript
import apiService from '@/services/api';
import { useApi } from '@/hooks/useApi';

const MyComponent = () => {
  const { data, isLoading, error } = useApi(
    apiService.getMyData,
    { immediate: true }
  );
};
```

## Styling with Tailwind

Use Tailwind utility classes:

```tsx
<div className="bg-white p-6 rounded-lg shadow-md">
  <h2 className="text-2xl font-bold text-gray-900 mb-4">Title</h2>
  <p className="text-gray-600">Content</p>
  <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
    Click Me
  </button>
</div>
```

### Common Patterns

**Card Component**:
```tsx
<div className="bg-white p-6 rounded-lg shadow-md">
  {/* content */}
</div>
```

**Button**:
```tsx
<button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
  Button
</button>
```

**Input**:
```tsx
<input
  type="text"
  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
/>
```

## Troubleshooting

### Build Errors
```bash
# Clear node modules and reinstall
rm -rf node_modules
npm install
```

### Port Already in Use
```bash
# Vite uses port 5173 by default
# Kill the process or change the port in vite.config.ts
```

### API CORS Issues
Make sure your Laravel backend has CORS properly configured in `config/cors.php`:
```php
'paths' => ['api/*', 'sanctum/csrf-cookie'],
'allowed_origins' => ['http://localhost:5173', 'http://localhost:8000'],
'supports_credentials' => true,
```

### TypeScript Errors
```bash
# Check TypeScript configuration
npx tsc --noEmit
```

## Next Steps

### Recommended Additions

1. **More Pages**
   - Investment management
   - Fleet operations dashboard
   - Revenue analytics
   - Admin panel

2. **Components**
   - Data tables with sorting/filtering
   - Charts and graphs (using Recharts)
   - File upload components
   - Notification system

3. **Features**
   - Real-time updates (WebSockets)
   - Export to CSV/PDF
   - Advanced search and filtering
   - Multi-language support (i18n)

4. **Testing**
   - Unit tests with Vitest
   - Component tests with React Testing Library
   - E2E tests with Playwright

5. **Performance**
   - Code splitting with React.lazy()
   - Image optimization
   - Caching strategies

## Resources

- **React**: https://react.dev/
- **TypeScript**: https://www.typescriptlang.org/
- **Tailwind CSS**: https://tailwindcss.com/
- **React Router**: https://reactrouter.com/
- **Vite**: https://vitejs.dev/

For detailed documentation, see `FRONTEND_README.md`.

## Support

If you encounter issues:
1. Check the browser console for errors
2. Check the network tab for API errors
3. Review the Laravel logs in `storage/logs/laravel.log`
4. Ensure both servers (Laravel + Vite) are running

Happy coding! 🚀
