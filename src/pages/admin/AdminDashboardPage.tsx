import React, { useState, useEffect } from 'react';
import { 
  Users, MapPin, Clock, BarChart3, TrendingUp, AlertCircle, CheckCircle, 
  Activity, DollarSign, Server, Database, Zap, Shield, Settings, 
  FileText, HardDrive, Calendar, Bell, Gauge, RefreshCw
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { adminService } from '../../services/api';
import { format } from 'date-fns';

interface DashboardData {
  metrics?: {
    total_users?: number;
    active_bookings?: number;
    daily_revenue?: string;
    system_uptime?: string;
    api_response_time?: number;
    error_rate?: number;
    database_connections?: number;
  };
  recent_activity?: Array<{
    type: string;
    count: number;
    change: number;
  }>;
  system_status?: string;
  alerts?: number;
}

interface SystemHealth {
  overall_status: 'healthy' | 'warning' | 'critical';
  components: Array<{
    component: string;
    status: 'healthy' | 'warning' | 'critical';
    message: string;
    response_time_ms?: number;
    details?: any;
  }>;
  last_updated: string;
  uptime_seconds: number;
}

interface PerformanceMetrics {
  timestamp: string;
  api_response_time_avg: number;
  api_response_time_95th: number;
  database_query_time_avg: number;
  memory_usage_percent: number;
  cpu_usage_percent: number;
  disk_usage_percent: number;
  active_connections: number;
  requests_per_minute: number;
  error_rate: number;
}

interface Alert {
  id: string;
  title: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  created_at: string;
  is_active: boolean;
}

const AdminDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState<DashboardData>({});
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [performance, setPerformance] = useState<PerformanceMetrics | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [recentUsers, setRecentUsers] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const loadDashboardData = async () => {
    try {
      setRefreshing(true);
      
      // Load all dashboard data in parallel
      const [
        dashData,
        healthData,
        perfData,
        alertsData,
        usersData,
        analyticsData,
      ] = await Promise.allSettled([
        adminService.getDashboardData(),
        adminService.getSystemHealth(),
        adminService.getCurrentPerformance(),
        adminService.getSystemAlerts(true, undefined),
        adminService.getUsers(0, 5),
        adminService.getBookingAnalytics('2025-01-01', '2025-12-31'),
      ]);

      // Process dashboard data
      if (dashData.status === 'fulfilled') {
        setDashboardData(dashData.value || {});
      }

      // Process system health
      if (healthData.status === 'fulfilled') {
        setSystemHealth(healthData.value || { overall_status: 'healthy', components: [], last_updated: new Date().toISOString(), uptime_seconds: 0 });
      }

      // Process performance metrics
      if (perfData.status === 'fulfilled') {
        setPerformance(perfData.value || {});
      }

      // Process alerts
      if (alertsData.status === 'fulfilled') {
        setAlerts(alertsData.value?.alerts || []);
      }

      // Process users data
      if (usersData.status === 'fulfilled') {
        setRecentUsers(usersData.value || []);
      }

      // Process analytics data
      if (analyticsData.status === 'fulfilled') {
        setAnalytics(analyticsData.value || null);
      }


    } catch (err: any) {
      console.error('Failed to load dashboard data:', err);
      setError('Failed to load dashboard data. Some features may not work properly.');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const handleRefresh = () => {
    loadDashboardData();
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy HH:mm');
    } catch {
      return 'Invalid date';
    }
  };

  const getHealthColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600 bg-green-50';
      case 'warning': return 'text-yellow-600 bg-yellow-50';
      case 'critical': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return 'text-blue-600 bg-blue-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'high': return 'text-orange-600 bg-orange-50';
      case 'critical': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  // Main dashboard cards configuration
  const mainStats = [
    {
      title: 'Total Users',
      value: dashboardData.metrics?.total_users || 0,
      icon: Users,
      color: 'bg-blue-500',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600'
    },
    {
      title: 'Active Bookings',
      value: dashboardData.metrics?.active_bookings || 0,
      icon: Calendar,
      color: 'bg-green-500',
      bgColor: 'bg-green-50',
      textColor: 'text-green-600'
    },
    {
      title: 'Daily Revenue',
      value: `$${dashboardData.metrics?.daily_revenue || '0'}`,
      icon: DollarSign,
      color: 'bg-purple-500',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-600'
    }
  ];

  const secondaryStats = [
    {
      title: 'API Response Time',
      value: `${dashboardData.metrics?.api_response_time || 0}ms`,
      icon: Zap,
      color: 'bg-emerald-500',
      bgColor: 'bg-emerald-50',
      textColor: 'text-emerald-600'
    },
    {
      title: 'Database Connections',
      value: dashboardData.metrics?.database_connections || 0,
      icon: Database,
      color: 'bg-indigo-500',
      bgColor: 'bg-indigo-50',
      textColor: 'text-indigo-600'
    },
    {
      title: 'Active Alerts',
      value: dashboardData.alerts || 0,
      icon: Bell,
      color: 'bg-red-500',
      bgColor: 'bg-red-50',
      textColor: 'text-red-600'
    },
    {
      title: 'System Health',
      value: systemHealth?.overall_status || 'Unknown',
      icon: Activity,
      color: systemHealth?.overall_status === 'healthy' ? 'bg-green-500' : 'bg-yellow-500',
      bgColor: systemHealth?.overall_status === 'healthy' ? 'bg-green-50' : 'bg-yellow-50',
      textColor: systemHealth?.overall_status === 'healthy' ? 'text-green-600' : 'text-yellow-600'
    }
  ];

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow p-6">
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
                <div className="h-8 bg-gray-200 rounded w-1/3"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Admin Dashboard
          </h1>
          <p className="text-lg text-gray-600 mt-2">
            Welcome back, {user?.full_name || user?.name || 'Administrator'}! Here's your system overview.
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <p className="text-sm text-red-600">{error}</p>
          </div>
        </div>
      )}

      {/* Main Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {mainStats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}
                  </p>
                </div>
                <div className={`p-3 rounded-full ${stat.bgColor}`}>
                  <Icon className={`h-6 w-6 ${stat.textColor}`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {secondaryStats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">
                    {typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}
                  </p>
                </div>
                <div className={`p-3 rounded-full ${stat.bgColor}`}>
                  <Icon className={`h-5 w-5 ${stat.textColor}`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* System Health */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center space-x-2">
              <Server className="h-5 w-5 text-gray-600" />
              <h2 className="text-lg font-semibold text-gray-900">System Health</h2>
            </div>
          </div>
          <div className="p-6">
            {systemHealth ? (
              <div className="space-y-4">
                <div className={`p-3 rounded-lg ${getHealthColor(systemHealth.overall_status)}`}>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Overall Status</span>
                    <span className="capitalize">{systemHealth.overall_status}</span>
                  </div>
                </div>
                
                {(systemHealth.components || []).map((componentData, index) => (
                  <div key={componentData.component || index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className={`h-3 w-3 rounded-full ${
                        componentData.status === 'healthy' ? 'bg-green-500' :
                        componentData.status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
                      }`}></div>
                      <span className="text-sm font-medium text-gray-900 capitalize">
                        {componentData.component?.replace('_', ' ') || 'Unknown'}
                      </span>
                    </div>
                    <span className={`text-sm font-medium capitalize ${
                      componentData.status === 'healthy' ? 'text-green-600' :
                      componentData.status === 'warning' ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {componentData.status || 'Unknown'}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Server className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Health data unavailable</p>
              </div>
            )}
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center space-x-2">
              <Gauge className="h-5 w-5 text-gray-600" />
              <h2 className="text-lg font-semibold text-gray-900">Performance Metrics</h2>
            </div>
          </div>
          <div className="p-6">
            {performance ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Zap className="h-5 w-5 text-blue-600" />
                    <span className="text-sm font-medium text-gray-900">Response Time</span>
                  </div>
                  <span className="text-sm text-blue-600 font-medium">
                    {performance?.api_response_time_avg || 120}ms
                  </span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Activity className="h-5 w-5 text-green-600" />
                    <span className="text-sm font-medium text-gray-900">CPU Usage</span>
                  </div>
                  <span className="text-sm text-green-600 font-medium">
                    {performance?.cpu_usage_percent || 45}%
                  </span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Database className="h-5 w-5 text-orange-600" />
                    <span className="text-sm font-medium text-gray-900">Memory Usage</span>
                  </div>
                  <span className="text-sm text-orange-600 font-medium">
                    {performance?.memory_usage_percent || 62}%
                  </span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <HardDrive className="h-5 w-5 text-purple-600" />
                    <span className="text-sm font-medium text-gray-900">Disk Usage</span>
                  </div>
                  <span className="text-sm text-purple-600 font-medium">
                    {performance?.disk_usage_percent || 28}%
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <Gauge className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Performance data unavailable</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Users */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-gray-600" />
              <h2 className="text-lg font-semibold text-gray-900">Recent Users</h2>
            </div>
          </div>
          <div className="p-6">
            {recentUsers.length > 0 ? (
              <div className="space-y-4">
                {recentUsers.slice(0, 5).map((user) => (
                  <div key={user.id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="h-10 w-10 bg-blue-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-medium">
                          {(user.name || user.full_name || user.email || 'U').charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {user.name || user.full_name || 'Unknown User'}
                        </p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">
                        {user.created_at ? formatDate(user.created_at) : 'Unknown'}
                      </p>
                      <div className="flex items-center space-x-1 mt-1">
                        <CheckCircle className="h-3 w-3 text-green-500" />
                        <span className="text-xs text-green-600">
                          {user.is_active === false ? 'Inactive' : 'Active'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No recent users found</p>
              </div>
            )}
          </div>
        </div>

        {/* System Alerts */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center space-x-2">
              <Bell className="h-5 w-5 text-gray-600" />
              <h2 className="text-lg font-semibold text-gray-900">System Alerts</h2>
            </div>
          </div>
          <div className="p-6">
            {alerts.length > 0 ? (
              <div className="space-y-4">
                {alerts.filter(alert => alert.is_active).slice(0, 5).map((alert) => (
                  <div key={alert.id} className={`p-3 rounded-lg ${getSeverityColor(alert.severity)}`}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium">{alert.title}</p>
                        <p className="text-xs mt-1 opacity-75">
                          {formatDate(alert.created_at)}
                        </p>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs font-medium capitalize ${getSeverityColor(alert.severity)}`}>
                        {alert.severity}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <CheckCircle className="h-12 w-12 text-green-400 mx-auto mb-4" />
                <p className="text-gray-500">No active alerts</p>
                <p className="text-xs text-gray-400 mt-1">System is running smoothly</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Booking Statistics Charts - Phase 7.6 */}
      {analytics && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Booking Trends Chart */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5 text-gray-600" />
                <h2 className="text-lg font-semibold text-gray-900">Booking Trends</h2>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Total Bookings</span>
                  <span className="font-semibold text-gray-900">{analytics.total_bookings || 0}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Average Booking Value</span>
                  <span className="font-semibold text-gray-900">${analytics.average_booking_value || 0}</span>
                </div>
                <div className="mt-4">
                  <div className="text-xs text-gray-500 mb-2">Last 7 Days</div>
                  <div className="space-y-2">
                    {(analytics.booking_trends || []).map((trend: any, index: number) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="text-xs text-gray-600">{trend.date}</span>
                        <div className="flex items-center space-x-2">
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-500 h-2 rounded-full" 
                              style={{ width: `${Math.max(trend.bookings * 10, 5)}%` }}
                            ></div>
                          </div>
                          <span className="text-xs font-medium text-gray-900">{trend.bookings}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Revenue Analytics - Phase 7.7 */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center space-x-2">
                <DollarSign className="h-5 w-5 text-gray-600" />
                <h2 className="text-lg font-semibold text-gray-900">Revenue Analytics</h2>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Total Revenue</span>
                  <span className="font-semibold text-green-600">${analytics.total_revenue || 0}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Cancellation Rate</span>
                  <span className="font-semibold text-gray-900">{analytics.cancellation_rate || 0}%</span>
                </div>
                <div className="mt-4">
                  <div className="text-xs text-gray-500 mb-2">Revenue Trends</div>
                  <div className="space-y-2">
                    {(analytics.revenue_trends || []).map((trend: any, index: number) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="text-xs text-gray-600">{trend.date}</span>
                        <div className="flex items-center space-x-2">
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-green-500 h-2 rounded-full" 
                              style={{ width: `${Math.max(trend.revenue * 2, 5)}%` }}
                            ></div>
                          </div>
                          <span className="text-xs font-medium text-green-600">${trend.revenue}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Popular Routes */}
      {analytics && analytics.popular_routes && analytics.popular_routes.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-gray-600" />
              <h2 className="text-lg font-semibold text-gray-900">Popular Routes</h2>
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {analytics.popular_routes.slice(0, 5).map((route: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="h-8 w-8 bg-purple-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-medium">{index + 1}</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{route.route}</p>
                      <p className="text-xs text-gray-500">{route.bookings} bookings</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="w-16 bg-gray-200 rounded-full h-2 mb-1">
                      <div 
                        className="bg-purple-500 h-2 rounded-full" 
                        style={{ width: `${Math.max((route.bookings / Math.max(...analytics.popular_routes.map((r: any) => r.bookings))) * 100, 10)}%` }}
                      ></div>
                    </div>
                    <span className="text-xs text-gray-500">Popularity</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Real-time System Status Monitoring - Phase 7.8 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Activity className="h-5 w-5 text-gray-600" />
              <h2 className="text-lg font-semibold text-gray-900">Real-time System Status</h2>
            </div>
            <div className={`px-3 py-1 rounded-full text-xs font-medium ${
              systemHealth?.overall_status === 'healthy' ? 'bg-green-100 text-green-800' :
              systemHealth?.overall_status === 'warning' ? 'bg-yellow-100 text-yellow-800' :
              'bg-red-100 text-red-800'
            }`}>
              {systemHealth?.overall_status || 'Unknown'}
            </div>
          </div>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center space-x-2">
                <Database className="h-5 w-5 text-blue-600" />
                <span className="text-sm font-medium text-blue-900">Database</span>
              </div>
              <div className="mt-2">
                <div className="text-lg font-semibold text-blue-600">
                  {dashboardData.metrics?.database_connections || 0}
                </div>
                <div className="text-xs text-blue-600">Active Connections</div>
              </div>
            </div>
            
            <div className="p-4 bg-green-50 rounded-lg">
              <div className="flex items-center space-x-2">
                <Zap className="h-5 w-5 text-green-600" />
                <span className="text-sm font-medium text-green-900">Performance</span>
              </div>
              <div className="mt-2">
                <div className="text-lg font-semibold text-green-600">
                  {dashboardData.metrics?.api_response_time || 0}ms
                </div>
                <div className="text-xs text-green-600">Avg Response Time</div>
              </div>
            </div>

            <div className="p-4 bg-orange-50 rounded-lg">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-5 w-5 text-orange-600" />
                <span className="text-sm font-medium text-orange-900">Errors</span>
              </div>
              <div className="mt-2">
                <div className="text-lg font-semibold text-orange-600">
                  {dashboardData.metrics?.error_rate || 0}%
                </div>
                <div className="text-xs text-orange-600">Error Rate</div>
              </div>
            </div>

            <div className="p-4 bg-purple-50 rounded-lg">
              <div className="flex items-center space-x-2">
                <Activity className="h-5 w-5 text-purple-600" />
                <span className="text-sm font-medium text-purple-900">Uptime</span>
              </div>
              <div className="mt-2">
                <div className="text-lg font-semibold text-purple-600">
                  {dashboardData.metrics?.system_uptime || 'Online'}
                </div>
                <div className="text-xs text-purple-600">System Status</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <Settings className="h-5 w-5 text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
          </div>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left group">
              <Users className="h-6 w-6 text-blue-600 mb-2 group-hover:text-blue-700" />
              <h3 className="text-sm font-medium text-gray-900">Manage Users</h3>
              <p className="text-xs text-gray-500">View and edit user accounts</p>
            </button>
            
            <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left group">
              <MapPin className="h-6 w-6 text-green-600 mb-2 group-hover:text-green-700" />
              <h3 className="text-sm font-medium text-gray-900">Station Management</h3>
              <p className="text-xs text-gray-500">Add or update station information</p>
            </button>
            
            <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left group">
              <BarChart3 className="h-6 w-6 text-purple-600 mb-2 group-hover:text-purple-700" />
              <h3 className="text-sm font-medium text-gray-900">Analytics</h3>
              <p className="text-xs text-gray-500">View system analytics and reports</p>
            </button>
            
            <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left group">
              <Settings className="h-6 w-6 text-gray-600 mb-2 group-hover:text-gray-700" />
              <h3 className="text-sm font-medium text-gray-900">System Settings</h3>
              <p className="text-xs text-gray-500">Configure system parameters</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;