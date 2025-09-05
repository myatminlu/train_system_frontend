import React, { useState } from 'react';
import type { ReactNode } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  Train, Users, Settings, LogOut, Menu, X, BarChart3, MapPin, Clock, 
  Bell, Activity, Upload, DollarSign, Building2, Route, ArrowRightLeft
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

interface AdminLayoutProps {
  children: ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const { user, isAdminAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path: string) => location.pathname === path;

  const navItems = [
    { path: '/admin/dashboard', icon: BarChart3, label: 'Dashboard' },
    { path: '/admin/users', icon: Users, label: 'User Management' },
    { path: '/admin/stations', icon: MapPin, label: 'Stations' },
    { path: '/admin/lines', icon: Train, label: 'Lines' },
    { path: '/admin/companies', icon: Building2, label: 'Companies' },
    { path: '/admin/routes', icon: Route, label: 'Routes' },
    { path: '/admin/schedules', icon: Clock, label: 'Service Schedules' },
    { path: '/admin/transfer-points', icon: ArrowRightLeft, label: 'Transfer Points' },
    { path: '/admin/fare-rules', icon: DollarSign, label: 'Fare Rules' },
    { path: '/admin/analytics', icon: Activity, label: 'Analytics' },
    { path: '/admin/alerts', icon: Bell, label: 'System Alerts' },
    { path: '/admin/bulk-data', icon: Upload, label: 'Bulk Data' },
    { path: '/admin/settings', icon: Settings, label: 'Settings' }
  ];

  return (
    <div className="min-h-screen bg-bg-light">
      {/* Sidebar for desktop */}
      <div className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0">
        <div className="flex flex-col flex-grow bg-white shadow-lg">
          {/* Logo */}
          <div className="flex items-center flex-shrink-0 px-6 py-4 border-b border-gray-200">
            <Train className="h-8 w-8 text-train-blue" />
            <span className="ml-2 text-xl font-bold text-gray-900">Admin Panel</span>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-4 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive(item.path)
                      ? 'text-train-blue bg-blue-50'
                      : 'text-gray-700 hover:text-train-blue hover:bg-gray-50'
                  }`}
                >
                  <Icon className="h-5 w-5 mr-3" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* User info and logout */}
          <div className="flex-shrink-0 px-4 py-4 border-t border-gray-200">
            {isAdminAuthenticated && user && (
              <div className="space-y-2">
                <div className="flex items-center space-x-3 px-3 py-2">
                  <div className="flex-shrink-0">
                    <div className="h-8 w-8 bg-train-blue rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-medium">
                        {(user.full_name || user.name || user.email).charAt(0).toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {user.full_name || user.name || 'Admin User'}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {user.email}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center px-3 py-2 text-sm font-medium text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors"
                >
                  <LogOut className="h-5 w-5 mr-3" />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile header */}
      <div className="lg:hidden">
        <div className="flex items-center justify-between h-16 px-4 bg-white shadow-sm border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <Train className="h-8 w-8 text-train-blue" />
            <span className="text-xl font-bold text-gray-900">Admin</span>
          </div>
          
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 rounded-md text-gray-700 hover:text-train-blue hover:bg-gray-50 transition-colors"
          >
            {isMobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>

        {/* Mobile menu */}
        {isMobileMenuOpen && (
          <div className="bg-white border-b border-gray-200">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center px-3 py-2 rounded-md text-base font-medium transition-colors ${
                      isActive(item.path)
                        ? 'text-train-blue bg-blue-50'
                        : 'text-gray-700 hover:text-train-blue hover:bg-gray-100'
                    }`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Icon className="h-5 w-5 mr-3" />
                    {item.label}
                  </Link>
                );
              })}
              
              {isAdminAuthenticated && (
                <button
                  onClick={() => {
                    handleLogout();
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center px-3 py-2 text-base font-medium text-red-600 hover:bg-red-50 rounded-md transition-colors"
                >
                  <LogOut className="h-5 w-5 mr-3" />
                  Logout
                </button>
              )}
            </div>
            
            {isAdminAuthenticated && user && (
              <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
                <div className="flex items-center space-x-3">
                  <div className="h-8 w-8 bg-train-blue rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-medium">
                      {(user.full_name || user.name || user.email).charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {user.full_name || user.name || 'Admin User'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {user.email}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;