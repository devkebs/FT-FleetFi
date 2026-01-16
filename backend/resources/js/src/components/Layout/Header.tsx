import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const Header: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <header className="bg-blue-600 text-white shadow-lg">
      <nav className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="text-2xl font-bold">
            FleetFi
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            {isAuthenticated ? (
              <>
                <Link to="/dashboard" className="hover:text-blue-200 transition">
                  Dashboard
                </Link>
                {user?.role === 'operator' && (
                  <>
                    <Link to="/vehicles" className="hover:text-blue-200 transition">
                      Vehicles
                    </Link>
                    <Link to="/operations" className="hover:text-blue-200 transition">
                      Operations
                    </Link>
                  </>
                )}
                {user?.role === 'investor' && (
                  <>
                    <Link to="/investments" className="hover:text-blue-200 transition">
                      Investments
                    </Link>
                    <Link to="/portfolio" className="hover:text-blue-200 transition">
                      Portfolio
                    </Link>
                  </>
                )}
                {user?.role === 'admin' && (
                  <Link to="/admin" className="hover:text-blue-200 transition">
                    Admin
                  </Link>
                )}
                <Link to="/wallet" className="hover:text-blue-200 transition">
                  Wallet
                </Link>
                <div className="flex items-center space-x-4">
                  <span className="text-sm">
                    {user?.name} ({user?.role})
                  </span>
                  <button
                    onClick={handleLogout}
                    className="bg-blue-700 hover:bg-blue-800 px-4 py-2 rounded-lg transition"
                  >
                    Logout
                  </button>
                </div>
              </>
            ) : (
              <>
                <Link to="/login" className="hover:text-blue-200 transition">
                  Login
                </Link>
                <Link
                  to="/register"
                  className="bg-white text-blue-600 px-4 py-2 rounded-lg hover:bg-blue-50 transition"
                >
                  Register
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              {isMenuOpen ? (
                <path d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden mt-4 pb-4 space-y-2">
            {isAuthenticated ? (
              <>
                <Link
                  to="/dashboard"
                  className="block py-2 hover:text-blue-200 transition"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Dashboard
                </Link>
                {user?.role === 'operator' && (
                  <>
                    <Link
                      to="/vehicles"
                      className="block py-2 hover:text-blue-200 transition"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Vehicles
                    </Link>
                    <Link
                      to="/operations"
                      className="block py-2 hover:text-blue-200 transition"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Operations
                    </Link>
                  </>
                )}
                {user?.role === 'investor' && (
                  <>
                    <Link
                      to="/investments"
                      className="block py-2 hover:text-blue-200 transition"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Investments
                    </Link>
                    <Link
                      to="/portfolio"
                      className="block py-2 hover:text-blue-200 transition"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Portfolio
                    </Link>
                  </>
                )}
                <Link
                  to="/wallet"
                  className="block py-2 hover:text-blue-200 transition"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Wallet
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full text-left py-2 hover:text-blue-200 transition"
                >
                  Logout ({user?.name})
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="block py-2 hover:text-blue-200 transition"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="block py-2 hover:text-blue-200 transition"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Register
                </Link>
              </>
            )}
          </div>
        )}
      </nav>
    </header>
  );
};

export default Header;
