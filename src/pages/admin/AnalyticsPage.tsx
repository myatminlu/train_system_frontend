import React, { useState, useEffect } from 'react';
import { 
  BarChart3, TrendingUp, DollarSign, Users, Calendar, MapPin, 
  Clock, Activity, RefreshCw, Download, Filter, ArrowUp, ArrowDown
} from 'lucide-react';
import { adminService } from '../../services/api';
import { format, subDays, subMonths } from 'date-fns';

interface AnalyticsData {
  bookings?: {
    total: number;
    today: number;
    growth_rate: number;
    by_date: Array<{ date: string; count: number }>;
  };
  revenue?: {
    total: number;
    today: number;
    growth_rate: number;
    by_period: Array<{ period: string; amount: number }>;
  };
  routes?: Array<{
    id: number;
    from_station: string;
    to_station: string;
    booking_count: number;
    popularity_score: number;
  }>;
  users?: {
    total: number;
    new_today: number;
    active_users: number;
    retention_rate: number;
  };
}

const AnalyticsPage: React.FC = () => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [dateRange, setDateRange] = useState('7d');
  const [selectedMetric, setSelectedMetric] = useState('bookings');

  const loadAnalyticsData = async () => {
    try {
      setIsLoading(true);
      
      // Calculate date range
      const endDate = new Date();
      const startDate = dateRange === '7d' 
        ? subDays(endDate, 7)
        : dateRange === '30d'
        ? subDays(endDate, 30)
        : subMonths(endDate, 3);

      const [
        bookingAnalytics,
        revenueReport,
        routePopularity,
        userAnalytics,
      ] = await Promise.allSettled([
        adminService.getBookingAnalytics({
          date_from: startDate.toISOString().split('T')[0],
          date_to: endDate.toISOString().split('T')[0],
          group_by: dateRange === '7d' ? 'day' : 'week',
        }),
        adminService.getRevenueReport(dateRange === '7d' ? 'day' : dateRange === '30d' ? 'week' : 'month'),
        adminService.getRoutePopularity(10),
        adminService.getUserAnalytics(),
      ]);

      const analytics: AnalyticsData = {};

      if (bookingAnalytics.status === 'fulfilled') {
        analytics.bookings = {
          total: bookingAnalytics.value?.total_bookings || 0,
          today: bookingAnalytics.value?.today_bookings || 0,
          growth_rate: bookingAnalytics.value?.growth_rate || 0,
          by_date: bookingAnalytics.value?.bookings_by_date || [],
        };
      }

      if (revenueReport.status === 'fulfilled') {
        analytics.revenue = {
          total: revenueReport.value?.total_revenue || 0,
          today: revenueReport.value?.today_revenue || 0,
          growth_rate: revenueReport.value?.growth_rate || 0,
          by_period: revenueReport.value?.revenue_by_period || [],
        };
      }

      if (routePopularity.status === 'fulfilled') {
        analytics.routes = routePopularity.value?.popular_routes || [];
      }

      if (userAnalytics.status === 'fulfilled') {
        analytics.users = {
          total: userAnalytics.value?.total_users || 0,
          new_today: userAnalytics.value?.new_users_today || 0,
          active_users: userAnalytics.value?.active_users || 0,
          retention_rate: userAnalytics.value?.retention_rate || 0,
        };
      }

      setAnalyticsData(analytics);

    } catch (err: any) {
      console.error('Failed to load analytics:', err);
      setError('Failed to load analytics data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAnalyticsData();
  }, [dateRange]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(1)}%`;
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
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

  const keyMetrics = [
    {
      title: 'Total Bookings',
      value: analyticsData.bookings?.total || 0,
      change: analyticsData.bookings?.growth_rate || 0,
      icon: Calendar,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Revenue',
      value: formatCurrency(analyticsData.revenue?.total || 0),
      change: analyticsData.revenue?.growth_rate || 0,
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Active Users',
      value: analyticsData.users?.active_users || 0,
      change: analyticsData.users?.retention_rate || 0,
      icon: Users,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      title: 'Popular Routes',
      value: analyticsData.routes?.length || 0,
      change: 0,
      icon: MapPin,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
  ];

  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-600 mt-2">
            Track performance metrics and system usage analytics
          </p>
        </div>
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 mt-4 lg:mt-0">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="3m">Last 3 months</option>
          </select>
          <button
            onClick={loadAnalyticsData}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {keyMetrics.map((metric, index) => {
          const Icon = metric.icon;
          return (
            <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className={`p-3 rounded-full ${metric.bgColor}`}>
                  <Icon className={`h-6 w-6 ${metric.color}`} />
                </div>
                <div className="ml-4 flex-1">
                  <p className="text-sm font-medium text-gray-600">{metric.title}</p>
                  <div className="flex items-center space-x-2">
                    <p className="text-2xl font-bold text-gray-900">
                      {typeof metric.value === 'number' && metric.title !== 'Revenue' 
                        ? metric.value.toLocaleString() 
                        : metric.value
                      }
                    </p>
                    {metric.change !== 0 && (
                      <div className={`flex items-center text-sm ${
                        metric.change >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {metric.change >= 0 ? (
                          <ArrowUp className="h-4 w-4 mr-1" />
                        ) : (
                          <ArrowDown className="h-4 w-4 mr-1" />
                        )}
                        {formatPercentage(Math.abs(metric.change))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Booking Trends */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5 text-gray-600" />
              <h2 className="text-lg font-semibold text-gray-900">Booking Trends</h2>
            </div>
          </div>
          <div className="p-6">
            {analyticsData.bookings?.by_date && analyticsData.bookings.by_date.length > 0 ? (
              <div className="space-y-4">
                <div className="text-center p-8 text-gray-500">
                  <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>Booking trend chart would be rendered here</p>
                  <p className="text-sm mt-2">
                    {analyticsData.bookings.by_date.length} data points available
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No booking data available</p>
              </div>
            )}
          </div>
        </div>

        {/* Revenue Analysis */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-gray-600" />
              <h2 className="text-lg font-semibold text-gray-900">Revenue Analysis</h2>
            </div>
          </div>
          <div className="p-6">
            {analyticsData.revenue?.by_period && analyticsData.revenue.by_period.length > 0 ? (
              <div className="space-y-4">
                <div className="text-center p-8 text-gray-500">
                  <TrendingUp className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>Revenue chart would be rendered here</p>
                  <p className="text-sm mt-2">
                    Total Revenue: {formatCurrency(analyticsData.revenue.total)}
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No revenue data available</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Popular Routes */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <MapPin className="h-5 w-5 text-gray-600" />
              <h2 className="text-lg font-semibold text-gray-900">Most Popular Routes</h2>
            </div>
            <button className="flex items-center space-x-2 text-blue-600 hover:text-blue-800">
              <Download className="h-4 w-4" />
              <span>Export</span>
            </button>
          </div>
        </div>
        <div className="p-6">
          {analyticsData.routes && analyticsData.routes.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 text-sm font-medium text-gray-600">Rank</th>
                    <th className="text-left py-2 text-sm font-medium text-gray-600">Route</th>
                    <th className="text-right py-2 text-sm font-medium text-gray-600">Bookings</th>
                    <th className="text-right py-2 text-sm font-medium text-gray-600">Popularity</th>
                  </tr>
                </thead>
                <tbody>
                  {analyticsData.routes.slice(0, 10).map((route, index) => (
                    <tr key={route.id} className="border-b border-gray-100">
                      <td className="py-3 text-sm text-gray-500">#{index + 1}</td>
                      <td className="py-3">
                        <div className="text-sm font-medium text-gray-900">
                          {route.from_station} → {route.to_station}
                        </div>
                      </td>
                      <td className="py-3 text-right text-sm text-gray-900">
                        {route.booking_count.toLocaleString()}
                      </td>
                      <td className="py-3 text-right">
                        <div className="flex items-center justify-end">
                          <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full"
                              style={{ width: `${Math.min(route.popularity_score, 100)}%` }}
                            ></div>
                          </div>
                          <span className="text-sm text-gray-500">
                            {route.popularity_score.toFixed(1)}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8">
              <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No route data available</p>
            </div>
          )}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Calendar className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Today's Bookings</p>
              <p className="text-2xl font-bold text-gray-900">
                {analyticsData.bookings?.today || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Today's Revenue</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(analyticsData.revenue?.today || 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Users className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">New Users Today</p>
              <p className="text-2xl font-bold text-gray-900">
                {analyticsData.users?.new_today || 0}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;